import { Router } from "express";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import pool from "../config/db.js";
import { founderRespondToFunding } from "../admin-backend/funding/funding.js";
import { getFormFields, extractMappedValues } from "../admin-backend/applications/applications.js";
import { addApplicationDocuments } from "../admin-backend/applications/applications.js";
const router = Router();

// Multer setup for applicant-submitted documents (resume, pitch deck, ID,
// ...). Mirrors the admin-side announcement-document upload config in
// routes/admin-api.js: same storage folder, same allowed types, same
// per-file size cap, so files from either flow behave consistently.
const applicationDocsStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `applicant-doc-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
    },
});
const uploadApplicationDocs = multer({
    storage: applicationDocsStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
    },
    fileFilter: (req, file, cb) => {
        const allowedExt = /\.(pdf|doc|docx|png|jpg|jpeg)$/i.test(file.originalname);
        const allowedMime = /^(application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|image\/(png|jpe?g))$/.test(file.mimetype);
        const genericMime = file.mimetype === "application/octet-stream";
        if (allowedExt && (allowedMime || genericMime)) return cb(null, true);
        cb(new Error("Invalid file type. Only PDF, DOC, DOCX, PNG, JPG, and JPEG files are allowed."));
    },
});

// Folds the legacy single-document column into the new documents[] array for
// any announcement that predates multi-document support and hasn't been
// touched since (mirrors the same helper in admin-backend/announcements.js).
const attachLegacyDocument = (row) => {
    if (!row) return row;
    if ((!row.documents || row.documents.length === 0) && row.document_url) {
        row.documents = [{ id: null, url: row.document_url, filename: null, slug: null }];
    }
    return row;
};

// POST: Contact Us Form
// POST: Contact Us Form (with sender role)
const ALLOWED_SENDER_ROLES = ["mentor", "investor", "partner", "other"];

router.post("/contact", async (req, res) => {
    try {
        const { name, email, message } = req.body;
        const sender_role = ALLOWED_SENDER_ROLES.includes(req.body.sender_role)
            ? req.body.sender_role
            : "other";

        await pool.query(
            "INSERT INTO public_submissions (type, name, email, message, sender_role) VALUES ('contact', $1, $2, $3, $4)",
            [name, email, message, sender_role]
        );
        res.status(201).json({ success: true, message: "Message sent successfully!" });
    } catch (error) {
        console.error("Contact form error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// POST: Newsletter Subscribe Form
router.post("/subscribe", async (req, res) => {
    try {
        const { email } = req.body;
        await pool.query(
            "INSERT INTO public_submissions (type, email) VALUES ('newsletter', $1)",
            [email]
        );
        res.status(201).json({ success: true, message: "Subscribed successfully!" });
    } catch (error) {
        console.error("Subscribe form error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


// GET ALL ANNOUNCEMENTS (Public)
// Feeds the homepage's "Latest updates" list, hero calls carousel, and
// header Apply button. A plain news item (is_open_call = false) always
// qualifies. An open call only qualifies while it's actually actionable —
// once its deadline has passed or its capacity is full, there's nothing
// left for a visitor to do with it, so it drops out here rather than
// lingering in a "latest" feed with a dead end. Mirrors isActiveOpenCall()
// on the client (header.ejs) so the two never disagree.
router.get("/announcements", async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT a.*, 
             (SELECT COUNT(*) FROM applications app WHERE app.announcement_id = a.id) as application_count,
             COALESCE(
               (SELECT json_agg(json_build_object('id', d.id, 'url', d.url, 'filename', d.filename, 'slug', d.slug) ORDER BY d.id)
                FROM announcement_documents d WHERE d.announcement_id = a.id),
               '[]'
             ) AS documents
      FROM announcements a 
      WHERE a.is_published = true 
        AND (
          a.is_open_call = false
          OR (
            (a.deadline IS NULL OR a.deadline > NOW())
            AND (
              a.capacity IS NULL
              OR (SELECT COUNT(*) FROM applications app WHERE app.announcement_id = a.id) < a.capacity
            )
          )
        )
      ORDER BY a.created_at DESC 
      LIMIT 5
    `);
        res.status(200).json(result.rows.map(attachLegacyDocument));
    } catch (error) {
        console.error("Error fetching announcements:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// GET PUBLISHED GALLERY ITEMS (Public)
router.get("/gallery", async (req, res) => {
    try {
        const { category, q } = req.query;
        // Build parameterized query
        const params = [];
        const whereClauses = ["is_published = true"];

        if (category) {
            params.push(category);
            whereClauses.push(`category = $${params.length}`);
        }

        if (q) {
            // search in title and description, case-insensitive
            params.push(`%${q}%`);
            whereClauses.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`);
        }

        const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

        const sql = `SELECT id, title, description, image_url, video_url, category, display_order, created_at, updated_at
                     FROM gallery_items
                     ${whereSQL}
                     ORDER BY display_order ASC, created_at DESC`;

        const result = await pool.query(sql, params);
        // Return rows directly in the same format as other public routes
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching gallery:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// POST: Application Form
// Accepts multipart/form-data so the applicant can attach any number of
// documents (resume, pitch deck, ID, ...) alongside their answers — up to
// 5 files, 5MB each, same allowed types as the admin-side document upload.
// Non-file fields (announcement_id, full_name, ..., answers) arrive as
// plain strings via multer; `answers` is JSON-encoded by the client and
// parsed back out below.
router.post("/apply", uploadApplicationDocs.array("documents", 5), async (req, res) => {
    try {
        let { announcement_id, full_name, email, phone, background, startup_idea } = req.body;
        let answers = req.body.answers;
        if (typeof answers === "string") {
            try { answers = JSON.parse(answers); } catch (e) { answers = {}; }
        }

        // 1. Check if capacity is reached
        const annRes = await pool.query("SELECT is_open_call, capacity, deadline FROM announcements WHERE id = $1", [announcement_id]);
        if (annRes.rows.length === 0) return res.status(404).json({ message: "Announcement not found." });

        const ann = annRes.rows[0];
        if (!ann.is_open_call) return res.status(403).json({ message: "Applications are not enabled for this post." });
        if (ann.deadline && new Date(ann.deadline) < new Date()) return res.status(403).json({ message: "The application deadline has passed." });

        if (ann.capacity) {
            const countRes = await pool.query("SELECT COUNT(*) FROM applications WHERE announcement_id = $1", [announcement_id]);
            if (parseInt(countRes.rows[0].count) >= ann.capacity) {
                return res.status(403).json({ message: "Maximum application capacity reached. Applications are now closed." });
            }
        }

        // 2. Any question the admin linked to a normalized column (full name,
        //    email, phone, startup idea, background) gets copied out of the
        //    dynamic answers into that column, via form_fields.maps_to.
        const parsedAnswers = answers || {};
        const mapped = await extractMappedValues(announcement_id, parsedAnswers);
        email = mapped.email || email;
        full_name = mapped.full_name || full_name;
        startup_idea = mapped.startup_idea || startup_idea;
        phone = mapped.phone || phone;
        background = mapped.background || background;

        // 3. Save the application
        const insertRes = await pool.query(
            `INSERT INTO applications (announcement_id, full_name, email, phone, background, startup_idea, answers) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
            [announcement_id, full_name || null, email || null, phone || null, background || null, startup_idea || null, JSON.stringify(parsedAnswers)]
        );

        // 3b. Attach any uploaded documents to the application that was just created.
        const uploadedFiles = (req.files || []).map(f => ({
            url: `/uploads/${f.filename}`,
            filename: f.originalname,
        }));
        if (uploadedFiles.length > 0) {
            await addApplicationDocuments(insertRes.rows[0].id, uploadedFiles);
        }

        // 4. The applicant just finished — if they had an in-progress draft
        //    for this same call, close it out so it stops showing up in the
        //    resume flow and the reminder job leaves it alone.
        if (email) {
            await pool.query(
                `UPDATE application_drafts SET status = 'submitted', updated_at = NOW()
                 WHERE announcement_id = $1 AND lower(email) = lower($2) AND status = 'in_progress'`,
                [announcement_id, email]
            );
        }

        res.status(201).json({ success: true, message: "Application submitted successfully!" });
    } catch (error) {
        console.error("Application form error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Convert applicant document upload/validation errors (wrong type, too
// large, more than 5 files) into a JSON response the apply form's fetch()
// can read, instead of letting them fall through to an HTML error page.
router.use("/apply", (err, req, res, next) => {
    if (res.headersSent) return next(err);

    let message = err && err.message ? err.message : "Invalid request";
    if (err && err.name === "MulterError") {
        message = err.code === "LIMIT_FILE_SIZE"
            ? "One of your files exceeds the maximum size of 5MB."
            : err.code === "LIMIT_UNEXPECTED_FILE"
                ? "You can attach up to 5 documents."
                : err.message;
    }
    req.on("error", () => {});
    req.resume();
    res.setHeader("Connection", "close");
    return res.status(400).json({ success: false, message });
});

// POST: Save/Update an in-progress application ("draft"), so the applicant
// can resume later — same device or not — and so the reminder job has
// something to check on. Requires an email so the draft can be tied back
// to the applicant on return; called automatically (debounced) as the
// public apply form autosaves, once an email-mapped question has a value.
router.post("/apply/draft", async (req, res) => {
    try {
        const { announcement_id, email, answers, current_page } = req.body;

        if (!announcement_id || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: "A valid email is required to save progress." });
        }

        const annRes = await pool.query("SELECT is_open_call, deadline FROM announcements WHERE id = $1", [announcement_id]);
        if (annRes.rows.length === 0) return res.status(404).json({ message: "Announcement not found." });

        const ann = annRes.rows[0];
        if (!ann.is_open_call || (ann.deadline && new Date(ann.deadline) < new Date())) {
            // Call has closed since they started — nothing to save toward.
            return res.status(403).json({ success: false, message: "This application is no longer open." });
        }

        const parsedAnswers = answers || {};
        const mapped = await extractMappedValues(announcement_id, parsedAnswers);
        const resumeToken = crypto.randomBytes(24).toString("hex");

        await pool.query(
            `INSERT INTO application_drafts
               (announcement_id, email, resume_token, full_name, phone, background, startup_idea, answers, current_page, status, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'in_progress', NOW())
             ON CONFLICT (announcement_id, email) DO UPDATE SET
               full_name = EXCLUDED.full_name,
               phone = EXCLUDED.phone,
               background = EXCLUDED.background,
               startup_idea = EXCLUDED.startup_idea,
               answers = EXCLUDED.answers,
               current_page = EXCLUDED.current_page,
               updated_at = NOW()
             WHERE application_drafts.status = 'in_progress'`,
            [announcement_id, email, resumeToken, mapped.full_name, mapped.phone, mapped.background, mapped.startup_idea, JSON.stringify(parsedAnswers), current_page || 0]
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Save draft error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// GET: Resolve a resume link (emailed reminder, or a "continue later" link
// the applicant saved themselves) back into the saved draft, so the apply
// page can pre-fill the form and jump straight to where they left off.
router.get("/apply/resume/:token", async (req, res) => {
    try {
        const draftRes = await pool.query(
            `SELECT d.*, a.slug, a.is_open_call, a.deadline
             FROM application_drafts d
             JOIN announcements a ON a.id = d.announcement_id
             WHERE d.resume_token = $1`,
            [req.params.token]
        );

        if (draftRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "This resume link isn't valid." });
        }

        const draft = draftRes.rows[0];
        if (draft.status !== "in_progress") {
            return res.status(410).json({ success: false, message: "This application was already submitted." });
        }
        if (!draft.is_open_call || (draft.deadline && new Date(draft.deadline) < new Date())) {
            return res.status(410).json({ success: false, message: "This application is no longer open." });
        }

        res.status(200).json({
            success: true,
            draft: {
                answers: draft.answers || {},
                current_page: draft.current_page || 0,
            },
        });
    } catch (error) {
        console.error("Resume draft error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


// Entrepreneur Accept/Reject Funding Route
router.put("/funding/:id/respond", async (req, res) => {
    try {
        const { action } = req.body;
        const userId = req.session.userId; // The logged-in entrepreneur

        if (!userId) return res.status(401).json({ message: "Please log in." });
        if (!['Founder Accepted', 'Founder Declined'].includes(action)) {
            return res.status(400).json({ message: "Invalid action." });
        }

        const result = await founderRespondToFunding(req.params.id, userId, action);
        res.json(result);
    } catch (error) {
        console.error("Error responding to funding:", error.message);
        res.status(403).json({ message: error.message });
    }
});


// GET: Active Open Calls (Announcements with a future deadline)
router.get("/open-calls", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, title, content, deadline FROM announcements WHERE deadline IS NOT NULL AND deadline > now() ORDER BY deadline ASC"
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching open calls:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
// GET: Apply Page (Dedicated landing page for an Open Call)
// Looked up by slug ("/apply/summer-2026-founder-cohort"), the readable
// public URL. Falls back to a bare numeric id ("/apply/7") so any old
// links generated before slugs existed still work.
router.get("/apply/:idOrSlug", async (req, res) => {
    try {
        const { idOrSlug } = req.params;
        const asId = /^\d+$/.test(idOrSlug) ? parseInt(idOrSlug, 10) : null;

        // 1. Fetch the specific announcement, with any attached documents
        const result = await pool.query(
            `SELECT a.*,
                    COALESCE(
                      (SELECT json_agg(json_build_object('id', d.id, 'url', d.url, 'filename', d.filename, 'slug', d.slug) ORDER BY d.id)
                       FROM announcement_documents d WHERE d.announcement_id = a.id),
                      '[]'
                    ) AS documents
             FROM announcements a
             WHERE (a.slug = $1 OR a.id = $2) AND a.is_open_call = true`,
            [idOrSlug, asId]
        );

        // 2. If it doesn't exist, or isn't an open call, return 404
        if (result.rows.length === 0) {
            return res.status(404).send("Open call not found.");
        }

        // 3. Render the new apply.ejs page!
        res.render("apply", { announcement: attachLegacyDocument(result.rows[0]) });
    } catch (error) {
        console.error("Error fetching apply page:", error);
        res.status(500).send("Server Error");
    }
});

// GET: Fetch Custom Form Fields for an Announcement
router.get("/form-fields/:announcementId", async (req, res) => {
    try {
        // getFormFields ensures form_fields has every column the app expects
        // (maps_to, width, ...) before querying, so this endpoint keeps
        // working even on a database that hasn't had every migration file
        // run against it yet.
        const fields = await getFormFields(req.params.announcementId);
        const publicFields = fields.map(({ id, label, field_type, options, required, maps_to, width, section }) => (
            { id, label, field_type, options, required, maps_to, width, section }
        ));
        res.status(200).json(publicFields);
    } catch (error) {
        console.error("Error fetching form fields:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});



export { router as publicRoutes };