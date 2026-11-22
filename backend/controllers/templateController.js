const { MessageTemplate, User } = require('../models');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../utils/scopeHelper');

exports.list = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.query.companyId || req.user.companyId)
      : { [Op.in]: await getVisibleCompanyIds(User, req.user) };

    const templates = await MessageTemplate.findAll({
      where: { companyId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.body.companyId || req.user.companyId)
      : req.user.companyId;

    const { name, language, category, body, header, footer, buttons } = req.body;
    const template = await MessageTemplate.create({
      companyId,
      name,
      language: language || 'en',
      category: category || 'marketing',
      body,
      header,
      footer,
      buttons,
    });
    res.status(201).json({ template });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const template = await MessageTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(template.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    await template.update(req.body);
    res.json({ template });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const template = await MessageTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(template.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    await template.destroy();
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
