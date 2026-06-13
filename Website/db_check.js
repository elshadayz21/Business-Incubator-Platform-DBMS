import pool from "./config/db.js";

async function checkDb() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'workshops'");
    console.log("Columns of workshops table:", res.rows.map(r => r.column_name));
  } catch (err) {
    console.error("Error checking DB:", err.message);
  } finally {
    await pool.end();
  }
}

checkDb();
