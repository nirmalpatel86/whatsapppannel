const { DataTypes } = require('sequelize');
const smsSequelize = require('../../config/smsDatabase');

const SmsContactGroupMember = smsSequelize.define('SmsContactGroupMember', {
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
  timestamps: true,
  tableName: 'sms_contact_group_members',
  indexes: [
    { unique: true, fields: ['groupId', 'contactId'] },
  ],
});

module.exports = SmsContactGroupMember;
