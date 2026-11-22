const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContactGroupMember = sequelize.define('ContactGroupMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  contactId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  indexes: [
    { unique: true, fields: ['groupId', 'contactId'] },
  ],
});

module.exports = ContactGroupMember;
