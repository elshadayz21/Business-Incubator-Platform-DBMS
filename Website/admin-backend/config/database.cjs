require("dotenv").config();
const pkg = require("pg");
const { Pool } = pkg;
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,

});
console.log("Database connection pool created successfully");

module.exports = pool;