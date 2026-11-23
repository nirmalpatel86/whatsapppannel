const { Message, WhatsappAccount, Contact, User, ConnectionLog, sequelize } = require('../models');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../utils/scopeHelper');

const scopedCompanyFilter = async (req) => {
  if (req.user.role === 'super_admin') {
    return { companyId: req.query.companyId || req.user.companyId };
  }
  if (req.user.role === 'admin' || req.user.role === 'reseller') {
    return { companyId: { [Op.in]: await getVisibleCompanyIds(User, req.user) } };
  }
  const accountIds = (await WhatsappAccount.findAll({
    where: { createdBy: req.user.id }, attributes: ['id'], raw: true,
  })).map(a => a.id);
  return { whatsappAccountId: { [Op.in]: accountIds.length ? accountIds : [0] } };
};

exports.deliveryReport = async (req, res) => {
  try {
    const { whatsappAccountId, status, direction, search, from, to, page = 1, limit = 50 } = req.query;

    const where = { ...(await scopedCompanyFilter(req)) };
    if (whatsappAccountId) where.whatsappAccountId = whatsappAccountId;
    if (status) where.status = status;
    if (direction) where.direction = direction;
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp[Op.gte] = new Date(from);
      if (to) where.timestamp[Op.lte] = new Date(to);
    }

    const include = [
      { model: WhatsappAccount, attributes: ['id', 'name', 'phone'] },
      {
        model: Contact,
        attributes: ['id', 'name', 'phone'],
        ...(search ? { where: { phone: { [Op.like]: `%${search}%` } } } : {}),
      },
    ];

    const result = await Message.findAndCountAll({
      where,
      include,
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({
      messages: result.rows,
      total: result.count,
      page: parseInt(page),
      totalPages: Math.ceil(result.count / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.usageReport = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const where = { ...(await scopedCompanyFilter(req)) };
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));
    where.timestamp = { [Op.gte]: since };

    const rows = await Message.findAll({
      where,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('timestamp')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN direction = 'outbound' THEN 1 ELSE 0 END")), 'outbound'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN direction = 'inbound' THEN 1 ELSE 0 END")), 'inbound'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'delivered' OR status = 'read' THEN 1 ELSE 0 END")), 'delivered'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'failed' THEN 1 ELSE 0 END")), 'failed'],
      ],
      group: [sequelize.fn('DATE', sequelize.col('timestamp'))],
      order: [[sequelize.fn('DATE', sequelize.col('timestamp')), 'ASC']],
      raw: true,
    });

    res.json({
      days: parseInt(days),
      usage: rows.map(r => ({
        date: r.date,
        total: parseInt(r.total) || 0,
        outbound: parseInt(r.outbound) || 0,
        inbound: parseInt(r.inbound) || 0,
        delivered: parseInt(r.delivered) || 0,
        failed: parseInt(r.failed) || 0,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.connectionReport = async (req, res) => {
  try {
    const { whatsappAccountId, page = 1, limit = 50 } = req.query;
    const where = { ...(await scopedCompanyFilter(req)) };
    if (whatsappAccountId) where.whatsappAccountId = whatsappAccountId;

    const result = await ConnectionLog.findAndCountAll({
      where,
      include: [{ model: WhatsappAccount, attributes: ['id', 'name', 'phone'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({
      logs: result.rows,
      total: result.count,
      page: parseInt(page),
      totalPages: Math.ceil(result.count / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
