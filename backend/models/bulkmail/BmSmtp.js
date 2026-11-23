const { DataTypes } = require('sequelize');
const bulkmailSequelize = require('../../config/bulkmailDatabase');

const BmSmtp = bulkmailSequelize.define('BmSmtp', {
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
  host: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 587,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  secure: {
    type: DataTypes.ENUM('none', 'ssl', 'tls'),
    defaultValue: 'tls',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  maxPerHour: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
  },
}, {
  timestamps: true,
  tableName: 'bm_smtp_servers',
});

module.exports = BmSmtp;
