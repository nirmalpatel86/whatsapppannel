const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define('Company', {
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
  maxWhatsappAccounts: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
  },
  maxCampaignsPerDay: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  // Meta Cloud API fields (for future migration)
  metaBusinessId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  metaAccessToken: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metaWebhookSecret: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});

Company.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.metaAccessToken;
  delete values.metaWebhookSecret;
  return values;
};

module.exports = Company;
