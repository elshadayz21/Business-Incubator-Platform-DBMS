import pool from "../../config/db.js";

// GET ALL APPLICATIONS (with Announcement Title)
export const getAllApplications = async () => {
    const result = await pool.query(`
    SELECT a.*, an.title as announcement_title 
    FROM applications a
    LEFT JOIN announcements an ON a.announcement_id = an.id
    ORDER BY a.created_at DESC
  `);
    return result.rows;
};

// UPDATE APPLICATION STATUS (Accept/Reject)
export const updateApplicationStatus = async (id, status) => {
    const result = await pool.query(
        "UPDATE applications SET status = $1 WHERE id = $2 RETURNING *",
        [status, id]
    );
    return result.rows[0];
};