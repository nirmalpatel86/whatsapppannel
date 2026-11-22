const { SmsSenderId, SmsCompany, SmsRoute, SmsUser } = require('../../models/sms');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../../utils/scopeHelper');

exports.list = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.query.companyId || req.user.companyId)
      : { [Op.in]: await getVisibleCompanyIds(SmsUser, req.user) };

    const where = { companyId };
    if (req.query.status) where.status = req.query.status;

    const senderIds = await SmsSenderId.findAll({
      where,
      include: [{ model: SmsRoute, attributes: ['id', 'name', 'routeType'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ senderIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const senderId = await SmsSenderId.findByPk(req.params.id, {
      include: [{ model: SmsRoute, attributes: ['id', 'name', 'routeType'] }],
    });
    if (!senderId) return res.status(404).json({ error: 'Sender ID not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(senderId.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    res.json({ senderId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.body.companyId || req.user.companyId)
      : req.user.companyId;

    const { senderId, routeId, entityId } = req.body;
    if (!senderId) return res.status(400).json({ error: 'Sender ID is required' });
    if (senderId.length > 11) return res.status(400).json({ error: 'Sender ID must be 11 characters or less' });

    const record = await SmsSenderId.create({
      companyId, senderId, routeId: routeId || null, entityId: entityId || null,
      status: req.user.role === 'super_admin' ? 'approved' : 'pending',
    });

    res.status(201).json({ senderId: record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const record = await SmsSenderId.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Sender ID not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(record.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { senderId, routeId, entityId, status, isActive } = req.body;
    await record.update({
      ...(senderId && { senderId }),
      ...(routeId !== undefined && { routeId }),
      ...(entityId !== undefined && { entityId }),
      ...(req.user.role === 'super_admin' && status && { status }),
      ...(isActive !== undefined && { isActive }),
    });
    res.json({ senderId: record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const record = await SmsSenderId.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Sender ID not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(record.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    await record.destroy();
    res.json({ message: 'Sender ID deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
