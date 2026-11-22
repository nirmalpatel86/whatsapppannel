const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
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
  // For deductions — link to the message
  messageId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  // Meta pricing category
  messageCategory: {
    type: DataTypes.ENUM('marketing', 'utility', 'authentication', 'service', 'text_only'),
    allowNull: true,
  },
  recipientPhone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Who performed the recharge (super_admin or reseller id)
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
  indexes: [
    { fields: ['walletId'] },
    { fields: ['userId'] },
    { fields: ['type'] },
    { fields: ['createdAt'] },
  ],
});

module.exports = Transaction;
