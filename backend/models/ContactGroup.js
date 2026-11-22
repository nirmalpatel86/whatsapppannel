const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContactGroup = sequelize.define('ContactGroup', {
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
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = ContactGroup;
