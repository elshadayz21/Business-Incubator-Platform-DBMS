import pool from "../../config/db.js";
import crypto from "crypto";
import eventBus from "../../utils/eventBus.js";

const generateInviteToken = () => crypto.randomBytes(32).toString("hex");

// ATTACH DOCUMENTS TO AN APPLICATION (bulk insert)
// Mirrors addAnnouncementDocuments — an applicant can submit any number of
// files with their application (resume, pitch deck, ID, ...), each stored
// as its own row rather than a single column.
export const addApplicationDocuments = async (applicationId, files) => {
    if (!files || files.length === 0) return [];
    const inserted = [];
    for (const file of files) {
        const result = await pool.query(
            `INSERT INTO application_documents (application_id, url, filename)
       VALUES ($1, $2, $3)
       RETURNING id, url, filename, created_at`,
            [applicationId, file.url, file.filename || null]
        );
        inserted.push(result.rows[0]);
    }
    return inserted;
};

// GET DOCUMENTS FOR AN APPLICATION
export const getApplicationDocuments = async (applicationId) => {
    const result = await pool.query(
        "SELECT id, url, filename, created_at FROM application_documents WHERE application_id = $1 ORDER BY id",
        [applicationId]
    );
    return result.rows;
};

// The set of normalized `applications` columns a question can be linked to.
// A field with maps_to = null is a plain custom question — its answer only
// ever lives in applications.answers (jsonb), keyed by the field id.
export const MAPPABLE_FIELDS = ["full_name", "email", "phone", "startup_idea", "background"];

// The set of actual input widgets the form builder supports. Kept small and
// generic on purpose — "what this question means" is handled by maps_to
// (see above), not by inventing a new field_type per concept.
export const FIELD_WIDGET_TYPES = ["text", "email", "tel", "number", "date", "textarea", "select", "radio", "checkbox"];

// How much of the row a question takes on the public apply form. 'auto'
// (the default) lets the form pick a sensible width from field_type;
// 'half'/'full' let an admin override that for a specific question (e.g. a
// short-text field with a long label or a select with long option text).
export const FIELD_WIDTHS = ["auto", "half", "full"];

