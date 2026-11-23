const { DataTypes } = require('sequelize');
const smsSequelize = require('../../config/smsDatabase');

const SmsImpersonationLog = smsSequelize.define('SmsImpersonationLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  actorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  actorRole: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  targetUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'sms_impersonation_logs',
});

module.exports = SmsImpersonationLog;
