import pool from "../../config/db.js";
import { sendEmail, sendInvitationEmail } from "../../utils/mailer.js";
import crypto from "crypto";

// Recipient source definitions (keys are persisted in email_campaigns)
const RECIPIENT_SOURCES = [
    {
        key: "accepted_applicants",
        label: "Accepted Applicants",
        description: "Entrepreneurs accepted into the program",
    },
    {
        key: "declined_applicants",
        label: "Declined Applicants",
        description: "Applicants who were not accepted",
    },
    {
        key: "subscribers",
        label: "Newsletter Subscribers",
        description: "Emails collected via the newsletter signup",
    },
    {
        key: "contacts",
        label: "Contact Submissions",
        description: "People who used the contact form",
    },
];

const SOURCE_COUNT_QUERIES = {
    accepted_applicants:
        "SELECT COUNT(*)::int AS n FROM applications WHERE status = 'Accepted'",
    declined_applicants:
        "SELECT COUNT(*)::int AS n FROM applications WHERE status = 'Rejected'",
    subscribers:
        "SELECT COUNT(*)::int AS n FROM public_submissions WHERE type = 'newsletter' AND email IS NOT NULL",
    contacts:
        "SELECT COUNT(*)::int AS n FROM public_submissions WHERE type = 'contact' AND email IS NOT NULL",
};

// Applicant sources can be narrowed to a single announcement (batch / open call);
// the optional filter is appended as a numbered parameter at query time.
const BATCH_FILTERABLE_SOURCES = new Set(["accepted_applicants", "declined_applicants"]);

const applyBatchFilter = (sql, source, params, announcementId) => {
    if (BATCH_FILTERABLE_SOURCES.has(source) && announcementId) {
        params.push(Number(announcementId));
        return `${sql} AND announcement_id = $${params.length}`;
    }
    return sql;
};

const SOURCE_RECIPIENT_QUERIES = {
    // id/invite_token selected so invite handling targets one exact application
    // even if the same email applied to multiple batches
    accepted_applicants:
        "SELECT id, email, full_name, invite_token FROM applications WHERE status = 'Accepted' AND email IS NOT NULL",
    declined_applicants:
        "SELECT id, email, full_name FROM applications WHERE status = 'Rejected' AND email IS NOT NULL",
    subscribers:
        "SELECT email, name FROM public_submissions WHERE type = 'newsletter' AND email IS NOT NULL",
    contacts:
        "SELECT email, name FROM public_submissions WHERE type = 'contact' AND email IS NOT NULL",
};

// Renders {{first_name}}, {{name}} and {{email}} placeholders per recipient
const renderPersonalized = (template, recipient) => {
    const rawName = recipient.full_name || recipient.name || "";
    const first_name = rawName.trim().split(/\s+/)[0] || "there";
    const name = rawName.trim() || first_name;
    return template
        .replace(/\{\{\s*first_name\s*\}\}/g, first_name)
        .replace(/\{\{\s*name\s*\}\}/g, name)
        .replace(/\{\{\s*email\s*\}\}/g, recipient.email);
};

export const getEmailSources = async (announcementId) => {
    const sources = [];
    for (const def of RECIPIENT_SOURCES) {
        const params = [];
        const sql = applyBatchFilter(SOURCE_COUNT_QUERIES[def.key], def.key, params, announcementId);
        const { rows } = await pool.query(sql, params);
        sources.push({ ...def, count: rows[0]?.n ?? 0 });
    }
    return sources;
};

// Individual entries for ANY source so admins can hand-pick who receives a
// campaign — e.g. late applicants who applied after the first acceptance wave,
// or different replies to different subscribers at different times.
export const getEmailRecipients = async (source, announcementId) => {
    if (!SOURCE_RECIPIENT_QUERIES[source]) {
        return [];
    }

    if (source === "subscribers" || source === "contacts") {
        const type = source === "subscribers" ? "newsletter" : "contact";
        const { rows } = await pool.query(
            `SELECT id, name, email, message, created_at
             FROM public_submissions
             WHERE type = $1 AND email IS NOT NULL
             ORDER BY created_at DESC`,
            [type],
        );
        return rows;
    }

    // Applicant sources: list individual applications (newest first so late
    // arrivals are easy to spot), optionally narrowed to one batch
    const status = source === "accepted_applicants" ? "Accepted" : "Rejected";
    const params = [status];
    let sql = `
        SELECT id, full_name AS name, email, status, created_at
        FROM applications
        WHERE status = $1 AND email IS NOT NULL`;
    if (announcementId) {
        params.push(Number(announcementId));
        sql += ` AND announcement_id = $${params.length}`;
    }
    sql += " ORDER BY created_at DESC";

    const { rows } = await pool.query(sql, params);
    return rows;
};

export const getEmailTemplates = async () => {
    const { rows } = await pool.query(
        "SELECT * FROM email_templates ORDER BY updated_at DESC",
    );
    return rows;
};

export const createEmailTemplate = async ({ name, subject, body }) => {
    const { rows } = await pool.query(
        `INSERT INTO email_templates (name, subject, body)
         VALUES ($1, $2, $3) RETURNING *`,
        [name, subject, body],
    );
    return rows[0];
};

