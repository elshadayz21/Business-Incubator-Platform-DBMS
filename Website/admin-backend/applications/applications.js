import pool from "../../config/db.js";
import crypto from "crypto";

const generateInviteToken = () => crypto.randomBytes(32).toString("hex");

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
    console.log("Updating application status:", id, status);
    // Generate the invite token the moment an application is accepted, so
    // the "Send Invites" email always carries a valid, usable signup link.
    const token = status === "Accepted" ? generateInviteToken() : null;
    const result = await pool.query(
        `UPDATE applications SET status = $1, invite_token = COALESCE(invite_token, $2) WHERE id = $3 RETURNING *`,
        [status, token, id]
    );

    const app = result.rows[0];
    if (!app) return null;

    // REMOVED the auto-email logic from here!

    return app;
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