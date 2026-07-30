require("dotenv").config();
const pkg = require("pg");
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || "incubator_user",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "incubator_db",
  password: process.env.DB_PASS || "strongpassword",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
});

console.log("Database connection pool created successfully");

module.exports = pool;