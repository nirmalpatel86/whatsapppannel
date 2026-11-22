const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  alternateMobile: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  profession: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  contactType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  anniversary: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  pushName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  profilePicUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    { unique: true, fields: ['companyId', 'phone'] },
  ],
});

module.exports = Contact;