export const updateEmailTemplate = async (id, { name, subject, body }) => {
    const { rows } = await pool.query(
        `UPDATE email_templates
         SET name = $1, subject = $2, body = $3, updated_at = NOW()
         WHERE id = $4 RETURNING *`,
        [name, subject, body, id],
    );
    return rows[0];
};

export const deleteEmailTemplate = async (id) => {
    await pool.query("DELETE FROM email_templates WHERE id = $1", [id]);
    return { success: true };
};

export const getEmailCampaigns = async () => {
    const { rows } = await pool.query(`
        SELECT c.*, u.name AS created_by_name, a.title AS announcement_title
        FROM email_campaigns c
        LEFT JOIN users u ON u.id = c.created_by
        LEFT JOIN announcements a ON a.id = c.announcement_id
        ORDER BY c.created_at DESC
    `);
    return rows;
};

export const sendEmailCampaign = async ({
    name,
    subject,
    body,
    source,
    announcementId,
    recipientIds,
    userId,
}) => {
    if (!subject || !body) {
        return { error: "Subject and body are required." };
    }
    if (!SOURCE_RECIPIENT_QUERIES[source]) {
        return { error: "Unknown recipient source." };
    }

    let batch = null;
    if (announcementId) {
        const { rows: batchRows } = await pool.query(
            "SELECT id, title FROM announcements WHERE id = $1",
            [Number(announcementId)],
        );
        if (batchRows.length === 0) {
            return { error: "Selected batch (announcement) not found." };
        }
        batch = batchRows[0];
    }

    // Hand-picked recipients: send to exactly these entries instead of
    // everyone in the source (works per application or per inbox entry).
    let recipients;
    const pickedIds = Array.isArray(recipientIds)
        ? [...new Set(recipientIds.map(Number).filter(Number.isInteger))]
        : null;

    if (pickedIds && pickedIds.length > 0) {
        if (source === "subscribers" || source === "contacts") {
            const type = source === "subscribers" ? "newsletter" : "contact";
            const { rows: picked } = await pool.query(
                `SELECT id, email, name FROM public_submissions
                 WHERE type = $1 AND email IS NOT NULL AND id = ANY($2::int[])`,
                [type, pickedIds],
            );
            if (picked.length === 0) {
                return { error: "None of the selected recipients exist anymore." };
            }
            recipients = picked;
        } else {
            // Applications are matched by exact id + this source's status, so a
            // status change between picking and sending can never mis-target.
            const status = source === "accepted_applicants" ? "Accepted" : "Rejected";
            const { rows: picked } = await pool.query(
                `SELECT id, email, full_name, invite_token FROM applications
                 WHERE status = $1 AND email IS NOT NULL AND id = ANY($2::int[])`,
                [status, pickedIds],
            );
            if (picked.length === 0) {
                return {
                    error:
                        "None of the selected applicants exist anymore (or their status changed since you picked them).",
                };
            }
            recipients = picked;
        }
    } else {
        const params = [];
        const recipientSql = applyBatchFilter(
            SOURCE_RECIPIENT_QUERIES[source],
            source,
            params,
            batch?.id,
        );
        const { rows } = await pool.query(recipientSql, params);
        recipients = rows;
    }

    if (recipients.length === 0) {
        return {
            error: batch
                ? `No recipients found for this source in "${batch.title}".`
                : "No recipients found for this source.",
        };
    }

    const smtpConfigured = Boolean(
        process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
    );

    const isInvitation = source === "accepted_applicants";

    let sentCount = 0;
    if (smtpConfigured) {
        for (const recipient of recipients) {
            let ok = false;
            if (isInvitation) {
                // For invitation emails, reuse or generate the invite token for
                // this exact application (matched by id, not email)
                let token = recipient.invite_token;
                if (!token) {
                    token = crypto.randomBytes(32).toString("hex");
                    await pool.query(
                        "UPDATE applications SET invite_token = $1 WHERE id = $2",
                        [token, recipient.id]
                    );
                }
                // Always append {link} if not present for accepted applicants
                let emailBody = renderPersonalized(body, recipient);
                if (!emailBody.includes("{link}")) {
                    emailBody = emailBody + "\n\n{link}";
                }
                ok = await sendInvitationEmail(
                    recipient.email,
                    token,
                    renderPersonalized(subject, recipient),
                    emailBody
                );
                if (ok) {
                    await pool.query(
                        "UPDATE applications SET invite_sent = true WHERE id = $1 AND invite_sent = false",
                        [recipient.id]
                    );
                }
            } else {
                ok = await sendEmail({
                    to: recipient.email,
                    subject: renderPersonalized(subject, recipient),
                    html: renderPersonalized(body, recipient),
                });
            }
            if (ok) sentCount++;
        }
    } else {
        sentCount = recipients.length;
        console.log(
            `[MassEmail SIMULATED] ${sentCount} emails to '${source}': "${subject}"`,
        );
    }

    const { rows } = await pool.query(
        `INSERT INTO email_campaigns
            (name, subject, body, recipient_source, announcement_id, recipient_count, sent_count, status, created_by, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent', $8, NOW())
         RETURNING *`,
        [name, subject, body, source, batch?.id ?? null, recipients.length, sentCount, userId],
    );

    return {
        sentCount,
        totalRecipients: recipients.length,
        simulated: !smtpConfigured,
        campaign: rows[0],
    };
};
