const { DataTypes } = require('sequelize');
const smsSequelize = require('../../config/smsDatabase');
const bcrypt = require('bcryptjs');

const SmsUser = smsSequelize.define('SmsUser', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'admin', 'reseller', 'user'),
    defaultValue: 'user',
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  maxUsers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  websiteUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  apiKey: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'sms_users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
  },
});

SmsUser.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

SmsUser.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = SmsUser;
