const { SmsCompany, SmsUser } = require('../../models/sms');

exports.list = async (req, res) => {
  try {
    const companies = await SmsCompany.findAll({
      include: [{ model: SmsUser, as: 'owner', attributes: ['id', 'name', 'email'] }],
    });
    res.json({ companies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const company = await SmsCompany.findByPk(req.params.id, {
      include: [
        { model: SmsUser, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: SmsUser, as: 'users', attributes: ['id', 'name', 'email', 'role'] },
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
    const { name, plan, ownerId } = req.body;
    const company = await SmsCompany.create({
      name,
      ownerId: ownerId || req.user.id,
      plan: plan || 'free',
    });
    if (ownerId) {
      await SmsUser.update({ companyId: company.id }, { where: { id: ownerId } });
    }
    res.status(201).json({ company });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const company = await SmsCompany.findByPk(req.params.id);
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
