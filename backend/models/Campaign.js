const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  whatsappAccountId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'running', 'paused', 'completed', 'failed'),
    defaultValue: 'draft',
  },
  type: {
    type: DataTypes.ENUM('text', 'image', 'template'),
    defaultValue: 'text',
  },
  messageBody: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  mediaUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Meta Cloud API template fields
  templateName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  templateLanguage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  templateParams: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  recipients: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  totalRecipients: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  sentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  failedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  deliveredCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  delayBetweenMessages: {
    type: DataTypes.INTEGER,
    defaultValue: 3000,
  },
}, {
  timestamps: true,
});

module.exports = Campaign;
