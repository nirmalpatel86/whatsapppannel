const { User, Company } = require('../models');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../utils/scopeHelper');

// Roles that own their own tenant space and therefore get a dedicated Company at creation.
const OWNS_COMPANY_ROLES = ['super_admin', 'admin', 'reseller'];

exports.list = async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'super_admin') {
      if (req.query.companyId) where.companyId = req.query.companyId;
    } else {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      where.companyId = { [Op.in]: visibleCompanyIds };
    }
    const users = await User.findAll({ where, include: [{ model: Company }] });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, phone, email, password, role, companyName } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (req.user.role === 'reseller' && role !== 'user') {
      return res.status(403).json({ error: 'Resellers can only create users' });
    }

    const existingPhone = await User.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ error: 'Phone number already in use' });
    }

    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const canSetRole = ['super_admin', 'admin'].includes(req.user.role);
    const targetRole = canSetRole ? (role || 'user') : 'user';

    const user = await User.create({
      name,
      phone,
      email: email || null,
      password,
      role: targetRole,
      parentId: req.user.id,
    });

    if (OWNS_COMPANY_ROLES.includes(targetRole)) {
      // Each reseller/admin gets their own isolated tenant space — never shared with siblings.
      const company = await Company.create({
        name: companyName || `${name}'s Company`,
        ownerId: user.id,
      });
      await user.update({ companyId: company.id });
    } else {
      const companyId = canSetRole ? (req.body.companyId || req.user.companyId) : req.user.companyId;
      await user.update({ companyId });
    }

    res.status(201).json({ user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(user.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const canSetRole = ['super_admin', 'admin'].includes(req.user.role);
    const { name, phone, email, isActive, role, maxWhatsappAccounts, password } = req.body;
    await user.update({
      ...(name && { name }),
      ...(phone && { phone }),
      ...(email !== undefined && { email: email || null }),
      ...(password && { password }),
      ...(isActive !== undefined && { isActive }),
      ...(canSetRole && role && { role }),
      ...(maxWhatsappAccounts !== undefined && { maxWhatsappAccounts }),
    });
    res.json({ user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(user.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    await user.update({ isActive: false });
    res.json({ message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
