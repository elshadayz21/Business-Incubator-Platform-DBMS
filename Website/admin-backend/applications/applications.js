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

// GET CUSTOM FORM FIELDS FOR AN ANNOUNCEMENT
export const getFormFields = async (announcementId) => {
    const result = await pool.query(
        "SELECT * FROM form_fields WHERE announcement_id = $1 ORDER BY created_at ASC",
        [announcementId]
    );
    return result.rows;
};

// SAVE CUSTOM FORM FIELDS FOR AN ANNOUNCEMENT
export const saveFormFields = async (announcementId, fields) => {
    // First, delete old fields so we don't duplicate when updating
    await pool.query("DELETE FROM form_fields WHERE announcement_id = $1", [announcementId]);

    // Then, insert the new fields
    for (const field of fields) {
        await pool.query(
            `INSERT INTO form_fields (announcement_id, label, field_type, options, required) 
       VALUES ($1, $2, $3, $4, $5)`,
            [announcementId, field.label, field.field_type, field.options || null, field.required || false]
        );
    }
    return { success: true, message: "Form fields saved successfully" };
};