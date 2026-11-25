const { BmCampaign, BmUser } = require('../../models/bulkmail');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../../utils/scopeHelper');

exports.getReport = async (req, res) => {
  try {
    const { campaignId, startDate, endDate } = req.query;
    const companyId = req.user.role === 'super_admin'
      ? (req.query.companyId || req.user.companyId)
      : { [Op.in]: await getVisibleCompanyIds(BmUser, req.user) };

    const where = { companyId };
    if (campaignId) where.id = campaignId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(`${endDate}T23:59:59.999Z`);
    }

    const campaigns = await BmCampaign.findAll({ where, order: [['createdAt', 'DESC']] });

    const campaignStats = campaigns.map(c => ({
      id: c.id,
      name: c.name,
      sent: c.sentCount || 0,
      delivered: c.deliveredCount || 0,
      opened: c.openCount || 0,
      clicked: c.clickCount || 0,
      bounced: c.bounceCount || 0,
      unsubscribed: c.unsubscribeCount || 0,
    }));

    const summary = campaignStats.reduce((acc, c) => ({
      totalSent: acc.totalSent + c.sent,
      delivered: acc.delivered + c.delivered,
      opened: acc.opened + c.opened,
      clicked: acc.clicked + c.clicked,
      bounced: acc.bounced + c.bounced,
    }), { totalSent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 });

    res.json({ summary, campaignStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
