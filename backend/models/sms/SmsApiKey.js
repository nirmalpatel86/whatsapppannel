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
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'sms_api_keys',
  hooks: {
    // Must run before validation (not beforeCreate) — apiKey is NOT NULL, and
    // Sequelize validates required fields before beforeCreate hooks ever run.
    beforeValidate: (apiKey) => {
      if (!apiKey.apiKey) {
        apiKey.apiKey = crypto.randomBytes(32).toString('hex');
      }
    },
  },
});

module.exports = SmsApiKey;
