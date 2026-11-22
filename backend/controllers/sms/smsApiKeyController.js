const { SmsApiKey, SmsSenderId, SmsRoute, SmsUser } = require('../../models/sms');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../../utils/scopeHelper');

exports.list = async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'super_admin') {
      where = {};
    } else {
      where = { companyId: { [Op.in]: await getVisibleCompanyIds(SmsUser, req.user) } };
    }
    if (req.user.role === 'user') where.userId = req.user.id;
    const apiKeys = await SmsApiKey.findAll({
      where,
      include: [
        { model: SmsSenderId, attributes: ['id', 'senderId'] },
        { model: SmsRoute, attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ apiKeys });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, senderIdId, routeId } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const apiKey = await SmsApiKey.create({
      name,
      userId: req.user.id,
      companyId: req.user.companyId,
      senderIdId: senderIdId || null,
      routeId: routeId || null,
    });
    res.status(201).json({ apiKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const apiKey = await SmsApiKey.findByPk(req.params.id);
    if (!apiKey) return res.status(404).json({ error: 'API key not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(apiKey.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    const { name, senderIdId, routeId, isActive } = req.body;
    await apiKey.update({
      ...(name !== undefined && { name }),
      ...(senderIdId !== undefined && { senderIdId }),
      ...(routeId !== undefined && { routeId }),
      ...(isActive !== undefined && { isActive }),
    });
    res.json({ apiKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const apiKey = await SmsApiKey.findByPk(req.params.id);
    if (!apiKey) return res.status(404).json({ error: 'API key not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(apiKey.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    await apiKey.destroy();
    res.json({ message: 'API key deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
