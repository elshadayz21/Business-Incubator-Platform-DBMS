import pool from "../../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Resolve the upload directory (public/uploads/gallery) relative to this file
const uploadDir = path.resolve(__dirname, "../../public/uploads/gallery");

const toBoolean = (value) =>
  value === true || value === "true" || value === "1" ? true : false;

const toInt = (value) =>
  value === "" || value === undefined || value === null
    ? 0
    : parseInt(value, 10);

// Validate that an imageUrl is an internal uploads/gallery path with a safe filename
const isValidImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return false;
  // should be like '/uploads/gallery/filename.ext' (no .., no protocol)
  // allow filenames with letters, numbers, dash, underscore, dot
  const normalized = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  const regex = /^\/uploads\/gallery\/[A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp)$/i;
  return regex.test(normalized);
};

// Helper to safely delete files only within the upload directory
const safeUnlink = (imageUrl) => {
  try {
    if (!imageUrl) return;

    // Expect imageUrl like '/uploads/gallery/filename.ext' or 'uploads/gallery/filename.ext'
    const trimmed = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl;

    const candidate = path.resolve(__dirname, "../../public", trimmed);

    // Prevent path traversal: ensure candidate path is inside uploadDir
    if (!candidate.startsWith(uploadDir)) {
      // Do not delete files outside the uploads folder
      return;
    }

    if (fs.existsSync(candidate)) {
      fs.unlinkSync(candidate);
    }
  } catch (err) {
    // Log but do not throw; deletion failure shouldn't block DB operations
    console.error("Failed to delete gallery image:", err);
  }
}

