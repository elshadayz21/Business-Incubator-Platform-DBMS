require("dotenv").config();
const fs = require("fs");
const path = require("path");
const db = require("./src/electron/backend/config/database.cjs");

async function initDB() {
  try {
    console.log("Reading db.sql...");
    const sqlPath = path.join(__dirname, "../database/db.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    
    console.log("Executing db.sql...");
    await db.query(sql);
    console.log("✅ Initial schema (db.sql) executed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error executing db.sql:", err.message);
    process.exit(1);
  }
}

initDB();
