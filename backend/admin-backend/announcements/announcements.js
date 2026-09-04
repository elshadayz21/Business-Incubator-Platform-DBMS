import pool from "../../config/db.js";
import xss from "xss";

// Turns a title into a URL-safe slug, e.g. "Summer 2026 Cohort!" -> "summer-2026-cohort"
const slugify = (text) =>
    String(text || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 140) || "announcement";

// Generates a slug for a new announcement and guarantees it's unique by
// appending -2, -3, etc. if needed. The slug is only ever set at creation
// time (see createAnnouncement/duplicateAnnouncement) — updateAnnouncement
// deliberately leaves it untouched so previously shared links never break.
const generateUniqueSlug = async (title) => {
    const base = slugify(title);
    let candidate = base;
    let suffix = 2;

    while (true) {
        const existing = await pool.query("SELECT 1 FROM announcements WHERE slug = $1", [candidate]);
        if (existing.rows.length === 0) return candidate;
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }
};

// An announcement can have any number of attached documents, held in the
// announcement_documents child table. Older rows that only ever had the
// single legacy document_url column (from before multi-document support)
// are folded in here too, so nothing already published loses its
// attachment just because it hasn't been touched since. There's no row
// (and therefore no slug) for that legacy fallback, so its document page
// link falls back to the raw url wherever it's rendered.
const attachLegacyDocument = (row) => {
    if (!row) return row;
    if ((!row.documents || row.documents.length === 0) && row.document_url) {
        row.documents = [{ id: null, url: row.document_url, filename: null, slug: null }];
    }
    return row;
};

