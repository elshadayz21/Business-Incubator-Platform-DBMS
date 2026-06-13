import pool from "../../config/db.js";

/**
 * Fetches recent activity logs for a user, ordered chronologically.
 * @param {number} userId 
 * @param {number} limit 
 */
export const getUserActivityLogs = async (userId, limit = 50) => {
  try {
    const result = await pool.query(
      `SELECT id, action_type, details, created_at
       FROM activity_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  } catch (err) {
    console.error("Error fetching user activity logs:", err);
    throw err;
  }
};

/**
 * Fetches all system analytics metrics.
 */
export const getSystemMetrics = async () => {
  try {
    const result = await pool.query(
      `SELECT metric_key, metric_value, updated_at
       FROM analytics_metrics
       ORDER BY metric_key ASC`
    );
    return result.rows;
  } catch (err) {
    console.error("Error fetching system metrics:", err);
    throw err;
  }
};
