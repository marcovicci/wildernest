const postgres = require('postgres')

const sql = postgres({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = sql
