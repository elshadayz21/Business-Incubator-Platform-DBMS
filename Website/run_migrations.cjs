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

// Error codes for items that already exist in PostgreSQL
const SKIPPABLE_ERRORS = [
  "42701", // duplicate_column
  "42P07", // duplicate_table (relation already exists)
  "42P06", // duplicate_schema
  "42P16", // invalid_table_definition
  "42710", // duplicate_object (e.g. constraint/primary key already exists)
];

async function executeSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, "utf-8");

  // Split query into individual SQL statements
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
    } catch (err) {
      if (
        SKIPPABLE_ERRORS.includes(err.code) ||
        err.message?.toLowerCase().includes("already exists")
      ) {
        // Safe to skip if table/constraint/column already exists
        continue;
      } else {
        throw err;
      }
    }
  }
}

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
  await executeSqlFile(schemaPath);
  console.log("✅ Base schema applied");

  // 2. Run every migration file in order
  const migrationsDir = path.join(
    __dirname,
    "..",
    "Business-Incubator-DB-System",
    "database",
    "migrations",
  );

  if (fs.existsSync(migrationsDir)) {
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      await executeSqlFile(path.join(migrationsDir, file));
      console.log(`✅ Executed ${file}`);
    }
  }

  console.log("🎉 All done — schema + migrations applied.");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
