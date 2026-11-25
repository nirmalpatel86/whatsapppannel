const { Campaign, WhatsappAccount, Contact, Message, Chat, ContactGroup, User, Transaction } = require('../models');
const sessionManager = require('../whatsapp/sessionManager');
const walletService = require('../services/walletService');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../utils/scopeHelper');

exports.list = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'super_admin') {
      where.companyId = req.query.companyId || req.user.companyId;
    } else if (req.user.role === 'admin' || req.user.role === 'reseller') {
      where.companyId = { [Op.in]: await getVisibleCompanyIds(User, req.user) };
    } else {
      where.createdBy = req.user.id;
    }

    const campaigns = await Campaign.findAll({
      where,
      include: [{ model: WhatsappAccount, attributes: ['id', 'name', 'phone'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ campaigns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id, {
      include: [{ model: WhatsappAccount, attributes: ['id', 'name', 'phone'] }],
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(campaign.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    res.json({ campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.body.companyId || req.user.companyId)
      : req.user.companyId;

    const {
      name, whatsappAccountId, type, messageBody, mediaUrl,
      templateName, templateLanguage, templateParams,
      recipients, groupIds, scheduledAt, delayBetweenMessages,
    } = req.body;

    let allRecipients = recipients || [];

    if (groupIds && groupIds.length > 0) {
      const groups = await ContactGroup.findAll({
        where: { id: groupIds, companyId },
        include: [{ model: Contact, attributes: ['phone'] }],
      });
      for (const group of groups) {
        const phones = group.Contacts.map(c => c.phone);
        allRecipients = [...allRecipients, ...phones];
      }
      allRecipients = [...new Set(allRecipients)];
    }

    const campaign = await Campaign.create({
      companyId,
      whatsappAccountId,
      createdBy: req.user.id,
      name,
      type: type || 'text',
      messageBody,
      mediaUrl,
      templateName,
      templateLanguage,
      templateParams,
      recipients: allRecipients,
      totalRecipients: allRecipients.length,
      scheduledAt: scheduledAt || null,
      delayBetweenMessages: delayBetweenMessages || 3000,
      status: scheduledAt ? 'scheduled' : 'draft',
    });

    res.status(201).json({ campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.start = async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(campaign.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    if (!['draft', 'scheduled', 'paused'].includes(campaign.status)) {
      return res.status(400).json({ error: 'Campaign cannot be started' });
    }

    // Check balance for remaining messages
    const remaining = campaign.totalRecipients - campaign.sentCount;
    const category = campaign.type === 'template' ? 'marketing' : 'text_only';
    const balanceCheck = await walletService.checkBalance(campaign.createdBy, remaining, category);
    if (!balanceCheck.canSend) {
      return res.status(402).json({
        error: `Insufficient balance. Need ${balanceCheck.totalCost.toFixed(4)} for ${remaining} messages, have ${balanceCheck.balance.toFixed(4)}`,
        balance: balanceCheck.balance,
        totalCost: balanceCheck.totalCost,
        maxMessages: balanceCheck.maxMessages,
      });
    }

    await campaign.update({ status: 'running', startedAt: new Date() });

    // Run campaign in background
    runCampaign(campaign.id).catch(console.error);

    res.json({ message: 'Campaign started', campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.pause = async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(campaign.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    if (campaign.status !== 'running') {
      return res.status(400).json({ error: 'Campaign is not running' });
    }
    await campaign.update({ status: 'paused' });
    res.json({ message: 'Campaign paused', campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

async function runCampaign(campaignId) {
  const campaign = await Campaign.findByPk(campaignId);
  if (!campaign || campaign.status !== 'running') return;

  const recipients = campaign.recipients;
  let sentCount = campaign.sentCount;
  let failedCount = campaign.failedCount;

  for (let i = sentCount; i < recipients.length; i++) {
    const refreshed = await Campaign.findByPk(campaignId);
    if (refreshed.status !== 'running') break;

    const phone = recipients[i];
    try {
      // Check and deduct balance before each message
      const category = campaign.type === 'template' ? 'marketing' : 'text_only';
      const balCheck = await walletService.checkBalance(campaign.createdBy, 1, category);
      if (!balCheck.canSend) {
        await campaign.update({ status: 'paused' });
        console.log(`Campaign ${campaignId}: paused due to insufficient balance`);
        break;
      }

      await sessionManager.sendMessage(campaign.whatsappAccountId, phone, {
        type: campaign.type,
        body: campaign.messageBody,
        mediaUrl: campaign.mediaUrl,
      });

      let [contact] = await Contact.findOrCreate({
        where: { companyId: campaign.companyId, phone },
        defaults: { name: phone },
      });

      let [chat] = await Chat.findOrCreate({
        where: { contactId: contact.id, whatsappAccountId: campaign.whatsappAccountId },
        defaults: { companyId: campaign.companyId },
      });

      const msg = await Message.create({
        chatId: chat.id,
        whatsappAccountId: campaign.whatsappAccountId,
        contactId: contact.id,
        companyId: campaign.companyId,
        direction: 'outbound',
        type: campaign.type,
        body: campaign.messageBody,
        status: 'sent',
        timestamp: new Date(),
      });

      // Deduct after successful send
      await walletService.deductForMessage({
        userId: campaign.createdBy,
        messageId: msg.id,
        campaignId: campaign.id,
        recipientPhone: phone,
        category,
      });

      sentCount++;
    } catch (err) {
      failedCount++;
      console.error(`Campaign ${campaignId}: failed to send to ${phone}:`, err.message);
    }

    await campaign.update({ sentCount, failedCount });

    if (i < recipients.length - 1) {
      await new Promise(r => setTimeout(r, campaign.delayBetweenMessages));
    }
  }

  await campaign.update({
    status: 'completed',
    completedAt: new Date(),
    sentCount,
    failedCount,
  });
}

exports.exportCsv = async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(campaign.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const sentTransactions = await Transaction.findAll({
      where: { campaignId: campaign.id },
      attributes: ['recipientPhone', 'createdAt'],
      raw: true,
    });
    const sentMap = new Map(sentTransactions.map(t => [t.recipientPhone, t.createdAt]));

    const rows = [['Phone', 'Status', 'Sent At']];
    for (const phone of campaign.recipients || []) {
      const sentAt = sentMap.get(phone);
      rows.push([phone, sentAt ? 'sent' : 'failed/pending', sentAt ? new Date(sentAt).toISOString() : '']);
    }

    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="campaign-${campaign.id}-report.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(campaign.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    if (campaign.status === 'running') {
      return res.status(400).json({ error: 'Cannot delete a running campaign' });
    }
    await campaign.destroy();
    res.json({ message: 'Campaign deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
