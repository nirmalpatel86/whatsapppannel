const { ContactGroup, ContactGroupMember, Contact, User } = require('../models');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../utils/scopeHelper');

exports.list = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.query.companyId || req.user.companyId)
      : { [Op.in]: await getVisibleCompanyIds(User, req.user) };

    const groups = await ContactGroup.findAll({
      where: { companyId },
      include: [{ model: Contact, attributes: ['id', 'name', 'phone'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json({ groups: groups.map(g => ({ ...g.toJSON(), memberCount: g.Contacts?.length || 0 })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const group = await ContactGroup.findByPk(req.params.id, {
      include: [{ model: Contact, attributes: ['id', 'name', 'phone', 'pushName'] }],
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
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
    if (!name) return res.status(400).json({ error: 'Group name is required' });

    const group = await ContactGroup.create({
      companyId,
      name,
      description: description || null,
      createdBy: req.user.id,
    });

    if (contactIds && contactIds.length > 0) {
      const members = contactIds.map(contactId => ({ groupId: group.id, contactId }));
      await ContactGroupMember.bulkCreate(members, { ignoreDuplicates: true });
    }

    const full = await ContactGroup.findByPk(group.id, {
      include: [{ model: Contact, attributes: ['id', 'name', 'phone'] }],
    });

    res.status(201).json({ group: { ...full.toJSON(), memberCount: full.Contacts?.length || 0 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const group = await ContactGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
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

exports.delete = async (req, res) => {
  try {
    const group = await ContactGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(group.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    await ContactGroupMember.destroy({ where: { groupId: group.id } });
    await group.destroy();
    res.json({ message: 'Group deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addMembers = async (req, res) => {
  try {
    const group = await ContactGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(group.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { contactIds } = req.body;
    if (!contactIds || contactIds.length === 0) {
      return res.status(400).json({ error: 'contactIds required' });
    }

    const members = contactIds.map(contactId => ({ groupId: group.id, contactId }));
    await ContactGroupMember.bulkCreate(members, { ignoreDuplicates: true });

    const full = await ContactGroup.findByPk(group.id, {
      include: [{ model: Contact, attributes: ['id', 'name', 'phone'] }],
    });

    res.json({ group: { ...full.toJSON(), memberCount: full.Contacts?.length || 0 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeMembers = async (req, res) => {
  try {
    const group = await ContactGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(group.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { contactIds } = req.body;
    if (!contactIds || contactIds.length === 0) {
      return res.status(400).json({ error: 'contactIds required' });
    }

    await ContactGroupMember.destroy({
      where: { groupId: group.id, contactId: contactIds },
    });

    const full = await ContactGroup.findByPk(group.id, {
      include: [{ model: Contact, attributes: ['id', 'name', 'phone'] }],
    });

    res.json({ group: { ...full.toJSON(), memberCount: full.Contacts?.length || 0 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMembers = async (req, res) => {
  try {
    const group = await ContactGroup.findByPk(req.params.id, {
      include: [{ model: Contact, attributes: ['id', 'name', 'phone', 'pushName'] }],
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(group.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    res.json({ contacts: group.Contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
