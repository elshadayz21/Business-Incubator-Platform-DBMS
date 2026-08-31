import { Pool } from "pg";
import "dotenv/config";

const isLocal = process.env.DB_HOST === "localhost" || process.env.DB_HOST === "127.0.0.1";

const config = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASS,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    };

const pool = new Pool(config);

export default pool;