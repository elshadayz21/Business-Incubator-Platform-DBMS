require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const isLocalHost =
  process.env.DB_HOST === "localhost" || process.env.DB_HOST === "127.0.0.1";

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASS,
      port: process.env.DB_PORT,
      ssl: isLocalHost ? false : { rejectUnauthorized: false },
    };

const pool = new Pool(poolConfig);

const SKIPPABLE_CODES = ["42701", "42P07", "42P06", "42P16", "42501"];

async function runStatements(sql, label) {
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    try {
      await pool.query(stmt);
    } catch (err) {
      if (
        SKIPPABLE_CODES.includes(err.code) ||
        err.message?.includes("already exists") ||
        err.message?.includes("must be owner")
      ) {
        console.log("  ⏭️  Skipped (" + (err.message || err.code) + ")");
      } else {
        throw err;
      }
    }
  }
  console.log(`✅ ${label} done`);
}

async function run() {
  const schemaPath = path.join(
    __dirname,
    "..",
    "database",
    "db.sql",
  );
  console.log("Running base schema:", schemaPath);
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  await runStatements(schemaSql, "Base schema");

  const migrationsDir = path.join(
    __dirname,
    "..",
    "database",
    "migrations",
  );
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    await runStatements(sql, `Migration ${file}`);
  }

  console.log("🎉 All done — schema + migrations applied.");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
