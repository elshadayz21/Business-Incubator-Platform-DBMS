import pool from "../../config/db.js";
import { sendEmail } from "../../utils/mailer.js";

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

const SOURCE_RECIPIENT_QUERIES = {
    accepted_applicants:
        "SELECT email, full_name FROM applications WHERE status = 'Accepted' AND email IS NOT NULL",
    declined_applicants:
        "SELECT email, full_name FROM applications WHERE status = 'Rejected' AND email IS NOT NULL",
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

export const getEmailSources = async () => {
    const sources = [];
    for (const def of RECIPIENT_SOURCES) {
        const { rows } = await pool.query(SOURCE_COUNT_QUERIES[def.key]);
        sources.push({ ...def, count: rows[0]?.n ?? 0 });
    }
    return sources;
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
        SELECT c.*, u.name AS created_by_name
        FROM email_campaigns c
        LEFT JOIN users u ON u.id = c.created_by
        ORDER BY c.created_at DESC
    `);
    return rows;
};

export const sendEmailCampaign = async ({ name, subject, body, source, userId }) => {
    if (!subject || !body) {
        return { error: "Subject and body are required." };
    }
    if (!SOURCE_RECIPIENT_QUERIES[source]) {
        return { error: "Unknown recipient source." };
    }

    const { rows: recipients } = await pool.query(SOURCE_RECIPIENT_QUERIES[source]);
    if (recipients.length === 0) {
        return { error: "No recipients found for this source." };
    }

    const smtpConfigured = Boolean(
        process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
    );

    let sentCount = 0;
    if (smtpConfigured) {
        for (const recipient of recipients) {
            const ok = await sendEmail({
                to: recipient.email,
                subject: renderPersonalized(subject, recipient),
                html: renderPersonalized(body, recipient),
            });
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
            (name, subject, body, recipient_source, recipient_count, sent_count, status, created_by, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'sent', $7, NOW())
         RETURNING *`,
        [name, subject, body, source, recipients.length, sentCount, userId],
    );

    return {
        sentCount,
        totalRecipients: recipients.length,
        simulated: !smtpConfigured,
        campaign: rows[0],
    };
};
