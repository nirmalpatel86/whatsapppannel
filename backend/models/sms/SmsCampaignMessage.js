const { DataTypes } = require('sequelize');
const smsSequelize = require('../../config/smsDatabase');

const SmsCampaignMessage = smsSequelize.define('SmsCampaignMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'delivered', 'failed', 'rejected', 'expired'),
    defaultValue: 'pending',
  },
  responseCode: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  smscId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'sms_campaign_messages',
  indexes: [
    { fields: ['campaignId'] },
    { fields: ['phone'] },
    { fields: ['status'] },
  ],
});

module.exports = SmsCampaignMessage;
