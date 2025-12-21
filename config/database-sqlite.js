// Replace SQLite implementation with MySQL by re-using the existing MySQL pool
// This file existed originally to support SQLite; to force MySQL usage
// we simply re-export the MySQL promise pool from `config/database.js`.

const mysqlPool = require('./database');

module.exports = mysqlPool;
