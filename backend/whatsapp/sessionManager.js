const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, downloadMediaMessage } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const { WhatsappAccount, Contact, Chat, Message } = require('../models');

const sessions = new Map();
let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const emitToCompany = (companyId, event, data) => {
  if (ioInstance) {
    ioInstance.to(`company_${companyId}`).emit(event, data);
  }
};

const sessionsDir = path.join(__dirname, '..', 'wa_sessions');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

const createSession = async (accountId) => {
  const account = await WhatsappAccount.findByPk(accountId);
  if (!account) throw new Error('WhatsApp account not found');

  if (sessions.has(accountId)) {
    const existing = sessions.get(accountId);
    try {
      if (existing.end) existing.end();
      else if (existing.ws?.close) existing.ws.close();
    } catch (e) {}
    sessions.delete(accountId);
  }

  const sessionPath = path.join(sessionsDir, `session_${accountId}`);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: ['WhatsApp Panel', 'Chrome', '1.0.0'],
  });

  sessions.set(accountId, sock);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      await account.update({ status: 'qr_pending' });
      emitToCompany(account.companyId, 'qr', { accountId, qr });
    }

    if (connection === 'open') {
      const phone = sock.user?.id?.split(':')[0] || sock.user?.id?.split('@')[0];
      await account.update({ status: 'connected', phone });
      emitToCompany(account.companyId, 'connection_update', {
        accountId,
        status: 'connected',
        phone,
      });
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      await account.update({ status: 'disconnected' });
      emitToCompany(account.companyId, 'connection_update', {
        accountId,
        status: 'disconnected',
      });
      if (shouldReconnect) {
        setTimeout(() => createSession(accountId), 3000);
      } else {
        sessions.delete(accountId);
        const sessionPath2 = path.join(sessionsDir, `session_${accountId}`);
        if (fs.existsSync(sessionPath2)) {
          fs.rmSync(sessionPath2, { recursive: true });
        }
      }
    }
  });

  // Message status updates (sent → delivered → read)
  sock.ev.on('messages.update', async (updates) => {
    for (const update of updates) {
      try {
        if (!update.key || !update.update) continue;
        const waMessageId = update.key.id;
        const statusMap = { 2: 'sent', 3: 'delivered', 4: 'read' };
        const newStatus = statusMap[update.update.status];
        if (!newStatus) continue;

        const message = await Message.findOne({ where: { waMessageId, whatsappAccountId: accountId } });
        if (!message) continue;
        if (message.direction !== 'outbound') continue;

        const statusOrder = { pending: 0, sent: 1, delivered: 2, read: 3, failed: -1 };
        if ((statusOrder[newStatus] || 0) <= (statusOrder[message.status] || 0)) continue;

        await message.update({ status: newStatus });
        emitToCompany(account.companyId, 'message_status', {
          messageId: message.id,
          chatId: message.chatId,
          waMessageId,
          status: newStatus,
        });
      } catch (err) {
        console.error('Error processing message status update:', err);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages: msgs, type: upsertType }) => {
    console.log('[INCOMING] messages.upsert event, type:', upsertType, 'count:', msgs.length);
    if (upsertType !== 'notify') return;

    for (const msg of msgs) {
      console.log('[INCOMING] msg from:', msg.key.remoteJid, 'fromMe:', msg.key.fromMe, 'hasMessage:', !!msg.message);
      if (msg.key.fromMe) continue;
      if (!msg.message) continue;

      const remoteJid = msg.key.remoteJid;
      if (!remoteJid) continue;

      let phone;
      if (remoteJid.endsWith('@s.whatsapp.net')) {
        phone = remoteJid.split('@')[0];
      } else if (remoteJid.endsWith('@lid')) {
        try {
          const pnJid = await sock.signalRepository?.lidMapping?.getPNForLID(remoteJid);
          if (pnJid) {
            phone = pnJid.split('@')[0].split(':')[0];
            console.log('[INCOMING] Resolved LID', remoteJid, '→ phone:', phone);
          } else {
            console.log('[INCOMING] Could not resolve LID to phone:', remoteJid, '- using LID user as identifier');
            phone = remoteJid.split('@')[0];
          }
        } catch (lidErr) {
          console.error('[INCOMING] LID resolution error:', lidErr.message);
          phone = remoteJid.split('@')[0];
        }
      } else {
        console.log('[INCOMING] Skipped non-user JID:', remoteJid);
        continue;
      }
      const pushName = msg.pushName || '';
      console.log('[INCOMING] Processing message from phone:', phone, 'pushName:', pushName);

      try {
        let [contact] = await Contact.findOrCreate({
          where: { companyId: account.companyId, phone },
          defaults: { name: pushName, pushName, lastMessageAt: new Date() },
        });
        if (pushName && contact.pushName !== pushName) {
          await contact.update({ pushName, name: contact.name || pushName });
        }

        let [chat] = await Chat.findOrCreate({
          where: { contactId: contact.id, whatsappAccountId: accountId },
          defaults: { companyId: account.companyId },
        });

        const body = msg.message.conversation
          || msg.message.extendedTextMessage?.text
          || msg.message.imageMessage?.caption
          || msg.message.videoMessage?.caption
          || '';

        let msgType = 'text';
        let mediaUrl = null;
        if (msg.message.imageMessage) msgType = 'image';
        else if (msg.message.videoMessage) msgType = 'video';
        else if (msg.message.audioMessage) msgType = 'audio';
        else if (msg.message.documentMessage) msgType = 'document';
        else if (msg.message.stickerMessage) msgType = 'sticker';

        if (msgType !== 'text') {
          try {
            const buffer = await downloadMediaMessage(msg, 'buffer', {});
            const ext = { image: '.jpg', video: '.mp4', audio: '.ogg', document: '.bin', sticker: '.webp' }[msgType] || '.bin';
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
            const uploadsDir = path.join(__dirname, '..', 'uploads');
            fs.writeFileSync(path.join(uploadsDir, fileName), buffer);
            mediaUrl = `/uploads/${fileName}`;
          } catch (dlErr) {
            console.error('[INCOMING] Failed to download media:', dlErr.message);
          }
        }

        const message = await Message.create({
          chatId: chat.id,
          whatsappAccountId: accountId,
          contactId: contact.id,
          companyId: account.companyId,
          waMessageId: msg.key.id,
          direction: 'inbound',
          type: msgType,
          body,
          mediaUrl,
          status: 'delivered',
          timestamp: new Date(msg.messageTimestamp * 1000),
        });

        await chat.update({
          lastMessage: body || `[${msgType}]`,
          lastMessageAt: new Date(msg.messageTimestamp * 1000),
          unreadCount: chat.unreadCount + 1,
        });

        await contact.update({ lastMessageAt: new Date(msg.messageTimestamp * 1000) });

        emitToCompany(account.companyId, 'new_message', {
          message: message.toJSON(),
          chat: chat.toJSON(),
          contact: contact.toJSON(),
        });
        console.log('[INCOMING] Message saved and emitted, chatId:', chat.id, 'messageId:', message.id);
      } catch (err) {
        console.error('[INCOMING] Error processing incoming message:', err);
      }
    }
  });

  return sock;
};

