const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const crypto = require('crypto');

const WhatsappApiKey = sequelize.define('WhatsappApiKey', {
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
  whatsappAccountId: {
    type: DataTypes.INTEGER,
    allowNull: true,
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

module.exports = WhatsappApiKey;
