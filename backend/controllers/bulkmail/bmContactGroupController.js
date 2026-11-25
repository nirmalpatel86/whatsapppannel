const { BmContactGroup, BmContact, BmUser, bulkmailSequelize } = require('../../models/bulkmail');
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

    const groupIds = groups.map(g => g.id);
    const counts = groupIds.length
      ? await BmContact.findAll({
        attributes: ['groupId', [bulkmailSequelize.fn('COUNT', bulkmailSequelize.col('id')), 'count']],
        where: { groupId: { [Op.in]: groupIds } },
        group: ['groupId'],
        raw: true,
      })
      : [];
    const countByGroup = Object.fromEntries(counts.map(c => [c.groupId, parseInt(c.count, 10)]));

    res.json({
      groups: groups.map(g => ({ ...g.toJSON(), memberCount: countByGroup[g.id] || 0 })),
    });
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

    const { name, description, contactIds } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const group = await BmContactGroup.create({
      companyId, createdBy: req.user.id, name, description: description || null,
    });

    if (Array.isArray(contactIds) && contactIds.length) {
      await BmContact.update({ groupId: group.id }, { where: { id: contactIds, companyId } });
    }

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
    // Unlink contacts from the group instead of deleting them — a deleted group
    // should not take real contact records with it.
    await BmContact.update({ groupId: null }, { where: { groupId: group.id } });
    await group.destroy();
    res.json({ message: 'Contact group deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMembers = async (req, res) => {
  try {
    const group = await BmContactGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Contact group not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(group.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    const contacts = await BmContact.findAll({ where: { groupId: group.id } });
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addMembers = async (req, res) => {
  try {
    const group = await BmContactGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Contact group not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(group.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    const { contactIds } = req.body;
    if (!Array.isArray(contactIds) || !contactIds.length) {
      return res.status(400).json({ error: 'contactIds is required' });
    }
    await BmContact.update({ groupId: group.id }, { where: { id: contactIds, companyId: group.companyId } });
    res.json({ message: 'Members added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeMembers = async (req, res) => {
  try {
    const group = await BmContactGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Contact group not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(group.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    const { contactIds } = req.body;
    if (!Array.isArray(contactIds) || !contactIds.length) {
      return res.status(400).json({ error: 'contactIds is required' });
    }
    await BmContact.update({ groupId: null }, { where: { id: contactIds, groupId: group.id } });
    res.json({ message: 'Members removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
