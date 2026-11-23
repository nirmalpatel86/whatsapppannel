const { BmTemplate, BmUser } = require('../../models/bulkmail');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../../utils/scopeHelper');

exports.list = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.query.companyId || req.user.companyId)
      : { [Op.in]: await getVisibleCompanyIds(BmUser, req.user) };
    const templates = await BmTemplate.findAll({
      where: { companyId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const template = await BmTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(template.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    res.json({ template });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.body.companyId || req.user.companyId)
      : req.user.companyId;

    const { name, subject, body } = req.body;
    if (!name || !body) return res.status(400).json({ error: 'Name and body are required' });

    const template = await BmTemplate.create({
      companyId, createdBy: req.user.id,
      name, subject: subject || '', body, status: 'active',
    });
    res.status(201).json({ template });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const template = await BmTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(template.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { name, subject, body, status } = req.body;
    await template.update({
      ...(name && { name }),
      ...(subject !== undefined && { subject }),
      ...(body && { body }),
      ...(status && { status }),
    });
    res.json({ template });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const template = await BmTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
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
