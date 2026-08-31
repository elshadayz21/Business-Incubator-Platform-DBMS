import pool from "../../config/db.js";
import crypto from "crypto";
import eventBus from "../../utils/eventBus.js";

const generateInviteToken = () => crypto.randomBytes(32).toString("hex");

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
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        formFieldsTableReady = true;
        console.log("form_fields table is ready");
    } catch (err) {
        console.error("Failed to ensure form_fields table:", err.message);
        throw err;
    }
};

// GET ALL APPLICATIONS (with Announcement Title)

export const getAllApplications = async (limit = 10, offset = 0) => {
    const result = await pool.query(`
    SELECT a.*, an.title as announcement_title 
    FROM applications a
    LEFT JOIN announcements an ON a.announcement_id = an.id
    ORDER BY a.created_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);
    return result.rows;
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

// SAVE CUSTOM FORM FIELDS FOR AN ANNOUNCEMENT
export const saveFormFields = async (announcementId, fields) => {
    await ensureFormFieldsTable();

    if (!Array.isArray(fields)) {
        throw new Error("Invalid fields data: expected an array");
    }

    // First, delete old fields so we don't duplicate when updating
    await pool.query("DELETE FROM form_fields WHERE announcement_id = $1", [announcementId]);

    // Then, insert the new fields
    for (const field of fields) {
        if (!field.label || !field.label.trim()) continue;
        let optionsJson = null;
        if (field.options && typeof field.options === 'string') {
            const parsed = field.options.split(',').map(o => o.trim()).filter(Boolean);
            optionsJson = parsed.length > 0 ? JSON.stringify(parsed) : null;
        } else if (Array.isArray(field.options)) {
            optionsJson = JSON.stringify(field.options);
        }
        await pool.query(
            `INSERT INTO form_fields (announcement_id, label, field_type, options, required) 
       VALUES ($1, $2, $3, $4::jsonb, $5)`,
            [announcementId, field.label.trim(), field.field_type, optionsJson, field.required || false]
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