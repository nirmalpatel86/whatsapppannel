const { DataTypes } = require('sequelize');
const smsSequelize = require('../../config/smsDatabase');

const SmsCompany = smsSequelize.define('SmsCompany', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  plan: {
    type: DataTypes.ENUM('free', 'basic', 'pro', 'enterprise'),
    defaultValue: 'free',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'sms_companies',
});

module.exports = SmsCompany;
