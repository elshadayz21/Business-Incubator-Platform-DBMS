// FIX: Must stay as the FIRST import. ES module imports are hoisted and
// executed before any other code in this file, so "dotenv/config" runs
// before ./config/db.js creates its pool. Using `import { config } from
// "dotenv"` + a later config() call was too late, leaving process.env.DB_*
// undefined and pg failing with "client password must be a string".
import "dotenv/config";
// DEBUG: temporary log to verify .env values are loaded (safe to remove).
console.log("HOST IS:", process.env.DB_HOST);
import app from "./app.js";
import pool from "./config/db.js";
import { exec } from "child_process";

const port = process.env.PORT || 3000;

async function testConnection() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("PostgreSQL connected:", res.rows[0]);
  } catch (err) {
    console.error("DB connection error:", err);
    throw err;
  }
}

function openBrowser(url) {
  const cmd = process.platform === "win32" ? `start ${url}`
            : process.platform === "darwin" ? `open ${url}`
            : `xdg-open ${url}`;
  exec(cmd);
}

testConnection()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
      console.log(`Admin panel: http://localhost:${port}/admin`);
      openBrowser(`http://localhost:${port}`);
    });
  })
    .catch((err) => {
      // FIX: log the full error object (not just err.message) so DB
      // connection failures show their real cause instead of being swallowed.
      console.error("Failed to connect DB or start server:", err);
    });
