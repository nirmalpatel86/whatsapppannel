const { WhatsappApiKey, WhatsappAccount, User } = require('../models');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../utils/scopeHelper');

exports.list = async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'super_admin') {
      where = {};
    } else {
      where = { companyId: { [Op.in]: await getVisibleCompanyIds(User, req.user) } };
    }
    if (req.user.role === 'user') where.userId = req.user.id;

    const apiKeys = await WhatsappApiKey.findAll({
      where,
      include: [{ model: WhatsappAccount, attributes: ['id', 'name', 'phone', 'status'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ apiKeys });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, whatsappAccountId } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    if (whatsappAccountId) {
      const account = await WhatsappAccount.findByPk(whatsappAccountId);
      if (!account) return res.status(404).json({ error: 'WhatsApp account not found' });
      if (req.user.role === 'user' && account.createdBy !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const apiKey = await WhatsappApiKey.create({
      name,
      userId: req.user.id,
      companyId: req.user.companyId,
      whatsappAccountId: whatsappAccountId || null,
    });
    res.status(201).json({ apiKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const apiKey = await WhatsappApiKey.findByPk(req.params.id);
    if (!apiKey) return res.status(404).json({ error: 'API key not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(apiKey.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    const { name, whatsappAccountId, isActive } = req.body;
    await apiKey.update({
      ...(name !== undefined && { name }),
      ...(whatsappAccountId !== undefined && { whatsappAccountId }),
      ...(isActive !== undefined && { isActive }),
    });
    res.json({ apiKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const apiKey = await WhatsappApiKey.findByPk(req.params.id);
    if (!apiKey) return res.status(404).json({ error: 'API key not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
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
