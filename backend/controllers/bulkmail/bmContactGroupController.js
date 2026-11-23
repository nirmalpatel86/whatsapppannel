const { BmContactGroup, BmContact, BmUser } = require('../../models/bulkmail');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../../utils/scopeHelper');

exports.list = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.query.companyId || req.user.companyId)
      : { [Op.in]: await getVisibleCompanyIds(BmUser, req.user) };
    const groups = await BmContactGroup.findAll({
      where: { companyId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ groups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const group = await BmContactGroup.findByPk(req.params.id, {
      include: [{ model: BmContact }],
    });
    if (!group) return res.status(404).json({ error: 'Contact group not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(group.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    res.json({ group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.body.companyId || req.user.companyId)
      : req.user.companyId;

    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const group = await BmContactGroup.create({
      companyId, createdBy: req.user.id, name, description: description || null,
    });
    res.status(201).json({ group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const group = await BmContactGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Contact group not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(group.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    const { name, description } = req.body;
    await group.update({
      ...(name && { name }),
      ...(description !== undefined && { description }),
    });
    res.json({ group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const group = await BmContactGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Contact group not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(group.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    await BmContact.destroy({ where: { groupId: group.id } });
    await group.destroy();
    res.json({ message: 'Contact group deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
