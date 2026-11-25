const { SmsCampaign, SmsCampaignMessage, SmsTemplate, SmsSenderId, SmsRoute, SmsContact, SmsContactGroup, SmsWallet, SmsTransaction, SmsUser } = require('../../models/sms');
const { Op } = require('sequelize');
const http = require('http');
const https = require('https');
const url = require('url');
const { getVisibleCompanyIds } = require('../../utils/scopeHelper');

function calculateSmsCount(text, isUnicode) {
  let len = text.length;
  const newlineCount = (text.match(/\n/g) || []).length;
  len -= newlineCount;

  if (isUnicode) {
    if (len < 71) return 1;
    if (len < 135) return 2;
    if (len < 202) return 3;
    if (len < 269) return 4;
    if (len < 336) return 5;
    if (len < 403) return 6;
    if (len < 470) return 7;
    if (len < 537) return 8;
    return 8 + Math.ceil((len - 536) / 63);
  }

  if (len < 161) return 1;
  if (len < 307) return 2;
  if (len < 460) return 3;
  if (len < 613) return 4;
  if (len < 766) return 5;
  if (len < 919) return 6;
  if (len < 1072) return 7;
  if (len < 1225) return 8;
  if (len < 1378) return 9;
  return 9 + Math.ceil((len - 1377) / 153);
}

