import pool from "../../config/db.js";

export const getSystemOverview = async () => {
  const [usersByRole, totals, dbCheck] = await Promise.all([
    pool.query(
      `SELECT role, COUNT(*)::int AS count FROM users GROUP BY role ORDER BY role`,
    ),
    pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM users) AS users,
         (SELECT COUNT(*)::int FROM projects) AS projects,
         (SELECT COUNT(*)::int FROM cohorts) AS cohorts,
         (SELECT COUNT(*)::int FROM applications) AS applications,
         (SELECT COUNT(*)::int FROM funding_requests) AS funding_requests,
         (SELECT COUNT(*)::int FROM mentor_assignments) AS mentor_assignments,
         (SELECT COUNT(*)::int FROM mentor_sessions) AS mentor_sessions`,
    ),
    pool.query(`SELECT NOW() AS db_time, current_database() AS database, version()`),
  ]);

  const db = dbCheck.rows[0];
  return {
    server: {
      name: "DxValley ICMS",
      environment: process.env.NODE_ENV || "development",
      time: new Date().toISOString(),
    },
    database: {
      connected: true,
      name: db.database,
      serverTime: db.db_time,
      version: db.version.split(" ")[0],
    },
    usersByRole: usersByRole.rows,
    totals: totals.rows[0],
  };
};
