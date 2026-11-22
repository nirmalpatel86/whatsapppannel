const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MessageTemplate = sequelize.define('MessageTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'en',
  },
  category: {
    type: DataTypes.ENUM('marketing', 'utility', 'authentication'),
    defaultValue: 'marketing',
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  header: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  footer: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  buttons: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected'),
    defaultValue: 'draft',
  },
  // Meta template ID when synced
  metaTemplateId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = MessageTemplate;
