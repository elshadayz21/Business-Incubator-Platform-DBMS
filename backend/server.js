import "dotenv/config";
import app from "./app.js";
import pool from "./config/db.js";

const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

async function testConnection() {
  const res = await pool.query("SELECT NOW()");
  console.log("PostgreSQL connected:", res.rows[0]);
}

testConnection()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      if (!isProduction) {
        console.log(`Local: http://localhost:${port}`);
        console.log(`Admin: http://localhost:${port}/admin`);
      }
    });
  })
  .catch((err) => {
    console.error("Failed to connect DB or start server:", err);
    process.exit(1);
  });
