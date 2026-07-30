import "dotenv/config";
import app from "./app.js";
import pool from "./config/db.js";

const port = process.env.PORT || 3000;

async function testConnection() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("PostgreSQL connected:", res.rows[0]);
  } catch (err) {
    console.error("DB connection error:", err.message);
    throw err;
  }
}

testConnection()
  .then(() => {
    app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
  })
  .catch((err) => {
    console.error("Failed to connect DB or start server:", err.message);
  });
