const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WhatsappAccount = sequelize.define('WhatsappAccount', {
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
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('disconnected', 'connecting', 'connected', 'qr_pending'),
    defaultValue: 'disconnected',
  },
  sessionData: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  // Meta Cloud API fields
  metaPhoneNumberId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  metaWabaId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  provider: {
    type: DataTypes.ENUM('baileys', 'meta_cloud'),
    defaultValue: 'baileys',
  },
}, {
  timestamps: true,
});

WhatsappAccount.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.sessionData;
  return values;
};

module.exports = WhatsappAccount;
