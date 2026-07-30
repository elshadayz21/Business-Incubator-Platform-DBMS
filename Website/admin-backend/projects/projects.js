import pool from "../../config/db.js";

// Get All Projects
export const getAllProjects = async () => {
  const res = await pool.query(`
    SELECT p.*
    FROM projects p
    ORDER BY p.created_at DESC
  `);
  return res.rows;
};

// Get One Project by ID
export const getProjectById = async (id) => {
  const res = await pool.query("SELECT * FROM projects WHERE id = $1", [id]);
  return res.rows[0];
};

// Update Project Status
export const updateProjectStatus = async (id, status) => {
  const res = await pool.query(
    "UPDATE projects SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
    [status, id],
  );
  return res.rows[0];
};

// Get Projects by Status
export const getProjectsByStatus = async (status) => {
  const res = await pool.query(
    "SELECT * FROM projects WHERE status = $1 ORDER BY created_at DESC",
    [status],
  );
  return res.rows;
};

// Toggle Project Approved Status
export const toggleProjectApproved = async (id) => {
  const res = await pool.query(
    `
    UPDATE projects
    SET approved = NOT approved,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *;
    `,
    [id],
  );

  return res.rows[0];
};

// Get Projects Statistics
export const getProjectsStats = async () => {
  const res = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'idea') as idea,
      COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'approved') as approved,
      COUNT(*) FILTER (WHERE status = 'rejected') as rejected
    FROM projects
  `);
  return res.rows[0];
};