function sendHttpSms(apiUrl, params) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(apiUrl);
    const searchParams = new URLSearchParams(parsed.search);
    for (const [key, value] of Object.entries(params)) {
      searchParams.set(key, value);
    }
    parsed.search = searchParams.toString();

    const protocol = parsed.protocol === 'https:' ? https : http;
    protocol.get(parsed.toString(), (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

exports.list = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'super_admin') {
      where.companyId = req.query.companyId || req.user.companyId;
    } else if (req.user.role === 'admin' || req.user.role === 'reseller') {
      where.companyId = { [Op.in]: await getVisibleCompanyIds(SmsUser, req.user) };
    } else {
      where.createdBy = req.user.id;
    }

    const campaigns = await SmsCampaign.findAll({
      where,
      include: [
        { model: SmsSenderId, attributes: ['id', 'senderId'] },
        { model: SmsRoute, attributes: ['id', 'name', 'routeType'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ campaigns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const campaign = await SmsCampaign.findByPk(req.params.id, {
      include: [
        { model: SmsSenderId, attributes: ['id', 'senderId'] },
        { model: SmsRoute, attributes: ['id', 'name', 'routeType'] },
        { model: SmsCampaignMessage },
      ],
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
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
      name, templateId, senderIdId, routeId, message,
      recipients, groupId, groupIds, scheduledAt, delayBetweenMessages,
      messageType, dltContentId, entityId,
    } = req.body;

    // The campaigns UI sends a single groupId; accept a plural groupIds too
    // for API-style callers that pass an array.
    const resolvedGroupIds = groupIds && groupIds.length ? groupIds : (groupId ? [groupId] : []);

    let allRecipients = recipients || [];

    // "Auto" route in the UI means pick one automatically rather than leaving it
    // unset — otherwise /start always fails later with "No route assigned".
    let resolvedRouteId = routeId || null;
    if (!resolvedRouteId) {
      const autoRoute = await SmsRoute.findOne({ where: { isActive: true }, order: [['costPerSms', 'ASC']] });
      if (autoRoute) resolvedRouteId = autoRoute.id;
    }

    if (resolvedGroupIds.length > 0) {
      const groups = await SmsContactGroup.findAll({
        where: { id: resolvedGroupIds, companyId },
        include: [{ model: SmsContact, attributes: ['phone'] }],
      });
      for (const group of groups) {
        const phones = group.SmsContacts.map(c => c.phone);
        allRecipients = [...allRecipients, ...phones];
      }
      allRecipients = [...new Set(allRecipients)];
    }

    const campaign = await SmsCampaign.create({
      companyId,
      createdBy: req.user.id,
      name,
      templateId: templateId || null,
      senderIdId: senderIdId || null,
      routeId: resolvedRouteId,
      message,
      recipients: allRecipients,
      totalRecipients: allRecipients.length,
      messageType: messageType || 'text',
      dltContentId: dltContentId || null,
      entityId: entityId || null,
      scheduledAt: scheduledAt || null,
      delayBetweenMessages: delayBetweenMessages || 100,
      status: scheduledAt ? 'scheduled' : 'draft',
    });

    res.status(201).json({ campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.start = async (req, res) => {
  try {
    const campaign = await SmsCampaign.findByPk(req.params.id, {
      include: [
        { model: SmsSenderId },
        { model: SmsRoute },
      ],
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(campaign.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    if (!['draft', 'scheduled', 'paused'].includes(campaign.status)) {
      return res.status(400).json({ error: 'Campaign cannot be started' });
    }

    if (!campaign.SmsRoute) {
      return res.status(400).json({ error: 'No route assigned to campaign' });
    }

    const remaining = campaign.totalRecipients - campaign.sentCount;
    const msgText = campaign.message || '';
    const isUnicode = campaign.messageType === 'unicode';
    const smsPerMsg = calculateSmsCount(msgText, isUnicode);
    const totalSms = remaining * smsPerMsg;
    const costPerSms = parseFloat(campaign.SmsRoute.costPerSms) || 0;
    const totalCost = totalSms * costPerSms;

    const wallet = await SmsWallet.findOne({ where: { userId: campaign.createdBy } });
    if (!wallet || wallet.balance < totalCost) {
      return res.status(402).json({
        error: `Insufficient balance. Need ${totalCost.toFixed(4)} for ${totalSms} SMS, have ${(wallet?.balance || 0).toFixed(4)}`,
        balance: wallet?.balance || 0,
        totalCost,
      });
    }

    await campaign.update({ status: 'running', startedAt: new Date() });
    runSmsCampaign(campaign.id).catch(console.error);
    res.json({ message: 'Campaign started', campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.pause = async (req, res) => {
  try {
    const campaign = await SmsCampaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
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

exports.delete = async (req, res) => {
  try {
    const campaign = await SmsCampaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(campaign.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    if (campaign.status === 'running') {
      return res.status(400).json({ error: 'Cannot delete a running campaign' });
    }
    await SmsCampaignMessage.destroy({ where: { campaignId: campaign.id } });
    await campaign.destroy();
    res.json({ message: 'Campaign deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.calculateSmsCount = (req, res) => {
  const { text, isUnicode } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });
  const count = calculateSmsCount(text, isUnicode || false);
  res.json({ text: text.length, smsCount: count, isUnicode: isUnicode || false });
};

async function runSmsCampaign(campaignId) {
  const campaign = await SmsCampaign.findByPk(campaignId, {
    include: [{ model: SmsSenderId }, { model: SmsRoute }],
  });
  if (!campaign || campaign.status !== 'running') return;

  const route = campaign.SmsRoute;
  const senderIdRecord = campaign.SmsSenderId;
  if (!route || !route.apiUrl) {
    await campaign.update({ status: 'failed' });
    return;
  }

  const recipients = campaign.recipients;
  let sentCount = campaign.sentCount;
  let failedCount = campaign.failedCount;
  let deliveredCount = campaign.deliveredCount;

  const msgText = campaign.message || '';
  const isUnicode = campaign.messageType === 'unicode';
  const smsPerMsg = calculateSmsCount(msgText, isUnicode);
  const costPerSms = parseFloat(route.costPerSms) || 0;

  for (let i = sentCount; i < recipients.length; i++) {
    const refreshed = await SmsCampaign.findByPk(campaignId);
    if (refreshed.status !== 'running') break;

    const phone = recipients[i];
    const costForThis = smsPerMsg * costPerSms;

    try {
      const wallet = await SmsWallet.findOne({ where: { userId: campaign.createdBy } });
      if (!wallet || wallet.balance < costForThis) {
        await campaign.update({ status: 'paused' });
        break;
      }

      const params = {
        to: phone,
        text: msgText,
        from: senderIdRecord ? senderIdRecord.senderId : '',
        ...(campaign.dltContentId && { 'dlr-mask': '31' }),
      };

      const response = await sendHttpSms(route.apiUrl, params);

      await SmsCampaignMessage.create({
        campaignId: campaign.id,
        phone,
        status: 'sent',
        responseCode: response,
        smscId: route.smscId,
        sentAt: new Date(),
      });

      const newBalance = wallet.balance - costForThis;
      await wallet.update({
        balance: newBalance,
        totalSpent: wallet.totalSpent + costForThis,
      });

      await SmsTransaction.create({
        walletId: wallet.id,
        userId: campaign.createdBy,
        type: 'deduction',
        amount: costForThis,
        balanceAfter: newBalance,
        description: `SMS campaign: ${campaign.name}`,
        campaignId: campaign.id,
        smsCount: smsPerMsg,
        routeId: route.id,
      });

      sentCount++;
    } catch (err) {
      await SmsCampaignMessage.create({
        campaignId: campaign.id,
        phone,
        status: 'failed',
        responseCode: err.message,
      });
      failedCount++;
    }

    await campaign.update({ sentCount, failedCount, deliveredCount });

    if (i < recipients.length - 1 && campaign.delayBetweenMessages > 0) {
      await new Promise(r => setTimeout(r, campaign.delayBetweenMessages));
    }
  }

  await campaign.update({
    status: 'completed',
    completedAt: new Date(),
    sentCount,
    failedCount,
    deliveredCount,
  });
}

exports.runSmsCampaign = runSmsCampaign;