// Ensure form_fields table exists with correct schema
let formFieldsTableReady = false;
const ensureFormFieldsTable = async () => {
    if (formFieldsTableReady) return;
    try {
        const colCheck = await pool.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'form_fields'
        `);
        const existingCols = colCheck.rows.map(r => r.column_name);

        if (existingCols.length > 0 && !existingCols.includes('announcement_id')) {
            console.log("form_fields table has wrong schema, recreating...");
            await pool.query('DROP TABLE IF EXISTS form_fields CASCADE');
        }

        await pool.query(`
            CREATE TABLE IF NOT EXISTS form_fields (
                id SERIAL PRIMARY KEY,
                announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
                label TEXT NOT NULL,
                field_type TEXT NOT NULL DEFAULT 'text',
                options JSONB,
                required BOOLEAN DEFAULT false,
                maps_to VARCHAR(30),
                width VARCHAR(10) NOT NULL DEFAULT 'auto',
                section VARCHAR(100) NOT NULL DEFAULT 'General Information',
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        // Backfill maps_to/width/section for tables that already existed pre-migration-026/027/030.
        await pool.query(`ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS maps_to VARCHAR(30)`);
        await pool.query(`ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS width VARCHAR(10) NOT NULL DEFAULT 'auto'`);
        await pool.query(`ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS section VARCHAR(100) NOT NULL DEFAULT 'General Information'`);
        formFieldsTableReady = true;
        console.log("form_fields table is ready");
    } catch (err) {
        console.error("Failed to ensure form_fields table:", err.message);
        throw err;
    }
};

// GET ALL APPLICATIONS (with Announcement Title)
// `announcementId` optionally filters to a single batch/form. Every row is also
// enriched with its announcement's `form_fields` so the UI can resolve an
// applicant's real name / email / phone / idea from the JSONB `answers` even
// when the form's fields weren't mapped to the normalized columns.
export const getAllApplications = async (limit = 10, offset = 0, announcementId = null) => {
    const params = [];
    let whereClause = "";

    if (announcementId) {
        params.push(parseInt(announcementId, 10));
        whereClause = `WHERE a.announcement_id = $${params.length}`;
    }

    const rowsResult = await pool.query(`
    SELECT a.*, an.title as announcement_title,
           COALESCE(
             (SELECT json_agg(json_build_object('id', d.id, 'url', d.url, 'filename', d.filename) ORDER BY d.id)
              FROM application_documents d WHERE d.application_id = a.id),
             '[]'
           ) AS documents
    FROM applications a
    LEFT JOIN announcements an ON a.announcement_id = an.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `, [...params, limit, offset]);

    const rows = rowsResult.rows;
    if (rows.length === 0) return rows;

    // Resolve the form field labels + mappings for every announcement involved,
    // so callers can render meaningful column values straight from `answers`.
    const annIds = [...new Set(rows.map((r) => r.announcement_id))];
    const fieldsResult = await pool.query(
        `SELECT announcement_id, id, label, maps_to, field_type
         FROM form_fields
         WHERE announcement_id = ANY($1)
         ORDER BY announcement_id, id`,
        [annIds]
    );
    const fieldsByAnn = {};
    for (const f of fieldsResult.rows) {
        if (!fieldsByAnn[f.announcement_id]) fieldsByAnn[f.announcement_id] = [];
        fieldsByAnn[f.announcement_id].push(f);
    }

    return rows.map((row) => ({
        ...row,
        form_fields: fieldsByAnn[row.announcement_id] || [],
    }));
};

// UPDATE APPLICATION STATUS (Accept/Reject)
export const updateApplicationStatus = async (id, status) => {
    console.log("Updating application status:", id, status);
    const numericId = parseInt(id, 10);
    const token = status === "Accepted" ? crypto.randomUUID() : null;

    const result = await pool.query(
        `UPDATE applications SET status = $1, invite_token = COALESCE(invite_token, $2) WHERE id = $3 RETURNING *`,
        [status, token, numericId]
    );

    const app = result.rows[0];
    if (!app) return null;

    eventBus.emit("application.status_changed", {
        application: app,
        status,
    });

    return app;
};

// GET CUSTOM FORM FIELDS FOR AN ANNOUNCEMENT
export const getFormFields = async (announcementId) => {
    await ensureFormFieldsTable();
    const result = await pool.query(
        "SELECT * FROM form_fields WHERE announcement_id = $1 ORDER BY created_at ASC",
        [announcementId]
    );
    return result.rows;
};

// Any question the admin linked to a normalized column (full name, email,
// phone, startup idea, background) gets copied out of the dynamic answers
// object into that column, via form_fields.maps_to. Shared by both the
// final submission (/apply) and the in-progress draft save (/apply/draft)
// so the two never drift out of sync.
export const extractMappedValues = async (announcementId, answers = {}) => {
    await ensureFormFieldsTable();
    const fieldsRes = await pool.query(
        "SELECT id, maps_to FROM form_fields WHERE announcement_id = $1 AND maps_to IS NOT NULL",
        [announcementId]
    );

    const mapped = { full_name: null, email: null, phone: null, background: null, startup_idea: null };
    for (const field of fieldsRes.rows) {
        const userAnswer = answers[`custom_${field.id}`];
        if (userAnswer && MAPPABLE_FIELDS.includes(field.maps_to)) {
            mapped[field.maps_to] = userAnswer;
        }
    }
    return mapped;
};

// SAVE CUSTOM FORM FIELDS FOR AN ANNOUNCEMENT
export const saveFormFields = async (announcementId, fields) => {
    await ensureFormFieldsTable();

    if (!Array.isArray(fields)) {
        throw new Error("Invalid fields data: expected an array");
    }

    // A given database column (full name, email, ...) should only be filled
    // by one question on the form — otherwise later fields would silently
    // overwrite earlier ones on submit.
    const seenMappings = new Set();

    const rowsToInsert = [];
    for (const field of fields) {
        if (!field.label || !field.label.trim()) continue;

        const fieldType = FIELD_WIDGET_TYPES.includes(field.field_type) ? field.field_type : "text";

        let mapsTo = field.maps_to || null;
        if (mapsTo && !MAPPABLE_FIELDS.includes(mapsTo)) mapsTo = null;
        if (mapsTo) {
            if (seenMappings.has(mapsTo)) {
                throw new Error(`Only one question can be linked to "${mapsTo}" — remove the duplicate link.`);
            }
            seenMappings.add(mapsTo);
        }

        let optionsJson = null;
        if (field.options && typeof field.options === 'string') {
            const parsed = field.options.split(',').map(o => o.trim()).filter(Boolean);
            optionsJson = parsed.length > 0 ? JSON.stringify(parsed) : null;
        } else if (Array.isArray(field.options)) {
            optionsJson = JSON.stringify(field.options);
        }

        const width = FIELD_WIDTHS.includes(field.width) ? field.width : "auto";

        // Which step of the apply form this question appears on. An admin
        // leaving this blank shouldn't split the form into a "General
        // Information" step plus their own steps, so a blank section falls
        // back to whatever the previous question's section was (and to the
        // default only for the very first question) — that way a form
        // nobody bothered to section stays a single page, exactly like
        // before this feature existed.
        let section = typeof field.section === "string" ? field.section.trim() : "";
        if (!section) {
            section = rowsToInsert.length > 0 ? rowsToInsert[rowsToInsert.length - 1][7] : "General Information";
        }
        section = section.slice(0, 100);

        rowsToInsert.push([announcementId, field.label.trim(), fieldType, optionsJson, field.required || false, mapsTo, width, section]);
    }

    // Replace old fields with the new set. Delete + insert only happens once
    // everything above has validated cleanly, so a bad save never wipes out
    // a working form.
    await pool.query("DELETE FROM form_fields WHERE announcement_id = $1", [announcementId]);
    for (const row of rowsToInsert) {
        await pool.query(
            `INSERT INTO form_fields (announcement_id, label, field_type, options, required, maps_to, width, section) 
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8)`,
            row
        );
    }
    return { success: true, message: "Form fields saved successfully" };
};


import { sendInvitationEmail } from "../../utils/mailer.js"; // Make sure this is at the very top of the file!

// SEND INVITES TO ALL ACCEPTED APPLICANTS
export const sendMassInvites = async (subject, body) => {
    const result = await pool.query(
        "SELECT * FROM applications WHERE status = 'Accepted' AND invite_used = false AND invite_sent = false AND invite_token IS NOT NULL"
    );

    const acceptedApps = result.rows;
    if (acceptedApps.length === 0) {
        return { success: false, message: "No new accepted applicants to email." };
    }

    let emailsSent = 0;
    let errors = 0;

    for (const app of acceptedApps) {
        // Pass subject and body to the mailer!
        const emailSent = await sendInvitationEmail(app.email, app.invite_token, subject, body);
        if (emailSent) {
            await pool.query("UPDATE applications SET invite_sent = true WHERE id = $1", [app.id]);
            emailsSent++;
        } else {
            errors++;
        }
    }

    return {
        success: true,
        message: `Sent ${emailsSent} invitation email(s). ${errors} failed.`
    };
};