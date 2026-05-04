const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
});

pool.getConnection()
  .then((conn) => {
    console.log('Connected to MySQL database');
    conn.release();
  })
  .catch((err) => console.error('Database connection error:', err.message));

module.exports = pool;
