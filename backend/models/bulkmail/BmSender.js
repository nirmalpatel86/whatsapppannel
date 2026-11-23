const { DataTypes } = require('sequelize');
const bulkmailSequelize = require('../../config/bulkmailDatabase');

const BmSender = bulkmailSequelize.define('BmSender', {
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
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  replyName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  replyEmail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  smtpId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  senderGroupId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'bm_senders',
});

module.exports = BmSender;
