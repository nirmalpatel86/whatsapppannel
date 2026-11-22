const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  contactId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  whatsappAccountId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  lastMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  unreadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  indexes: [
    { unique: true, fields: ['contactId', 'whatsappAccountId'] },
  ],
});

module.exports = Chat;
