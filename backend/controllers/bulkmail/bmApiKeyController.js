const { BmApiKey, BmSender, BmUser } = require('../../models/bulkmail');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../../utils/scopeHelper');

exports.list = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.query.companyId || req.user.companyId)
      : { [Op.in]: await getVisibleCompanyIds(BmUser, req.user) };

    const where = { companyId };
    if (req.user.role === 'user') where.userId = req.user.id;

    const apiKeys = await BmApiKey.findAll({
      where,
      include: [{ model: BmSender, attributes: ['id', 'name', 'email'] }],
    });
    res.json({ apiKeys });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const apiKey = await BmApiKey.findByPk(req.params.id, {
      include: [{ model: BmSender }],
    });
    if (!apiKey) return res.status(404).json({ error: 'API key not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(apiKey.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    res.json({ apiKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.body.companyId || req.user.companyId)
      : req.user.companyId;

    const { name, senderId } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const apiKey = await BmApiKey.create({
      userId: req.user.id, companyId, name,
      senderId: senderId || null,
    });
    res.status(201).json({ apiKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const apiKey = await BmApiKey.findByPk(req.params.id);
    if (!apiKey) return res.status(404).json({ error: 'API key not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(apiKey.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { name, senderId, isActive } = req.body;
    await apiKey.update({
      ...(name && { name }),
      ...(senderId !== undefined && { senderId }),
      ...(isActive !== undefined && { isActive }),
    });
    res.json({ apiKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const apiKey = await BmApiKey.findByPk(req.params.id);
    if (!apiKey) return res.status(404).json({ error: 'API key not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
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
