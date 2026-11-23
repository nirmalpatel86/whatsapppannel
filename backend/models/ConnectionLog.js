const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConnectionLog = sequelize.define('ConnectionLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  whatsappAccountId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  event: {
    type: DataTypes.ENUM('connecting', 'qr_pending', 'connected', 'disconnected'),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['whatsappAccountId'] },
  ],
});

module.exports = ConnectionLog;
