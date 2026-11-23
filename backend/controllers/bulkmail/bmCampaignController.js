const { BmCampaign, BmCampaignEmail, BmSender, BmSmtp, BmContact, BmContactGroup, BmSenderGroup, BmTemplate, BmWallet, BmTransaction, BmUser } = require('../../models/bulkmail');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../../utils/scopeHelper');

exports.list = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'super_admin') {
      where.companyId = req.query.companyId || req.user.companyId;
    } else if (req.user.role === 'admin' || req.user.role === 'reseller') {
      where.companyId = { [Op.in]: await getVisibleCompanyIds(BmUser, req.user) };
    } else {
      where.createdBy = req.user.id;
    }

    const campaigns = await BmCampaign.findAll({
      where,
      include: [
        { model: BmSender, attributes: ['id', 'name', 'email'] },
        { model: BmContactGroup, attributes: ['id', 'name'] },
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
    const campaign = await BmCampaign.findByPk(req.params.id, {
      include: [
        { model: BmSender },
        { model: BmContactGroup },
        { model: BmTemplate },
      ],
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
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

    const { name, contactGroupId, senderId, templateId, senderGroupId, subject, body, scheduledAt, campaignType } = req.body;
    if (!name) return res.status(400).json({ error: 'Campaign name is required' });

    let totalRecipients = 0;
    if (contactGroupId) {
      const group = await BmContactGroup.findByPk(contactGroupId);
      if (group) totalRecipients = group.contactCount;
    }

    const campaign = await BmCampaign.create({
      companyId, createdBy: req.user.id, name,
      contactGroupId: contactGroupId || null,
      senderId: senderId || null,
      templateId: templateId || null,
      senderGroupId: senderGroupId || null,
      subject: subject || '', body: body || '',
      totalRecipients,
      scheduledAt: scheduledAt || null,
      campaignType: campaignType || 'regular',
      status: scheduledAt ? 'scheduled' : 'draft',
    });

    res.status(201).json({ campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.start = async (req, res) => {
  try {
    const campaign = await BmCampaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(campaign.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    if (!['draft', 'scheduled', 'paused'].includes(campaign.status)) {
      return res.status(400).json({ error: 'Campaign cannot be started' });
    }

    const wallet = await BmWallet.findOne({ where: { userId: campaign.createdBy } });
    if (!wallet || wallet.balance <= 0) {
      return res.status(402).json({ error: 'Insufficient balance' });
    }

    await campaign.update({ status: 'running', startedAt: new Date() });
    runEmailCampaign(campaign.id).catch(console.error);
    res.json({ message: 'Campaign started', campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.pause = async (req, res) => {
  try {
    const campaign = await BmCampaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (campaign.status !== 'running') {
      return res.status(400).json({ error: 'Campaign is not running' });
    }
    await campaign.update({ status: 'paused' });
    res.json({ message: 'Campaign paused', campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.stats = async (req, res) => {
  try {
    const campaign = await BmCampaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const emailStats = await BmCampaignEmail.findAll({
      where: { campaignId: campaign.id },
      attributes: [
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total'],
        [require('sequelize').fn('SUM', require('sequelize').literal("CASE WHEN status = 'sent' THEN 1 ELSE 0 END")), 'sent'],
        [require('sequelize').fn('SUM', require('sequelize').literal("CASE WHEN status = 'delivered' THEN 1 ELSE 0 END")), 'delivered'],
        [require('sequelize').fn('SUM', require('sequelize').literal("CASE WHEN status = 'failed' THEN 1 ELSE 0 END")), 'failed'],
        [require('sequelize').fn('SUM', require('sequelize').literal("CASE WHEN status = 'bounced' THEN 1 ELSE 0 END")), 'bounced'],
        [require('sequelize').fn('SUM', require('sequelize').literal("CASE WHEN isOpened = 1 THEN 1 ELSE 0 END")), 'opened'],
        [require('sequelize').fn('SUM', require('sequelize').literal("CASE WHEN isLinkClicked = 1 THEN 1 ELSE 0 END")), 'clicked'],
        [require('sequelize').fn('SUM', require('sequelize').col('openCount')), 'totalOpens'],
      ],
      raw: true,
    });

    res.json({ campaign, stats: emailStats[0] || {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.trackOpen = async (req, res) => {
  try {
    const { trackingCode } = req.params;
    const campaignEmail = await BmCampaignEmail.findOne({ where: { trackingCode } });
    if (campaignEmail) {
      await campaignEmail.update({
        isOpened: true,
        openCount: campaignEmail.openCount + 1,
        openedAt: campaignEmail.openedAt || new Date(),
      });
    }
  } catch (_) {
    // tracking failure should be silent
  }
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.set('Content-Type', 'image/gif');
  res.set('Cache-Control', 'no-store');
  res.send(pixel);
};

exports.trackClick = async (req, res) => {
  try {
    const { trackingCode } = req.params;
    const { url } = req.query;
    const campaignEmail = await BmCampaignEmail.findOne({ where: { trackingCode } });
    if (campaignEmail) {
      await campaignEmail.update({ isLinkClicked: true });
    }
    if (url) {
      return res.redirect(url);
    }
    res.status(200).send('OK');
  } catch (_) {
    res.status(200).send('OK');
  }
};

exports.delete = async (req, res) => {
  try {
    const campaign = await BmCampaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(campaign.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    if (campaign.status === 'running') {
      return res.status(400).json({ error: 'Cannot delete a running campaign' });
    }
    await BmCampaignEmail.destroy({ where: { campaignId: campaign.id } });
    await campaign.destroy();
    res.json({ message: 'Campaign deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

async function runEmailCampaign(campaignId) {
  const campaign = await BmCampaign.findByPk(campaignId, {
    include: [{ model: BmSender, include: [{ model: BmSmtp }] }],
  });
  if (!campaign || campaign.status !== 'running') return;

  const sender = campaign.BmSender;
  if (!sender || !sender.BmSmtp) {
    await campaign.update({ status: 'failed' });
    return;
  }

  const smtp = sender.BmSmtp;
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure === 'ssl',
    auth: { user: smtp.username, pass: smtp.password },
    ...(smtp.secure === 'tls' && { tls: { rejectUnauthorized: false } }),
  });

  const contacts = await BmContact.findAll({
    where: { groupId: campaign.contactGroupId, isSubscribed: true, isActive: true },
  });

  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
  let sentCount = 0;
  let failedCount = 0;
  let deliveredCount = 0;

  // Get senders for rotation if sender group
  let senderRotation = [sender];
  if (campaign.senderGroupId) {
    const groupSenders = await BmSender.findAll({
      where: { senderGroupId: campaign.senderGroupId, isActive: true },
      include: [{ model: BmSmtp }],
    });
    if (groupSenders.length > 0) senderRotation = groupSenders;
  }

  for (let i = 0; i < contacts.length; i++) {
    const refreshed = await BmCampaign.findByPk(campaignId);
    if (refreshed.status !== 'running') break;

    const contact = contacts[i];
    const trackingCode = crypto.randomBytes(32).toString('hex');
    const currentSender = senderRotation[i % senderRotation.length];
    const currentSmtp = currentSender.BmSmtp || smtp;

    let currentTransporter = transporter;
    if (currentSmtp.id !== smtp.id) {
      currentTransporter = nodemailer.createTransport({
        host: currentSmtp.host,
        port: currentSmtp.port,
        secure: currentSmtp.secure === 'ssl',
        auth: { user: currentSmtp.username, pass: currentSmtp.password },
        ...(currentSmtp.secure === 'tls' && { tls: { rejectUnauthorized: false } }),
      });
    }

    try {
      const trackPixel = `<img src="${baseUrl}/api/bulkmail/campaigns/track/open/${trackingCode}" width="1" height="1" style="display:none" alt="" />`;

      let htmlBody = campaign.body || '';
      htmlBody = htmlBody.replace(/\{name\}/gi, contact.name || '')
        .replace(/\{email\}/gi, contact.email || '')
        .replace(/\{company\}/gi, contact.companyName || '')
        .replace(/\{col1\}/gi, contact.col1 || '')
        .replace(/\{col2\}/gi, contact.col2 || '')
        .replace(/\{col3\}/gi, contact.col3 || '');

      // Add tracking pixel before closing body tag
      if (htmlBody.includes('</body>')) {
        htmlBody = htmlBody.replace('</body>', `${trackPixel}</body>`);
      } else {
        htmlBody += trackPixel;
      }

      // Replace links for click tracking
      htmlBody = htmlBody.replace(/href="(https?:\/\/[^"]+)"/gi, (match, url) => {
        const trackUrl = `${baseUrl}/api/bulkmail/campaigns/track/click/${trackingCode}?url=${encodeURIComponent(url)}`;
        return `href="${trackUrl}"`;
      });

      const unsubscribeUrl = `${baseUrl}/api/bulkmail/campaigns/unsubscribe/${trackingCode}`;
      htmlBody += `<br/><p style="font-size:11px;color:#999;text-align:center;"><a href="${unsubscribeUrl}">Unsubscribe</a></p>`;

      await currentTransporter.sendMail({
        from: `"${currentSender.name}" <${currentSender.email}>`,
        replyTo: currentSender.replyEmail || currentSender.email,
        to: contact.email,
        subject: (campaign.subject || '').replace(/\{name\}/gi, contact.name || ''),
        html: htmlBody,
      });

      await BmCampaignEmail.create({
        campaignId, email: contact.email, status: 'sent',
        trackingCode, senderId: currentSender.id, sentAt: new Date(),
      });

      sentCount++;
      deliveredCount++;
    } catch (err) {
      await BmCampaignEmail.create({
        campaignId, email: contact.email, status: 'failed',
        trackingCode, responseCode: err.message, senderId: currentSender.id,
      });
      failedCount++;
    }

    await campaign.update({ sentCount, deliveredCount, failedCount });

    if (i < contacts.length - 1) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Deduct from wallet
  const wallet = await BmWallet.findOne({ where: { userId: campaign.createdBy } });
  if (wallet && sentCount > 0) {
    const costPerEmail = 0.10;
    const totalCost = sentCount * costPerEmail;
    const newBalance = Math.max(0, wallet.balance - totalCost);
    await wallet.update({
      balance: newBalance,
      totalSpent: parseFloat(wallet.totalSpent) + totalCost,
    });
    await BmTransaction.create({
      walletId: wallet.id, userId: campaign.createdBy,
      type: 'deduction', amount: totalCost, balanceAfter: newBalance,
      description: `Campaign: ${campaign.name} (${sentCount} emails)`,
      campaignId: campaign.id, emailCount: sentCount,
    });
  }

  await campaign.update({
    status: 'completed', completedAt: new Date(),
    sentCount, deliveredCount, failedCount,
  });
}

exports.unsubscribe = async (req, res) => {
  try {
    const { trackingCode } = req.params;
    const campaignEmail = await BmCampaignEmail.findOne({ where: { trackingCode } });
    if (campaignEmail) {
      await BmContact.update(
        { isSubscribed: false },
        { where: { email: campaignEmail.email } }
      );
      const campaign = await BmCampaign.findByPk(campaignEmail.campaignId);
      if (campaign) {
        await campaign.increment('unsubscribeCount');
      }
    }
    res.send('<html><body><h2>You have been unsubscribed successfully.</h2></body></html>');
  } catch (_) {
    res.send('<html><body><h2>Unsubscribe processed.</h2></body></html>');
  }
};
