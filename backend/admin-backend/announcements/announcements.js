import pool from "../../config/db.js";
import xss from "xss";

// GET ALL ANNOUNCEMENTS
export const getAllAnnouncements = async () => {
    const result = await pool.query("SELECT * FROM announcements ORDER BY created_at DESC");
    return result.rows;
};

// GET SINGLE ANNOUNCEMENT BY ID
export const getAnnouncementById = async (id) => {
    const result = await pool.query("SELECT * FROM announcements WHERE id = $1", [id]);
    return result.rows[0] || null;
};

// CREATE A NEW ANNOUNCEMENT
export const createAnnouncement = async (data) => {
    const { title, content, deadline, document_url, is_open_call, capacity, is_published, category, applicant_type } = data;
    const result = await pool.query(
        `INSERT INTO announcements (title, content, deadline, document_url, is_open_call, capacity, is_published, category, applicant_type) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
     RETURNING *`,
        [
            title ? xss(title) : null,
            content ? xss(content) : null,
            deadline || null,
            document_url || null,
            is_open_call || false,
            capacity || null,
            is_published !== false,
            category || 'Call for Applications',
            applicant_type || 'both'
        ]
    );
    return result.rows[0];
};

// UPDATE AN ANNOUNCEMENT
export const updateAnnouncement = async (id, data) => {
    const { title, content, deadline, document_url, is_open_call, capacity, category, applicant_type } = data;
    const result = await pool.query(
        `UPDATE announcements 
     SET title = COALESCE($1, title),
         content = COALESCE($2, content),
         deadline = $3,
         document_url = $4,
         is_open_call = $5,
         capacity = $6,
         category = COALESCE($7, category),
         applicant_type = COALESCE($8, applicant_type)
     WHERE id = $9 
     RETURNING *`,
        [
            title ? xss(title) : null,
            content ? xss(content) : null,
            deadline || null,
            document_url || null,
            is_open_call || false,
            capacity || null,
            category || 'Call for Applications',
            applicant_type || 'both',
            id
        ]
    );
    return result.rows[0];
};

// DUPLICATE AN ANNOUNCEMENT
export const duplicateAnnouncement = async (id) => {
    const source = await pool.query("SELECT * FROM announcements WHERE id = $1", [id]);
    if (source.rows.length === 0) return null;

    const original = source.rows[0];
    const result = await pool.query(
        `INSERT INTO announcements (title, content, deadline, document_url, is_open_call, capacity, is_published, category, applicant_type) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
     RETURNING *`,
        [
            `${original.title} (Copy)`,
            original.content,
            original.deadline,
            original.document_url,
            original.is_open_call,
            original.capacity,
            original.is_published,
            original.category || 'Call for Applications',
            original.applicant_type || 'both'
        ]
    );
    return result.rows[0];
};

// GET APPLICATION COUNT FOR AN ANNOUNCEMENT
export const getApplicationCount = async (announcementId) => {
    const result = await pool.query(
        "SELECT COUNT(*)::int as count FROM applications WHERE announcement_id = $1",
        [announcementId]
    );
    return result.rows[0].count;
};

// DELETE AN ANNOUNCEMENT
export const deleteAnnouncement = async (id) => {
    await pool.query("DELETE FROM announcements WHERE id = $1", [id]);
    return { success: true, message: "Announcement deleted successfully" };
};