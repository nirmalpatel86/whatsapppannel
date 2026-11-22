const { SmsTransaction, SmsWallet, SmsUser } = require('../../models/sms');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../../utils/scopeHelper');

exports.list = async (req, res) => {
  try {
    const { userId, page = 1, limit = 50, type, startDate, endDate } = req.query;

    let targetUserId = userId || req.user.id;

    if (userId && req.user.role !== 'super_admin' && req.user.role !== 'user') {
      const targetUser = await SmsUser.findByPk(userId);
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!targetUser || !visibleCompanyIds.includes(targetUser.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (userId && req.user.role === 'user' && parseInt(userId) !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const wallet = await SmsWallet.findOne({ where: { userId: targetUserId } });
    if (!wallet) return res.json({ transactions: [], total: 0, page: 1, totalPages: 0 });

    const where = { walletId: wallet.id };
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const transactions = await SmsTransaction.findAndCountAll({
      where,
      include: [
        { model: SmsUser, as: 'performer', attributes: ['id', 'name', 'email', 'role'] },
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
