const { Wallet, Transaction, User } = require('../models');
const walletService = require('../services/walletService');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../utils/scopeHelper');

exports.getMyWallet = async (req, res) => {
  try {
    const wallet = await walletService.getOrCreateWallet(req.user.id);
    res.json({ wallet, pricing: walletService.META_PRICING });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getWallet = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUser = await User.findByPk(userId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(targetUser.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const wallet = await walletService.getOrCreateWallet(userId);
    res.json({ wallet, user: targetUser.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.recharge = async (req, res) => {
  try {
    const { userId, amount, reference } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid userId and positive amount required' });
    }

    const targetUser = await User.findByPk(userId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Super admin can recharge anyone; admin/reseller only within their own visible scope
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(targetUser.companyId)) {
        return res.status(403).json({ error: 'You can only recharge users in your own scope' });
      }
      if (req.user.role === 'reseller' && targetUser.role !== 'user') {
        return res.status(403).json({ error: 'Resellers can only recharge their users' });
      }
    }

    const { wallet, transaction } = await walletService.recharge({
      targetUserId: userId,
      amount,
      performedById: req.user.id,
      reference,
    });

    res.json({ wallet, transaction, message: `Recharged ${amount} successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50, type, startDate, endDate } = req.query;

    // Determine target user
    let targetUserId = userId || req.user.id;

    if (userId && req.user.role !== 'super_admin' && req.user.role !== 'user') {
      const targetUser = await User.findByPk(userId);
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!targetUser || !visibleCompanyIds.includes(targetUser.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (userId && req.user.role === 'user' && parseInt(userId) !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const wallet = await walletService.getOrCreateWallet(targetUserId);

    const where = { walletId: wallet.id };
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const transactions = await Transaction.findAndCountAll({
      where,
      include: [
        { model: User, as: 'performer', attributes: ['id', 'name', 'email', 'role'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({
      transactions: transactions.rows,
      total: transactions.count,
      page: parseInt(page),
      totalPages: Math.ceil(transactions.count / parseInt(limit)),
      wallet,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRechargeableUsers = async (req, res) => {
  try {
    let where = {};

    if (req.user.role === 'super_admin') {
      // Super admin sees all admins, resellers and users
      where.role = { [Op.in]: ['admin', 'reseller', 'user'] };
    } else {
      // Admin sees their own resellers & users; reseller sees only their own users
      where.companyId = { [Op.in]: await getVisibleCompanyIds(User, req.user) };
      where.role = req.user.role === 'reseller' ? 'user' : { [Op.in]: ['reseller', 'user'] };
    }

    const users = await User.findAll({
      where: { ...where, isActive: true },
      attributes: ['id', 'name', 'email', 'role', 'companyId'],
      include: [{ model: Wallet, attributes: ['balance'] }],
      order: [['name', 'ASC']],
    });

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPricing = async (req, res) => {
  res.json({ pricing: walletService.META_PRICING });
};

exports.checkBalance = async (req, res) => {
  try {
    const { messages = 1, category = 'text_only' } = req.query;
    const result = await walletService.checkBalance(req.user.id, parseInt(messages), category);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
