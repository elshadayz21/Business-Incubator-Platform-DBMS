require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

const SKIPPABLE_CODES = ["42701", "42P07", "42P06", "42P16"];

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
        err.message?.includes("already exists")
      ) {
        console.log("  ⏭️  Skipped (already exists)");
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
    "Business-Incubator-DB-System",
    "database",
    "db.sql",
  );
  console.log("Running base schema:", schemaPath);
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  await runStatements(schemaSql, "Base schema");

  const migrationsDir = path.join(
    __dirname,
    "..",
    "Business-Incubator-DB-System",
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
