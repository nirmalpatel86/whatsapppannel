const { DataTypes } = require('sequelize');
const smsSequelize = require('../../config/smsDatabase');

const SmsTransaction = smsSequelize.define('SmsTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  walletId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('recharge', 'deduction', 'refund'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 4),
    allowNull: false,
    get() {
      return parseFloat(this.getDataValue('amount')) || 0;
    },
  },
  balanceAfter: {
    type: DataTypes.DECIMAL(12, 4),
    allowNull: false,
    get() {
      return parseFloat(this.getDataValue('balanceAfter')) || 0;
    },
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  smsCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  routeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  performedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'sms_transactions',
  indexes: [
    { fields: ['walletId'] },
    { fields: ['userId'] },
    { fields: ['type'] },
    { fields: ['createdAt'] },
  ],
});

module.exports = SmsTransaction;
