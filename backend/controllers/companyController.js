const { Company, User, WhatsappAccount } = require('../models');

exports.list = async (req, res) => {
  try {
    const companies = await Company.findAll({
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }],
    });
    res.json({ companies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'users', attributes: ['id', 'name', 'email', 'role'] },
        { model: WhatsappAccount },
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
    const { name, plan, maxWhatsappAccounts, maxCampaignsPerDay, ownerId } = req.body;
    const company = await Company.create({
      name,
      ownerId: ownerId || req.user.id,
      plan: plan || 'free',
      maxWhatsappAccounts: maxWhatsappAccounts || 2,
      maxCampaignsPerDay: maxCampaignsPerDay || 5,
    });
    if (ownerId) {
      await User.update({ companyId: company.id }, { where: { id: ownerId } });
    }
    res.status(201).json({ company });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    const { name, plan, maxWhatsappAccounts, maxCampaignsPerDay, isActive } = req.body;
    await company.update({
      ...(name && { name }),
      ...(plan && { plan }),
      ...(maxWhatsappAccounts !== undefined && { maxWhatsappAccounts }),
      ...(maxCampaignsPerDay !== undefined && { maxCampaignsPerDay }),
      ...(isActive !== undefined && { isActive }),
    });
    res.json({ company });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
