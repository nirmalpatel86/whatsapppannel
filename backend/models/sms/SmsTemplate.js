const { DataTypes } = require('sequelize');
const smsSequelize = require('../../config/smsDatabase');

const SmsTemplate = smsSequelize.define('SmsTemplate', {
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
  body: {
    type: DataTypes.TEXT('medium'),
    allowNull: false,
  },
  senderIdId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  routeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  dltContentId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  templateType: {
    type: DataTypes.ENUM('transactional', 'promotional', 'otp'),
    defaultValue: 'transactional',
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected'),
    defaultValue: 'draft',
  },
  isUnicode: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  tableName: 'sms_templates',
});

module.exports = SmsTemplate;