// GET ALL GALLERY ITEMS with optional filtering, search and pagination
export const getAllGalleryItems = async (options = {}) => {
  const {
    q,
    category,
    status, // 'published' | 'draft' | 'all'
    page = 1,
    pageSize = 20,
    sortBy = 'display_order',
    sortDir = 'asc',
  } = options;

  const params = [];
  const where = [];

  // status filter
  if (status === 'published') {
    where.push('is_published = true');
  } else if (status === 'draft') {
    where.push('is_published = false');
  }

  if (category && category !== 'all') {
    params.push(category);
    where.push(`category = $${params.length}`);
  }

  if (q) {
    params.push(`%${q}%`);
    where.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`);
  }

  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const allowedSortCols = new Set(['display_order', 'created_at', 'title']);
  const sortCol = allowedSortCols.has(sortBy) ? sortBy : 'display_order';
  const dir = sortDir && sortDir.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  // Pagination
  const limit = Number(pageSize) > 0 ? Number(pageSize) : 20;
  const offset = (Math.max(Number(page), 1) - 1) * limit;

  // Total count
  const countSQL = `SELECT COUNT(*) as total FROM gallery_items ${whereSQL}`;
  const countRes = await pool.query(countSQL, params);
  const total = parseInt(countRes.rows[0].total, 10) || 0;

  // Main query
  const mainSQL = `SELECT id, title, description, image_url, category, display_order, is_published, created_at, updated_at
    FROM gallery_items
    ${whereSQL}
    ORDER BY ${sortCol} ${dir}, created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  const mainParams = params.concat([limit, offset]);
  const result = await pool.query(mainSQL, mainParams);

  return { rows: result.rows, total };
};

// GET A SINGLE GALLERY ITEM
export const getGalleryItem = async (id) => {
  const result = await pool.query(
    "SELECT * FROM gallery_items WHERE id = $1",
    [id],
  );
  if (result.rows.length === 0) throw new Error("Gallery item not found.");
  return result.rows[0];
};

// Get distinct categories
export const getGalleryCategories = async () => {
  const result = await pool.query("SELECT DISTINCT category FROM gallery_items WHERE category IS NOT NULL ORDER BY category ASC");
  return result.rows.map((r) => r.category);
};

// CREATE A NEW GALLERY ITEM
export const createGalleryItem = async (data) => {
  const {
    title,
    description = null,
    imageUrl,
    category = "General",
    isPublished = false,
    displayOrder = 0,
  } = data;

  if (!title || !imageUrl) {
    throw new Error("Title and image are required.");
  }

  // Ensure provided imageUrl is an internal uploads/gallery path
  if (!isValidImageUrl(imageUrl)) {
    throw new Error("Invalid image URL. Only server-uploaded images are allowed.");
  }

  const result = await pool.query(
    `INSERT INTO gallery_items (title, description, image_url, category, is_published, display_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      title,
      description,
      imageUrl,
      category,
      toBoolean(isPublished),
      toInt(displayOrder),
    ],
  );
  return result.rows[0];
};

// UPDATE A GALLERY ITEM
export const updateGalleryItem = async (id, data) => {
  const existing = await getGalleryItem(id);

  const title = data.title ?? existing.title;
  const description = data.description !== undefined ? data.description : existing.description;
  const imageUrl = data.imageUrl ?? existing.image_url;
  const category = data.category ?? existing.category;
  const isPublished = data.isPublished !== undefined ? data.isPublished : existing.is_published;
  const displayOrder = data.displayOrder !== undefined ? data.displayOrder : existing.display_order;

  // If image is being replaced, delete the old file from disk if no other records reference it
  if (data.imageUrl && existing.image_url && data.imageUrl !== existing.image_url) {
    try {
      const refRes = await pool.query(
        "SELECT COUNT(*)::int AS cnt FROM gallery_items WHERE image_url = $1 AND id != $2",
        [existing.image_url, id],
      );
      const refs = parseInt(refRes.rows[0].cnt, 10) || 0;
      if (refs === 0) {
        safeUnlink(existing.image_url);
      } else {
        console.log(`Not deleting replaced file ${existing.image_url} because it is referenced by ${refs} other records.`);
      }
    } catch (err) {
      console.error('Error checking image references before replacing image:', err);
      // best-effort: attempt safeUnlink but do not block update
      safeUnlink(existing.image_url);
    }
  }

  // If updating imageUrl, ensure it's an internal uploads/gallery path
  if (data.imageUrl && !isValidImageUrl(data.imageUrl)) {
    throw new Error('Invalid image URL. Only server-uploaded images are allowed.');
  }

  const result = await pool.query(
    `UPDATE gallery_items
     SET title = $1,
         description = $2,
         image_url = $3,
         category = $4,
         is_published = $5,
         display_order = $6,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $7
     RETURNING *`,
    [title, description, imageUrl, category, toBoolean(isPublished), toInt(displayOrder), id],
  );
  if (result.rows.length === 0) throw new Error("Gallery item not found.");
  return result.rows[0];
};

// TOGGLE PUBLISHED STATUS
export const setGalleryItemPublished = async (id, isPublished) => {
  const result = await pool.query(
    `UPDATE gallery_items
     SET is_published = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [toBoolean(isPublished), id],
  );
  if (result.rows.length === 0) throw new Error("Gallery item not found.");
  return result.rows[0];
};

// DELETE A GALLERY ITEM
export const deleteGalleryItem = async (id) => {
  // Remove associated image from disk if present and not referenced by other records
  const existing = await getGalleryItem(id);
  if (existing && existing.image_url) {
    try {
      const refRes = await pool.query(
        "SELECT COUNT(*)::int AS cnt FROM gallery_items WHERE image_url = $1 AND id != $2",
        [existing.image_url, id],
      );
      const refs = parseInt(refRes.rows[0].cnt, 10) || 0;
      if (refs === 0) {
        // safe to delete the file because no other record references it
        safeUnlink(existing.image_url);
      } else {
        // Do not delete the file when other gallery items reference it
        console.log(`Not deleting file ${existing.image_url} because it is referenced by ${refs} other records.`);
      }
    } catch (err) {
      console.error('Error checking image references before delete:', err);
      // best-effort: attempt safeUnlink but do not block deletion
      safeUnlink(existing.image_url);
    }
  }

  await pool.query("DELETE FROM gallery_items WHERE id = $1", [id]);
  return { success: true, message: "Gallery item deleted successfully" };
};
