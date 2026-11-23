const { DataTypes } = require('sequelize');
const bulkmailSequelize = require('../../config/bulkmailDatabase');

const BmImpersonationLog = bulkmailSequelize.define('BmImpersonationLog', {
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
  tableName: 'bm_impersonation_logs',
});

module.exports = BmImpersonationLog;
