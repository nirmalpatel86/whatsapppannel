const { DataTypes } = require('sequelize');
const smsSequelize = require('../../config/smsDatabase');

const SmsWallet = smsSequelize.define('SmsWallet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  balance: {
    type: DataTypes.DECIMAL(12, 4),
    defaultValue: 0,
    get() {
      return parseFloat(this.getDataValue('balance')) || 0;
    },
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR',
  },
  totalRecharged: {
    type: DataTypes.DECIMAL(12, 4),
    defaultValue: 0,
    get() {
      return parseFloat(this.getDataValue('totalRecharged')) || 0;
    },
  },
  totalSpent: {
    type: DataTypes.DECIMAL(12, 4),
    defaultValue: 0,
    get() {
      return parseFloat(this.getDataValue('totalSpent')) || 0;
    },
  },
}, {
  timestamps: true,
  tableName: 'sms_wallets',
});

module.exports = SmsWallet;
