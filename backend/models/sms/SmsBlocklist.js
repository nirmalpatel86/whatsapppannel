const { DataTypes } = require('sequelize');
const smsSequelize = require('../../config/smsDatabase');

const SmsBlocklist = smsSequelize.define('SmsBlocklist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'sms_blocklist',
  indexes: [
    { unique: true, fields: ['companyId', 'phone'] },
  ],
});

module.exports = SmsBlocklist;
