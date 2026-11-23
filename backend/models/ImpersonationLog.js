const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ImpersonationLog = sequelize.define('ImpersonationLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  actorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  actorRole: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  targetUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = ImpersonationLog;
