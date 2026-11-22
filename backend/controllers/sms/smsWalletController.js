const { SmsWallet, SmsTransaction, SmsUser } = require('../../models/sms');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../../utils/scopeHelper');

async function getOrCreateWallet(userId) {
  let wallet = await SmsWallet.findOne({ where: { userId } });
  if (!wallet) {
    wallet = await SmsWallet.create({ userId, balance: 0 });
  }
  return wallet;
}

exports.getMyWallet = async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user.id);
    res.json({ wallet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getWallet = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUser = await SmsUser.findByPk(userId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(targetUser.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const wallet = await getOrCreateWallet(userId);
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

    const targetUser = await SmsUser.findByPk(userId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(targetUser.companyId)) {
        return res.status(403).json({ error: 'You can only recharge users in your own scope' });
      }
      if (req.user.role === 'reseller' && targetUser.role !== 'user') {
        return res.status(403).json({ error: 'Resellers can only recharge their users' });
      }
    }

    const wallet = await getOrCreateWallet(userId);
    const newBalance = wallet.balance + parseFloat(amount);

    await wallet.update({
      balance: newBalance,
      totalRecharged: wallet.totalRecharged + parseFloat(amount),
    });

    const transaction = await SmsTransaction.create({
      walletId: wallet.id,
      userId: parseInt(userId),
      type: 'recharge',
      amount: parseFloat(amount),
      balanceAfter: newBalance,
      description: reference ? `Recharge: ${reference}` : 'Wallet recharge',
      performedBy: req.user.id,
      reference,
    });

    res.json({ wallet, transaction, message: `Recharged ${amount} successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRechargeableUsers = async (req, res) => {
  try {
    let where = {};

    if (req.user.role === 'super_admin') {
      where.role = { [Op.in]: ['admin', 'reseller', 'user'] };
    } else {
      where.companyId = { [Op.in]: await getVisibleCompanyIds(SmsUser, req.user) };
      where.role = req.user.role === 'reseller' ? 'user' : { [Op.in]: ['reseller', 'user'] };
    }

    const users = await SmsUser.findAll({
      where: { ...where, isActive: true },
      attributes: ['id', 'name', 'email', 'role', 'companyId'],
      include: [{ model: SmsWallet, attributes: ['balance'] }],
      order: [['name', 'ASC']],
    });

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.checkBalance = async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user.id);
    res.json({ balance: wallet.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
