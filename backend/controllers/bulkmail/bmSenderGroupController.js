const { BmSenderGroup, BmSender, BmUser } = require('../../models/bulkmail');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../../utils/scopeHelper');

exports.list = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.query.companyId || req.user.companyId)
      : { [Op.in]: await getVisibleCompanyIds(BmUser, req.user) };
    const groups = await BmSenderGroup.findAll({
      where: { companyId },
      include: [{ model: BmSender, attributes: ['id', 'name', 'email'] }],
    });
    res.json({ groups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const group = await BmSenderGroup.findByPk(req.params.id, {
      include: [{ model: BmSender }],
    });
    if (!group) return res.status(404).json({ error: 'Sender group not found' });
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

    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const group = await BmSenderGroup.create({ companyId, name });
    res.status(201).json({ group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const group = await BmSenderGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Sender group not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(group.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    const { name } = req.body;
    await group.update({ ...(name && { name }) });
    res.json({ group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const group = await BmSenderGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Sender group not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(group.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    await group.destroy();
    res.json({ message: 'Sender group deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
