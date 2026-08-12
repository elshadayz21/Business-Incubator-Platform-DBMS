import pool from "../../config/db.js";

export const getReportSummary = async () => {
  const [cohorts, applicants, mentorLoad, statusBreakdown] = await Promise.all([
    pool.query(`SELECT id, name, status FROM cohorts ORDER BY start_date DESC`),
    pool.query(
      `SELECT cohort_id, COUNT(*) AS count FROM cohort_members GROUP BY cohort_id`,
    ),
    pool.query(
      `SELECT mentor_id, COUNT(*) AS count FROM mentor_assignments GROUP BY mentor_id`,
    ),
    pool.query(`SELECT status, COUNT(*) AS count FROM cohorts GROUP BY status`),
  ]);
  return {
    cohorts: cohorts.rows,
    applicantsByCohort: applicants.rows,
    mentorLoad: mentorLoad.rows,
    statusBreakdown: statusBreakdown.rows,
  };
};

export const getReportRows = async () => {
  const result = await pool.query(`
    SELECT c.name AS cohort, c.type, c.status, u.name AS full_name, u.email, cm.current_stage, cm.joined_at
    FROM cohort_members cm
    JOIN cohorts c ON c.id = cm.cohort_id
    JOIN users u ON u.id = cm.user_id
    ORDER BY c.name, cm.joined_at
  `);
  return result.rows;
};
