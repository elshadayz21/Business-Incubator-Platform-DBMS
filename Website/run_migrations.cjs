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

async function run() {
  // 1. Run the base schema
  const schemaPath = path.join(
    __dirname,
    "..",
    "Business-Incubator-DB-System",
    "database",
    "db.sql",
  );
  console.log("Running base schema:", schemaPath);
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  await pool.query(schemaSql);
  console.log("✅ Base schema applied");

  // 2. Run every migration file in order
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
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (err) {
        const skippable = ["42701", "42P07", "42P06", "42P16"];
        if (
          skippable.includes(err.code) ||
          err.message?.includes("already exists")
        ) {
          console.log("  ⏭️  Skipped (already exists)");
        } else {
          throw err;
        }
      }
    }
    console.log(`✅ Executed ${file}`);
  }

  console.log("🎉 All done — schema + migrations applied.");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
