const { BmCompany, BmUser } = require('../../models/bulkmail');

exports.list = async (req, res) => {
  try {
    const companies = await BmCompany.findAll({
      include: [{ model: BmUser, as: 'owner', attributes: ['id', 'name', 'phone', 'email'] }],
    });
    res.json({ companies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const company = await BmCompany.findByPk(req.params.id, {
      include: [
        { model: BmUser, as: 'owner', attributes: ['id', 'name', 'phone', 'email'] },
        { model: BmUser, as: 'users', attributes: ['id', 'name', 'phone', 'email', 'role', 'isActive'] },
      ],
    });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json({ company });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, ownerId, plan, maxCampaignsPerDay } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const resolvedOwnerId = ownerId || req.user.id;
    const owner = await BmUser.findByPk(resolvedOwnerId);
    if (!owner) return res.status(404).json({ error: 'Owner user not found' });

    const company = await BmCompany.create({
      name, ownerId: resolvedOwnerId, plan: plan || 'free',
      ...(maxCampaignsPerDay !== undefined && { maxCampaignsPerDay }),
    });
    await owner.update({ companyId: company.id });
    res.status(201).json({ company });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const company = await BmCompany.findByPk(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const { name, plan, maxCampaignsPerDay, isActive } = req.body;
    await company.update({
      ...(name && { name }),
      ...(plan && { plan }),
      ...(maxCampaignsPerDay !== undefined && { maxCampaignsPerDay }),
      ...(isActive !== undefined && { isActive }),
    });
    res.json({ company });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const company = await BmCompany.findByPk(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    await company.update({ isActive: false });
    res.json({ message: 'Company deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
