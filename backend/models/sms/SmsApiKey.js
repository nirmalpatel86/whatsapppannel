const { DataTypes } = require('sequelize');
const smsSequelize = require('../../config/smsDatabase');
const crypto = require('crypto');

const SmsApiKey = smsSequelize.define('SmsApiKey', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  apiKey: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
  },
  senderIdId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  routeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'sms_api_keys',
  hooks: {
    beforeCreate: (apiKey) => {
      if (!apiKey.apiKey) {
        apiKey.apiKey = crypto.randomBytes(32).toString('hex');
      }
    },
  },
});

module.exports = SmsApiKey;
