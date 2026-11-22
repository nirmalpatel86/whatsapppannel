const { Sequelize } = require('sequelize');
require('dotenv').config();

const bulkmailSequelize = new Sequelize(
  process.env.BULKMAIL_DB_NAME || 'bulkmail_panel',
  process.env.BULKMAIL_DB_USER || process.env.DB_USER,
  process.env.BULKMAIL_DB_PASSWORD || process.env.DB_PASSWORD,
  {
    host: process.env.BULKMAIL_DB_HOST || process.env.DB_HOST,
    port: process.env.BULKMAIL_DB_PORT || process.env.DB_PORT,
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

module.exports = bulkmailSequelize;
