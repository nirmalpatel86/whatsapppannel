const { DataTypes } = require('sequelize');
const smsSequelize = require('../../config/smsDatabase');

const SmsCampaign = smsSequelize.define('SmsCampaign', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  companyId: {
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
  templateId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  senderIdId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  routeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  message: {
    type: DataTypes.TEXT('medium'),
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
  deliveredCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  failedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'running', 'paused', 'completed', 'failed'),
    defaultValue: 'draft',
  },
  messageType: {
    type: DataTypes.ENUM('text', 'unicode', 'flash'),
    defaultValue: 'text',
  },
  dltContentId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: true,
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
    defaultValue: 100,
  },
}, {
  timestamps: true,
  tableName: 'sms_campaigns',
});

module.exports = SmsCampaign;
