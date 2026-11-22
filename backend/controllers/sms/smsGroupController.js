const { SmsContactGroup, SmsContactGroupMember, SmsContact, SmsUser } = require('../../models/sms');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../../utils/scopeHelper');

exports.list = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.query.companyId || req.user.companyId)
      : { [Op.in]: await getVisibleCompanyIds(SmsUser, req.user) };

    const groups = await SmsContactGroup.findAll({
      where: { companyId },
      include: [{ model: SmsContact, attributes: ['id', 'name', 'phone'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json({ groups: groups.map(g => ({ ...g.toJSON(), memberCount: g.SmsContacts?.length || 0 })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const group = await SmsContactGroup.findByPk(req.params.id, {
      include: [{ model: SmsContact, attributes: ['id', 'name', 'phone', 'email'] }],
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
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

    const group = await SmsContactGroup.create({
      companyId, name, description: description || null, createdBy: req.user.id,
    });

    if (contactIds && contactIds.length > 0) {
      const members = contactIds.map(contactId => ({ groupId: group.id, contactId }));
      await SmsContactGroupMember.bulkCreate(members, { ignoreDuplicates: true });
      await group.update({ contactCount: contactIds.length });
    }

    const full = await SmsContactGroup.findByPk(group.id, {
      include: [{ model: SmsContact, attributes: ['id', 'name', 'phone'] }],
    });

    res.status(201).json({ group: { ...full.toJSON(), memberCount: full.SmsContacts?.length || 0 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const group = await SmsContactGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
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
    const group = await SmsContactGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(group.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    await SmsContactGroupMember.destroy({ where: { groupId: group.id } });
    await group.destroy();
    res.json({ message: 'Group deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addMembers = async (req, res) => {
  try {
    const group = await SmsContactGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(group.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { contactIds } = req.body;
    if (!contactIds || contactIds.length === 0) {
      return res.status(400).json({ error: 'contactIds required' });
    }

    const members = contactIds.map(contactId => ({ groupId: group.id, contactId }));
    await SmsContactGroupMember.bulkCreate(members, { ignoreDuplicates: true });

    const full = await SmsContactGroup.findByPk(group.id, {
      include: [{ model: SmsContact, attributes: ['id', 'name', 'phone'] }],
    });
    await group.update({ contactCount: full.SmsContacts?.length || 0 });

    res.json({ group: { ...full.toJSON(), memberCount: full.SmsContacts?.length || 0 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeMembers = async (req, res) => {
  try {
    const group = await SmsContactGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(group.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { contactIds } = req.body;
    if (!contactIds || contactIds.length === 0) {
      return res.status(400).json({ error: 'contactIds required' });
    }

    await SmsContactGroupMember.destroy({
      where: { groupId: group.id, contactId: contactIds },
    });

    const full = await SmsContactGroup.findByPk(group.id, {
      include: [{ model: SmsContact, attributes: ['id', 'name', 'phone'] }],
    });
    await group.update({ contactCount: full.SmsContacts?.length || 0 });

    res.json({ group: { ...full.toJSON(), memberCount: full.SmsContacts?.length || 0 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMembers = async (req, res) => {
  try {
    const group = await SmsContactGroup.findByPk(req.params.id, {
      include: [{ model: SmsContact, attributes: ['id', 'name', 'phone', 'email'] }],
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(group.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    res.json({ contacts: group.SmsContacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
