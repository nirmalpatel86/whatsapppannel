const { Wallet, Transaction, User, sequelize } = require('../models');

// Meta Cloud API pricing (per message, in INR)
// Based on Meta's latest pricing for India region
const META_PRICING = {
  marketing: 0.7720,
  utility: 0.3500,
  authentication: 0.3500,
  service: 0.3500,
  text_only: 0.5000,
};

const getMessageCost = (category = 'text_only') => {
  return META_PRICING[category] || META_PRICING.text_only;
};

const getOrCreateWallet = async (userId) => {
  let [wallet] = await Wallet.findOrCreate({
    where: { userId },
    defaults: { balance: 0 },
  });
  return wallet;
};

const recharge = async ({ targetUserId, amount, performedById, reference }) => {
  const t = await sequelize.transaction();
  try {
    const wallet = await getOrCreateWallet(targetUserId);

    const newBalance = wallet.balance + parseFloat(amount);
    await wallet.update({
      balance: newBalance,
      totalRecharged: wallet.totalRecharged + parseFloat(amount),
    }, { transaction: t });

    const transaction = await Transaction.create({
      walletId: wallet.id,
      userId: targetUserId,
      type: 'recharge',
      amount: parseFloat(amount),
      balanceAfter: newBalance,
      description: `Recharge of ${amount}`,
      performedBy: performedById,
      reference: reference || null,
    }, { transaction: t });

    await t.commit();
    return { wallet: await wallet.reload(), transaction };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const deductForMessage = async ({ userId, messageId, campaignId, recipientPhone, category = 'text_only' }) => {
  const t = await sequelize.transaction();
  try {
    const wallet = await Wallet.findOne({
      where: { userId },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!wallet) {
      await t.rollback();
      throw new Error('Wallet not found. Please contact admin for recharge.');
    }

    const cost = getMessageCost(category);

    if (wallet.balance < cost) {
      await t.rollback();
      throw new Error(`Insufficient balance. Need ${cost.toFixed(4)}, have ${wallet.balance.toFixed(4)}`);
    }

    const newBalance = wallet.balance - cost;
    await wallet.update({
      balance: newBalance,
      totalSpent: wallet.totalSpent + cost,
    }, { transaction: t });

    const description = campaignId
      ? `Campaign message to ${recipientPhone}`
      : `Message to ${recipientPhone}`;

    const transaction = await Transaction.create({
      walletId: wallet.id,
      userId,
      type: 'deduction',
      amount: cost,
      balanceAfter: newBalance,
      description,
      messageId: messageId || null,
      campaignId: campaignId || null,
      messageCategory: category,
      recipientPhone,
    }, { transaction: t });

    await t.commit();
    return { wallet: await wallet.reload(), transaction, cost };
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
};

const checkBalance = async (userId, requiredMessages = 1, category = 'text_only') => {
  const wallet = await getOrCreateWallet(userId);
  const costPerMessage = getMessageCost(category);
  const totalCost = costPerMessage * requiredMessages;
  return {
    balance: wallet.balance,
    costPerMessage,
    totalCost,
    canSend: wallet.balance >= totalCost,
    maxMessages: Math.floor(wallet.balance / costPerMessage),
  };
};

module.exports = {
  META_PRICING,
  getMessageCost,
  getOrCreateWallet,
  recharge,
  deductForMessage,
  checkBalance,
};
