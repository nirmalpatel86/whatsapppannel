const { Chat, Contact, Message, WhatsappAccount, User } = require('../models');
const sessionManager = require('../whatsapp/sessionManager');
const walletService = require('../services/walletService');
const { Op } = require('sequelize');
const path = require('path');
const { getVisibleCompanyIds } = require('../utils/scopeHelper');

const getMediaType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'document';
};

exports.listChats = async (req, res) => {
  try {
    const { whatsappAccountId, search } = req.query;
    const where = {};

    if (req.user.role === 'super_admin') {
      where.companyId = req.query.companyId || req.user.companyId;
    } else if (req.user.role === 'admin' || req.user.role === 'reseller') {
      where.companyId = { [Op.in]: await getVisibleCompanyIds(User, req.user) };
    } else {
      const userAccountIds = (await WhatsappAccount.findAll({ where: { createdBy: req.user.id }, attributes: ['id'], raw: true })).map(a => a.id);
      where.whatsappAccountId = { [Op.in]: userAccountIds };
    }
    if (whatsappAccountId) where.whatsappAccountId = whatsappAccountId;

    const chats = await Chat.findAll({
      where,
      include: [
        {
          model: Contact,
          ...(search ? {
            where: {
              [Op.or]: [
                { name: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
                { pushName: { [Op.like]: `%${search}%` } },
              ],
            },
          } : {}),
        },
        { model: WhatsappAccount, attributes: ['id', 'name', 'phone'] },
      ],
      order: [['lastMessageAt', 'DESC']],
    });
    res.json({ chats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findByPk(chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(chat.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const messages = await Message.findAndCountAll({
      where: { chatId },
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    // Mark as read
    await chat.update({ unreadCount: 0 });

    res.json({
      messages: messages.rows.reverse(),
      total: messages.count,
      page: parseInt(page),
      totalPages: Math.ceil(messages.count / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { body, type = 'text', mediaUrl, messageCategory = 'text_only' } = req.body;

    const chat = await Chat.findByPk(chatId, {
      include: [{ model: Contact }, { model: WhatsappAccount }],
    });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(chat.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Check balance before sending
    const balanceCheck = await walletService.checkBalance(req.user.id, 1, messageCategory);
    if (!balanceCheck.canSend) {
      return res.status(402).json({
        error: `Insufficient balance. Need ${balanceCheck.costPerMessage.toFixed(4)}, have ${balanceCheck.balance.toFixed(4)}`,
        balance: balanceCheck.balance,
        costPerMessage: balanceCheck.costPerMessage,
      });
    }

    const result = await sessionManager.sendMessage(chat.whatsappAccountId, chat.Contact.phone, {
      type,
      body,
      mediaUrl,
    });

    const message = await Message.create({
      chatId: chat.id,
      whatsappAccountId: chat.whatsappAccountId,
      contactId: chat.contactId,
      companyId: chat.companyId,
      waMessageId: result.key.id,
      direction: 'outbound',
      type,
      body,
      mediaUrl,
      status: 'sent',
      sentBy: req.user.id,
      timestamp: new Date(),
    });

    // Deduct balance after successful send
    const deduction = await walletService.deductForMessage({
      userId: req.user.id,
      messageId: message.id,
      recipientPhone: chat.Contact.phone,
      category: messageCategory,
    });

    await chat.update({
      lastMessage: body || `[${type}]`,
      lastMessageAt: new Date(),
    });

    res.json({ message: message.toJSON(), cost: deduction.cost, balance: deduction.wallet.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sendNewMessage = async (req, res) => {
  try {
    const { whatsappAccountId, phone, body, type = 'text', mediaUrl, messageCategory = 'text_only' } = req.body;

    const account = await WhatsappAccount.findByPk(whatsappAccountId);
    if (!account) return res.status(404).json({ error: 'WhatsApp account not found' });

    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(account.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Check balance before sending
    const balanceCheck = await walletService.checkBalance(req.user.id, 1, messageCategory);
    if (!balanceCheck.canSend) {
      return res.status(402).json({
        error: `Insufficient balance. Need ${balanceCheck.costPerMessage.toFixed(4)}, have ${balanceCheck.balance.toFixed(4)}`,
      });
    }

    let [contact] = await Contact.findOrCreate({
      where: { companyId: account.companyId, phone },
      defaults: { name: phone },
    });

    let [chat] = await Chat.findOrCreate({
      where: { contactId: contact.id, whatsappAccountId },
      defaults: { companyId: account.companyId },
    });

    const result = await sessionManager.sendMessage(whatsappAccountId, phone, {
      type,
      body,
      mediaUrl,
    });

    const message = await Message.create({
      chatId: chat.id,
      whatsappAccountId,
      contactId: contact.id,
      companyId: account.companyId,
      waMessageId: result.key.id,
      direction: 'outbound',
      type,
      body,
      mediaUrl,
      status: 'sent',
      sentBy: req.user.id,
      timestamp: new Date(),
    });

    // Deduct balance after successful send
    const deduction = await walletService.deductForMessage({
      userId: req.user.id,
      messageId: message.id,
      recipientPhone: phone,
      category: messageCategory,
    });

    await chat.update({
      lastMessage: body || `[${type}]`,
      lastMessageAt: new Date(),
    });

    res.json({ message: message.toJSON(), chat: chat.toJSON(), cost: deduction.cost, balance: deduction.wallet.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sendAttachment = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { caption = '' } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const chat = await Chat.findByPk(chatId, {
      include: [{ model: Contact }, { model: WhatsappAccount }],
    });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(chat.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const msgType = getMediaType(file.mimetype);
    const mediaUrl = `/uploads/${file.filename}`;
    const mediaPath = path.join(__dirname, '..', 'uploads', file.filename);

    const balanceCheck = await walletService.checkBalance(req.user.id, 1, 'text_only');
    if (!balanceCheck.canSend) {
      return res.status(402).json({ error: 'Insufficient balance' });
    }

    const content = { type: msgType, body: caption, mediaUrl: mediaPath };
    if (msgType === 'document') {
      content.fileName = file.originalname;
      content.mimetype = file.mimetype;
    }
    const result = await sessionManager.sendMessage(chat.whatsappAccountId, chat.Contact.phone, content);

    const message = await Message.create({
      chatId: chat.id,
      whatsappAccountId: chat.whatsappAccountId,
      contactId: chat.contactId,
      companyId: chat.companyId,
      waMessageId: result.key.id,
      direction: 'outbound',
      type: msgType,
      body: caption,
      mediaUrl,
      status: 'sent',
      sentBy: req.user.id,
      timestamp: new Date(),
    });

    const deduction = await walletService.deductForMessage({
      userId: req.user.id, messageId: message.id,
      recipientPhone: chat.Contact.phone, category: 'text_only',
    });

    await chat.update({ lastMessage: caption || `[${msgType}]`, lastMessageAt: new Date() });
    res.json({ message: message.toJSON(), cost: deduction.cost, balance: deduction.wallet.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sendNewAttachment = async (req, res) => {
  try {
    const { whatsappAccountId, phone, caption = '' } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const account = await WhatsappAccount.findByPk(whatsappAccountId);
    if (!account) return res.status(404).json({ error: 'WhatsApp account not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(account.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const balanceCheck = await walletService.checkBalance(req.user.id, 1, 'text_only');
    if (!balanceCheck.canSend) {
      return res.status(402).json({ error: 'Insufficient balance' });
    }

    let [contact] = await Contact.findOrCreate({
      where: { companyId: account.companyId, phone },
      defaults: { name: phone },
    });

    let [chat] = await Chat.findOrCreate({
      where: { contactId: contact.id, whatsappAccountId: parseInt(whatsappAccountId) },
      defaults: { companyId: account.companyId },
    });

    const msgType = getMediaType(file.mimetype);
    const mediaUrl = `/uploads/${file.filename}`;
    const mediaPath = path.join(__dirname, '..', 'uploads', file.filename);

    const content = { type: msgType, body: caption, mediaUrl: mediaPath };
    if (msgType === 'document') {
      content.fileName = file.originalname;
      content.mimetype = file.mimetype;
    }
    const result = await sessionManager.sendMessage(parseInt(whatsappAccountId), phone, content);

    const message = await Message.create({
      chatId: chat.id,
      whatsappAccountId: parseInt(whatsappAccountId),
      contactId: contact.id,
      companyId: account.companyId,
      waMessageId: result.key.id,
      direction: 'outbound',
      type: msgType,
      body: caption,
      mediaUrl,
      status: 'sent',
      sentBy: req.user.id,
      timestamp: new Date(),
    });

    const deduction = await walletService.deductForMessage({
      userId: req.user.id, messageId: message.id,
      recipientPhone: phone, category: 'text_only',
    });

    await chat.update({ lastMessage: caption || `[${msgType}]`, lastMessageAt: new Date() });
    res.json({ message: message.toJSON(), chat: chat.toJSON(), cost: deduction.cost, balance: deduction.wallet.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
