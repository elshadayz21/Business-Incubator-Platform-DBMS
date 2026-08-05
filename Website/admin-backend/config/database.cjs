require("dotenv").config();
const pkg = require("pg");
const { Pool } = pkg;

const isLocal = process.env.DB_HOST === "localhost" || process.env.DB_HOST === "127.0.0.1";

const config = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
    }
  : {
      user: process.env.DB_USER || "postgres.mnysgjtrtlsafospupte",
      host: process.env.DB_HOST || "aws-0-eu-central-1.pooler.supabase.com",
      database: process.env.DB_NAME || "postgres",
      password: process.env.DB_PASS || "TikiFant@hun92%99",
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    };

const pool = new Pool(config);
console.log("Database connection pool created successfully");

module.exports = pool;