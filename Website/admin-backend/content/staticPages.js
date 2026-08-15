import pool from "../../config/db.js";

export const getAllStaticPages = async () => {
  const result = await pool.query(`SELECT * FROM static_pages ORDER BY title ASC`);
  return result.rows;
};

export const getStaticPageById = async (id) => {
  const result = await pool.query(`SELECT * FROM static_pages WHERE id = $1`, [id]);
  return result.rows[0];
};

export const getStaticPageBySlug = async (slug) => {
  const result = await pool.query(`SELECT * FROM static_pages WHERE slug = $1`, [slug]);
  return result.rows[0];
};

export const createStaticPage = async ({ slug, title, body }) => {
  const result = await pool.query(
    `INSERT INTO static_pages(slug, title, body) VALUES ($1, $2, $3) RETURNING *`,
    [slug, title, body]
  );
  return result.rows[0];
};

export const updateStaticPage = async (id, { slug, title, body }) => {
  const result = await pool.query(
    `UPDATE static_pages SET slug=$1, title=$2, body=$3, updated_at=now() WHERE id=$4 RETURNING *`,
    [slug, title, body, id]
  );
  return result.rows[0];
};

export const deleteStaticPage = async (id) => {
  await pool.query(`DELETE FROM static_pages WHERE id = $1`, [id]);
  return { success: true };
};