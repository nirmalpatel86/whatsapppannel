const { DataTypes } = require('sequelize');
const bulkmailSequelize = require('../../config/bulkmailDatabase');

const BmCampaignEmail = bulkmailSequelize.define('BmCampaignEmail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'delivered', 'failed', 'bounced', 'unknown'),
    defaultValue: 'pending',
  },
  isOpened: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  openCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isLinkClicked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  responseCode: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  trackingCode: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  openedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'bm_campaign_emails',
  indexes: [
    { fields: ['campaignId'] },
    { fields: ['email'] },
    { fields: ['status'] },
    { fields: ['trackingCode'] },
  ],
});

module.exports = BmCampaignEmail;
