const { SmsUser, SmsCompany, SmsWallet, SmsImpersonationLog } = require('../../models/sms');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../../utils/scopeHelper');
const jwt = require('jsonwebtoken');

// Roles that own their own tenant space and therefore get a dedicated Company at creation.
const OWNS_COMPANY_ROLES = ['super_admin', 'admin', 'reseller'];
const PHONE_REGEX = /^\d{12}$/;
const ROLE_RANK = { super_admin: 4, admin: 3, reseller: 2, user: 1 };

exports.list = async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'super_admin') {
      if (req.query.companyId) where.companyId = req.query.companyId;
    } else {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      where.companyId = { [Op.in]: visibleCompanyIds };
    }
    const users = await SmsUser.findAll({ where, include: [{ model: SmsCompany }] });
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
    if (!PHONE_REGEX.test(phone)) {
      return res.status(400).json({ error: 'Mobile number must be exactly 12 digits (country code + number)' });
    }

    if (req.user.role === 'reseller' && role !== 'user') {
      return res.status(403).json({ error: 'Resellers can only create users' });
    }

    const existingPhone = await SmsUser.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ error: 'Phone number already in use' });
    }

    const canSetRole = ['super_admin', 'admin'].includes(req.user.role);
    const targetRole = canSetRole ? (role || 'user') : 'user';

    const user = await SmsUser.create({
      name,
      phone,
      email: email || null,
      password,
      role: targetRole,
      parentId: req.user.id,
    });

    if (OWNS_COMPANY_ROLES.includes(targetRole)) {
      // Each reseller/admin gets their own isolated tenant space — never shared with siblings.
      const company = await SmsCompany.create({
        name: companyName || `${name}'s Company`,
        ownerId: user.id,
      });
      await user.update({ companyId: company.id });
    } else {
      const companyId = canSetRole ? (req.body.companyId || req.user.companyId) : req.user.companyId;
      await user.update({ companyId });
    }

    await SmsWallet.create({ userId: user.id, balance: 0 });

    res.status(201).json({ user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const user = await SmsUser.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(user.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const canSetRole = ['super_admin', 'admin'].includes(req.user.role);
    const { name, phone, email, isActive, role, password, maxUsers, entityId } = req.body;
    if (phone && !PHONE_REGEX.test(phone)) {
      return res.status(400).json({ error: 'Mobile number must be exactly 12 digits (country code + number)' });
    }
    await user.update({
      ...(name && { name }),
      ...(phone && { phone }),
      ...(email !== undefined && { email: email || null }),
      ...(password && { password }),
      ...(isActive !== undefined && { isActive }),
      ...(canSetRole && role && { role }),
      ...(maxUsers !== undefined && { maxUsers }),
      ...(entityId !== undefined && { entityId }),
    });
    res.json({ user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.impersonate = async (req, res) => {
  try {
    const target = await SmsUser.findByPk(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found' });

    const actorRank = ROLE_RANK[req.user.role] || 0;
    const targetRank = ROLE_RANK[target.role] || 0;

    if (targetRank >= actorRank) {
      return res.status(403).json({ error: 'Cannot impersonate a user with equal or higher privileges' });
    }
    if (!target.isActive) {
      return res.status(403).json({ error: 'Target account is deactivated' });
    }
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(target.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    await SmsImpersonationLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      targetUserId: target.id,
      companyId: target.companyId,
    });

    const token = jwt.sign(
      {
        id: target.id,
        role: target.role,
        companyId: target.companyId,
        service: 'sms',
        impersonatedBy: req.user.id,
        impersonatorRole: req.user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token, user: target.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const user = await SmsUser.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
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
