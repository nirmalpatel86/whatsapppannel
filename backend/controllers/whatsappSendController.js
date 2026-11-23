const { Contact, Chat, Message } = require('../models');
const sessionManager = require('../whatsapp/sessionManager');
const walletService = require('../services/walletService');

const MEDIA_EXT = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  video: ['mp4', 'mov', 'avi', 'mkv'],
  audio: ['mp3', 'ogg', 'wav', 'm4a'],
};

function guessMediaType(mediaUrl) {
  const ext = (mediaUrl.split('.').pop() || '').toLowerCase().split('?')[0];
  for (const [type, exts] of Object.entries(MEDIA_EXT)) {
    if (exts.includes(ext)) return type;
  }
  return 'document';
}

exports.sendMessage = async (req, res) => {
  try {
    const { to, message, media_url: mediaUrl } = req.body;
    if (!to || (!message && !mediaUrl)) {
      return res.status(400).json({ success: false, error: 'to and (message or media_url) are required' });
    }

    const apiKeyRecord = req.apiKeyRecord;
    const account = apiKeyRecord.WhatsappAccount;
    if (!account) {
      return res.status(400).json({ success: false, error: 'No WhatsApp account linked to this API key' });
    }
    if (!sessionManager.isConnected(account.id)) {
      return res.status(400).json({ success: false, error: 'WhatsApp account is not connected' });
    }

    const balanceCheck = await walletService.checkBalance(apiKeyRecord.userId, 1, 'text_only');
    if (!balanceCheck.canSend) {
      return res.status(402).json({
        success: false,
        error: `Insufficient balance. Need ${balanceCheck.costPerMessage.toFixed(4)}, have ${balanceCheck.balance.toFixed(4)}`,
        balance: balanceCheck.balance,
      });
    }

    let phone = String(to).replace(/[^0-9]/g, '');
    if (phone.length === 10) {
      const countryCode = apiKeyRecord.User?.countryCode || '91';
      phone = `${countryCode}${phone}`;
    }
    const msgType = mediaUrl ? guessMediaType(mediaUrl) : 'text';

    const [contact] = await Contact.findOrCreate({
      where: { companyId: account.companyId, phone },
      defaults: { name: phone },
    });

    const [chat] = await Chat.findOrCreate({
      where: { contactId: contact.id, whatsappAccountId: account.id },
      defaults: { companyId: account.companyId },
    });

    const result = await sessionManager.sendMessage(account.id, phone, { type: msgType, body: message, mediaUrl });

    const msg = await Message.create({
      chatId: chat.id,
      whatsappAccountId: account.id,
      contactId: contact.id,
      companyId: account.companyId,
      waMessageId: result.key.id,
      direction: 'outbound',
      type: msgType,
      body: message,
      mediaUrl,
      status: 'sent',
      sentBy: apiKeyRecord.userId,
      timestamp: new Date(),
    });

    const deduction = await walletService.deductForMessage({
      userId: apiKeyRecord.userId,
      messageId: msg.id,
      recipientPhone: phone,
      category: 'text_only',
    });

    await chat.update({ lastMessage: message || `[${msgType}]`, lastMessageAt: new Date() });
    await apiKeyRecord.update({ lastUsedAt: new Date() });

    res.json({
      success: true,
      message: 'Message sent successfully',
      to: phone,
      messageId: msg.id,
      cost: deduction.cost,
      balance: deduction.wallet.balance,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getBalance = async (req, res) => {
  try {
    const apiKeyRecord = req.apiKeyRecord;
    const { balance } = await walletService.checkBalance(apiKeyRecord.userId);
    await apiKeyRecord.update({ lastUsedAt: new Date() });
    res.json({ success: true, balance });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
