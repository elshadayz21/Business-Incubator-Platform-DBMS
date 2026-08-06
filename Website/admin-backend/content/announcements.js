import pool from "../../config/db.js";

export const getAllAnnouncements = async () => {
  const result = await pool.query(
    `SELECT * FROM announcements ORDER BY created_at DESC`,
  );
  return result.rows;
};

export const getAnnouncement = async (id) => {
  const result = await pool.query(`SELECT * FROM announcements WHERE id = $1`, [
    id,
  ]);
  return result.rows[0];
};

export const getPublishedAnnouncements = async (limit = 6) => {
  const result = await pool.query(
    `SELECT id, title, body, cover_image, published_at
     FROM announcements
     WHERE published_at IS NOT NULL AND published_at <= now()
     ORDER BY published_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
};

export const getAnnouncementById = async (id) => {
  const result = await pool.query(`SELECT * FROM announcements WHERE id = $1`, [id]);
  return result.rows[0];
};

export const createAnnouncement = async ({
  title,
  body,
  cover_image,
  published_at,
  author_id,
}) => {
  const result = await pool.query(
    `INSERT INTO announcements(title, body, cover_image, published_at, author_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [title, body, cover_image, published_at, author_id],
  );
  return result.rows[0];
};

export const updateAnnouncement = async (
  id,
  { title, body, cover_image, published_at },
) => {
  const result = await pool.query(
    `UPDATE announcements
     SET title=$1, body=$2, cover_image=$3, published_at=$4, updated_at=now()
     WHERE id=$5 RETURNING *`,
    [title, body, cover_image, published_at, id],
  );
  return result.rows[0];
};

export const deleteAnnouncement = async (id) => {
  await pool.query(`DELETE FROM announcements WHERE id = $1`, [id]);
  return { success: true };
};
