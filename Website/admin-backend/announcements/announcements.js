import pool from "../../config/db.js";

// GET ALL ANNOUNCEMENTS
export const getAllAnnouncements = async () => {
    const result = await pool.query("SELECT * FROM announcements ORDER BY created_at DESC");
    return result.rows;
};

// CREATE A NEW ANNOUNCEMENT
export const createAnnouncement = async (data) => {
    const { title, content } = data;
    const result = await pool.query(
        `INSERT INTO announcements (title, content) 
     VALUES ($1, $2) 
     RETURNING *`,
        [title, content]
    );
    return result.rows[0];
};

// DELETE AN ANNOUNCEMENT
export const deleteAnnouncement = async (id) => {
    await pool.query("DELETE FROM announcements WHERE id = $1", [id]);
    return { success: true, message: "Announcement deleted successfully" };
};