// Turns a document's filename (or, failing that, its url) into a URL-safe
// slug, e.g. "Business Plan.pdf" -> "business-plan-pdf". Mirrors slugify()
// above for announcements themselves.
const slugifyFilename = (filename, url) =>
    String(filename || (url || "").replace(/^.*\//, "") || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 200) || "document";

// Generates a slug for a newly attached document and guarantees it's
// unique the same way generateUniqueSlug does for announcements above —
// appending -2, -3, etc. if the base slug is already taken. This is what
// makes a document's own page ( /documents/<slug> ) readable and stable.
const generateUniqueDocumentSlug = async (filename, url) => {
    const base = slugifyFilename(filename, url);
    let candidate = base;
    let suffix = 2;

    while (true) {
        const existing = await pool.query("SELECT 1 FROM announcement_documents WHERE slug = $1", [candidate]);
        if (existing.rows.length === 0) return candidate;
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }
};

// GET DOCUMENTS FOR AN ANNOUNCEMENT
export const getAnnouncementDocuments = async (announcementId) => {
    const result = await pool.query(
        "SELECT id, url, filename, slug, created_at FROM announcement_documents WHERE announcement_id = $1 ORDER BY id",
        [announcementId]
    );
    return result.rows;
};

// ATTACH DOCUMENTS TO AN ANNOUNCEMENT (bulk insert)
// Each document gets its own unique slug derived from its filename, so it
// can be linked to (and viewed) at a descriptive URL of its own.
export const addAnnouncementDocuments = async (announcementId, files) => {
    if (!files || files.length === 0) return [];
    const inserted = [];
    for (const file of files) {
        const slug = await generateUniqueDocumentSlug(file.filename, file.url);
        const result = await pool.query(
            `INSERT INTO announcement_documents (announcement_id, url, filename, slug)
       VALUES ($1, $2, $3, $4)
       RETURNING id, url, filename, slug, created_at`,
            [announcementId, file.url, file.filename || null, slug]
        );
        inserted.push(result.rows[0]);
    }
    return inserted;
};

// REMOVE A SINGLE DOCUMENT FROM AN ANNOUNCEMENT
// Scoped to the announcement it's supposed to belong to, so one
// announcement's edit form can never delete another's document.
export const deleteAnnouncementDocument = async (announcementId, documentId) => {
    await pool.query(
        "DELETE FROM announcement_documents WHERE id = $1 AND announcement_id = $2",
        [documentId, announcementId]
    );
    return { success: true };
};

// GET ALL ANNOUNCEMENTS
export const getAllAnnouncements = async () => {
    const result = await pool.query(`
    SELECT a.*,
           COALESCE(
             (SELECT json_agg(json_build_object('id', d.id, 'url', d.url, 'filename', d.filename, 'slug', d.slug) ORDER BY d.id)
              FROM announcement_documents d WHERE d.announcement_id = a.id),
             '[]'
           ) AS documents
    FROM announcements a
    ORDER BY a.created_at DESC
  `);
    return result.rows.map(attachLegacyDocument);
};

// GET SINGLE ANNOUNCEMENT BY ID
export const getAnnouncementById = async (id) => {
    const result = await pool.query(
        `
    SELECT a.*,
           COALESCE(
             (SELECT json_agg(json_build_object('id', d.id, 'url', d.url, 'filename', d.filename, 'slug', d.slug) ORDER BY d.id)
              FROM announcement_documents d WHERE d.announcement_id = a.id),
             '[]'
           ) AS documents
    FROM announcements a
    WHERE a.id = $1
  `,
        [id]
    );
    return attachLegacyDocument(result.rows[0]) || null;
};

// CREATE A NEW ANNOUNCEMENT
// Documents are attached separately (see addAnnouncementDocuments) once the
// announcement row exists, since they reference its id.
export const createAnnouncement = async (data) => {
    const { title, content, deadline, is_open_call, capacity, is_published, category, applicant_type } = data;
    const slug = await generateUniqueSlug(title);
    const result = await pool.query(
        `INSERT INTO announcements (title, content, deadline, is_open_call, capacity, is_published, category, applicant_type, slug) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
     RETURNING *`,
        [
            title ? xss(title) : null,
            content ? xss(content) : null,
            deadline || null,
            is_open_call || false,
            capacity || null,
            is_published !== false,
            category || 'Call for Applications',
            applicant_type || 'both',
            slug
        ]
    );
    return { ...result.rows[0], documents: [] };
};

// UPDATE AN ANNOUNCEMENT
// Document attachments are managed separately via addAnnouncementDocuments /
// deleteAnnouncementDocument — this only touches the announcement's own fields.
export const updateAnnouncement = async (id, data) => {
    const { title, content, deadline, is_open_call, capacity, category, applicant_type } = data;
    const result = await pool.query(
        `UPDATE announcements 
     SET title = COALESCE($1, title),
         content = COALESCE($2, content),
         deadline = $3,
         is_open_call = $4,
         capacity = $5,
         category = COALESCE($6, category),
         applicant_type = COALESCE($7, applicant_type)
     WHERE id = $8 
     RETURNING *`,
        [
            title ? xss(title) : null,
            content ? xss(content) : null,
            deadline || null,
            is_open_call || false,
            capacity || null,
            category || 'Call for Applications',
            applicant_type || 'both',
            id
        ]
    );
    if (!result.rows[0]) return null;
    return getAnnouncementById(id);
};

// DUPLICATE AN ANNOUNCEMENT
// Copies every attached document over too, so the duplicate isn't missing
// the materials the original had.
export const duplicateAnnouncement = async (id) => {
    const source = await pool.query("SELECT * FROM announcements WHERE id = $1", [id]);
    if (source.rows.length === 0) return null;

    const original = source.rows[0];
    const copyTitle = `${original.title} (Copy)`;
    const slug = await generateUniqueSlug(copyTitle);
    const result = await pool.query(
        `INSERT INTO announcements (title, content, deadline, is_open_call, capacity, is_published, category, applicant_type, slug) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
     RETURNING *`,
        [
            copyTitle,
            original.content,
            original.deadline,
            original.is_open_call,
            original.capacity,
            original.is_published,
            original.category || 'Call for Applications',
            original.applicant_type || 'both',
            slug
        ]
    );
    const duplicated = result.rows[0];

    const documents = await getAnnouncementDocuments(id);
    if (documents.length > 0) {
        await addAnnouncementDocuments(duplicated.id, documents.map(d => ({ url: d.url, filename: d.filename })));
    }

    return getAnnouncementById(duplicated.id);
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
