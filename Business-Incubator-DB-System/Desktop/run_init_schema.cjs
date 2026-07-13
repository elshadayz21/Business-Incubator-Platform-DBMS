require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("./src/electron/backend/config/database.cjs");

async function initDB() {
  try {
    console.log("Reading db.sql...");
    const sqlPath = path.join(__dirname, "../database/db.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    
    console.log("Executing db.sql...");
    await db.query(sql);
    console.log("✅ Initial schema (db.sql) executed successfully!");

    console.log("Creating Super Admin user...");
    const passwordHash = await bcrypt.hash("admin123", 10);
    const checkQuery = "SELECT * FROM users WHERE email = 'admin@incubator.eg'";
    const { rows } = await db.query(checkQuery);
    
    if (rows.length > 0) {
      console.log("Admin user already exists!");
    } else {
      const insertQuery = `
        INSERT INTO users (name, user_code, email, password, role)
        VALUES ('Super Admin', 'ADM001', 'admin@incubator.eg', $1, 'admin')
        RETURNING *;
      `;
      const newAdmin = await db.query(insertQuery, [passwordHash]);
      console.log("✅ Admin user created successfully:", newAdmin.rows[0].email);
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error during database setup:", err.message);
    process.exit(1);
  }
}

initDB();
