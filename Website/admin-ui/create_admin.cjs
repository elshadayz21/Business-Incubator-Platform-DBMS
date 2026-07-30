require("dotenv").config();
const bcrypt = require("bcrypt");
const db = require("./src/electron/backend/config/database.cjs");

async function createAdmin() {
  try {
    const passwordHash = await bcrypt.hash("admin123", 10);
    
    // Check if admin already exists
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
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
  } finally {
    process.exit(0);
  }
}

createAdmin();
