const { Sequelize } = require('sequelize');
require('dotenv').config();

const smsSequelize = new Sequelize(
  process.env.SMS_DB_NAME || 'sms_panel',
  process.env.SMS_DB_USER || process.env.DB_USER,
  process.env.SMS_DB_PASSWORD || process.env.DB_PASSWORD,
  {
    host: process.env.SMS_DB_HOST || process.env.DB_HOST,
    port: process.env.SMS_DB_PORT || process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = smsSequelize;
