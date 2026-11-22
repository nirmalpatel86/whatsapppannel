const { DataTypes } = require('sequelize');
const smsSequelize = require('../../config/smsDatabase');

const SmsSenderId = smsSequelize.define('SmsSenderId', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  senderId: {
    type: DataTypes.STRING(11),
    allowNull: false,
  },
  routeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'sms_sender_ids',
});

module.exports = SmsSenderId;
