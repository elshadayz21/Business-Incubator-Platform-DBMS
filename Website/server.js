import "dotenv/config";
console.log("HOST IS:", process.env.DB_HOST); // <-- Add this lin
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
      openBrowser(`http://localhost:${port}/admin`);
    });
  })
    .catch((err) => {
      console.error("Failed to connect DB or start server:", err); // <-- now it will show the full error
    });
