const { DataTypes } = require('sequelize');
const smsSequelize = require('../../config/smsDatabase');

const SmsRoute = smsSequelize.define('SmsRoute', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  routeType: {
    type: DataTypes.ENUM('transactional', 'promotional', 'otp', 'premium'),
    allowNull: false,
  },
  smscId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  apiUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  apiUsername: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  apiPassword: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dlrUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  costPerSms: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'sms_routes',
});

SmsRoute.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.apiPassword;
  return values;
};

module.exports = SmsRoute;