const sendMessage = async (accountId, phone, content) => {
  const sock = sessions.get(accountId);
  if (!sock) throw new Error('Session not connected');

  const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;

  if (content.type === 'text') {
    return sock.sendMessage(jid, { text: content.body });
  } else if (content.type === 'image') {
    return sock.sendMessage(jid, {
      image: { url: content.mediaUrl },
      caption: content.body || '',
    });
  } else if (content.type === 'video') {
    return sock.sendMessage(jid, {
      video: { url: content.mediaUrl },
      caption: content.body || '',
    });
  } else if (content.type === 'audio') {
    return sock.sendMessage(jid, {
      audio: { url: content.mediaUrl },
      mimetype: 'audio/mpeg',
    });
  } else if (content.type === 'document') {
    return sock.sendMessage(jid, {
      document: { url: content.mediaUrl },
      mimetype: content.mimetype || 'application/pdf',
      fileName: content.fileName || 'document',
    });
  }
};

const getSession = (accountId) => sessions.get(accountId);
const isConnected = (accountId) => sessions.has(accountId);

const disconnectSession = async (accountId) => {
  const sock = sessions.get(accountId);
  if (sock) {
    await sock.logout();
    sessions.delete(accountId);
  }
};

const restoreSessions = async () => {
  const accounts = await WhatsappAccount.findAll({
    where: { status: 'connected', provider: 'baileys' },
  });
  for (const account of accounts) {
    try {
      await createSession(account.id);
    } catch (err) {
      console.error(`Failed to restore session ${account.id}:`, err.message);
    }
  }
};

module.exports = {
  setIO,
  createSession,
  sendMessage,
  getSession,
  isConnected,
  disconnectSession,
  restoreSessions,
  sessions,
};
