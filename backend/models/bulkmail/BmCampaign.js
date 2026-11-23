const { DataTypes } = require('sequelize');
const bulkmailSequelize = require('../../config/bulkmailDatabase');

const BmCampaign = bulkmailSequelize.define('BmCampaign', {
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
  contactGroupId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  templateId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  body: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
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
  openCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  clickCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  bounceCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  unsubscribeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'running', 'paused', 'completed', 'failed'),
    defaultValue: 'draft',
  },
  campaignType: {
    type: DataTypes.ENUM('regular', 'api', 'quick'),
    defaultValue: 'regular',
  },
  senderGroupId: {
    type: DataTypes.INTEGER,
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
}, {
  timestamps: true,
  tableName: 'bm_campaigns',
});

module.exports = BmCampaign;
