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
    const { name, ownerId, plan } = req.body;
    if (!name || !ownerId) return res.status(400).json({ error: 'Name and ownerId are required' });

    const owner = await BmUser.findByPk(ownerId);
    if (!owner) return res.status(404).json({ error: 'Owner user not found' });

    const company = await BmCompany.create({ name, ownerId, plan: plan || 'free' });
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

    const { name, plan, isActive } = req.body;
    await company.update({
      ...(name && { name }),
      ...(plan && { plan }),
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
