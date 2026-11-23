const { DataTypes } = require('sequelize');
const bulkmailSequelize = require('../../config/bulkmailDatabase');

const BmContact = bulkmailSequelize.define('BmContact', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  profession: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  col1: { type: DataTypes.STRING, allowNull: true },
  col2: { type: DataTypes.STRING, allowNull: true },
  col3: { type: DataTypes.STRING, allowNull: true },
  col4: { type: DataTypes.STRING, allowNull: true },
  col5: { type: DataTypes.STRING, allowNull: true },
  isSubscribed: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'bm_contacts',
  indexes: [
    { fields: ['companyId', 'email'] },
    { fields: ['groupId'] },
  ],
});

module.exports = BmContact;
