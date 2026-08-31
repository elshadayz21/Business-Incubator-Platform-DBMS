// ============================================================================
// email.js — Mass Email service (UR-B4)
// ----------------------------------------------------------------------------
// Backend for the admin "Mass Email" module:
//  - Recipient sources: accepted applicants, declined applicants, newsletter
//    subscribers and contact-form submissions (pulled from public_submissions,
//    the UR-B10 inbox cross-link).
//  - Email template CRUD (email_templates) with {{first_name}}/{{name}}/{{email}}
//    placeholder rendering.
//  - Bulk campaign sending via mailer.js, batched with rate limiting and full
//    audit logging in email_campaigns (status, sent counts, errors, sender).
// ============================================================================
import pool from "../../config/db.js";
import { sendEmail, isConfigured } from "./mailer.js";

// ---- Recipient source definitions (UR-B4 <-> UR-B10 cross-link) ----
const RECIPIENT_SOURCES = [
  {
    key: "accepted_applicants",
    label: "Accepted applicants",
    description: "Projects that have been approved in the incubation pipeline.",
  },
  {
    key: "declined_applicants",
    label: "Declined applicants",
    description: "Projects that were marked as rejected.",
  },
  {
    key: "subscribers",
    label: "All newsletter subscribers",
    description: "Emails captured via the public Subscribe form (UR-B10).",
  },
  {
    key: "contacts",
    label: "Contact form submissions",
    description: "People who contacted DxValley via the public Contact form (UR-B10).",
  },
];

const TITLES = new Set(["eng", "engr", "dr", "mr", "mrs", "ms", "miss", "prof", "prof."]);

const firstName = (name) => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1 && TITLES.has(parts[0].toLowerCase().replace(".", ""))) {
    return parts[1];
  }
  return parts[0];
};

const projectRecipientsQuery = (whereSql) => `
  SELECT DISTINCT u.email, u.name
  FROM projects p
  JOIN project_entrepreneurs pe ON pe.project_id = p.id
  JOIN users u ON u.id = pe.user_id
  WHERE ${whereSql}
    AND u.email IS NOT NULL
    AND u.email <> ''
  ORDER BY u.name NULLS LAST`;

const resolveRecipientsForSource = async (source) => {
  if (source === "accepted_applicants") {
    const res = await pool.query(projectRecipientsQuery("p.approved = TRUE"));
    return res.rows;
  }

  if (source === "declined_applicants") {
    const res = await pool.query(
      projectRecipientsQuery("LOWER(p.status) = 'rejected'"),
    );
    return res.rows;
  }

  if (source === "subscribers") {
    const res = await pool.query(
      `SELECT DISTINCT email, name
       FROM public_submissions
       WHERE type = 'newsletter' AND email IS NOT NULL AND email <> ''
       ORDER BY email`,
    );
    return res.rows;
  }

  if (source === "contacts") {
    const res = await pool.query(
      `SELECT DISTINCT email, name
       FROM public_submissions
       WHERE type = 'contact' AND email IS NOT NULL AND email <> ''
       ORDER BY email`,
    );
    return res.rows;
  }

  return [];
};

export const getRecipientSources = async () => {
  const withCounts = await Promise.all(
    RECIPIENT_SOURCES.map(async (s) => {
      let count = 0;
      try {
        count = (await resolveRecipientsForSource(s.key)).length;
      } catch (err) {
        console.error(`Error counting recipients for ${s.key}:`, err);
      }
      return { ...s, count };
    }),
  );
  return withCounts;
};

export const getRecipientsForSource = async (source) => {
  const recipients = await resolveRecipientsForSource(source);
  return recipients.map((r) => ({
    email: r.email,
    name: r.name || "",
    first_name: firstName(r.name),
  }));
};

// ---- Template rendering ----
const renderTemplate = (body, vars = {}) =>
  String(body).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) =>
    vars[key] !== undefined && vars[key] !== null ? vars[key] : "",
  );

// ---- Email templates CRUD ----
export const getEmailTemplates = async () => {
  const res = await pool.query(
    "SELECT * FROM email_templates ORDER BY created_at DESC",
  );
  return res.rows;
};

export const createEmailTemplate = async ({ name, subject, body }) => {
  if (!name || !subject || !body) {
    throw new Error("Name, subject and body are required.");
  }
  const res = await pool.query(
    `INSERT INTO email_templates (name, subject, body)
     VALUES ($1, $2, $3) RETURNING *`,
    [name.trim(), subject.trim(), body],
  );
  return res.rows[0];
};

export const updateEmailTemplate = async (id, { name, subject, body }) => {
  const res = await pool.query(
    `UPDATE email_templates
     SET name = $1, subject = $2, body = $3, updated_at = CURRENT_TIMESTAMP
     WHERE id = $4 RETURNING *`,
    [name?.trim(), subject?.trim(), body, id],
  );
  if (res.rows.length === 0) throw new Error("Email template not found.");
  return res.rows[0];
};

export const deleteEmailTemplate = async (id) => {
  await pool.query("DELETE FROM email_templates WHERE id = $1", [id]);
  return { success: true, message: "Email template deleted successfully" };
};

// ---- Campaigns ----
export const getEmailCampaigns = async () => {
  const res = await pool.query(
    `SELECT c.*, u.name AS created_by_name
     FROM email_campaigns c
     LEFT JOIN users u ON u.id = c.created_by
     ORDER BY c.created_at DESC`,
  );
  return res.rows;
};

// Send a bulk campaign. Batches with a short delay between each send rather
// than blocking a single request with thousands of sequential SMTP calls.
const BATCH_SIZE = 25;
const BATCH_DELAY_MS = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const sendCampaign = async ({
  name,
  subject,
  body,
  source,
  templateId,
  senderId,
}) => {
  if (!subject || !body) throw new Error("Subject and body are required.");
  if (!source) throw new Error("A recipient source is required.");

  const recipients = await resolveRecipientsForSource(source);

  const campaignRes = await pool.query(
    `INSERT INTO email_campaigns
       (name, subject, body, recipient_source, recipient_count, status, created_by)
     VALUES ($1, $2, $3, $4, $5, 'sending', $6)
     RETURNING *`,
    [name || null, subject, body, source, recipients.length, senderId || null],
  );
  const campaign = campaignRes.rows[0];

  let sentCount = 0;
  let lastError = null;

  try {
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      for (const recipient of batch) {
        try {
          const vars = {
            name: recipient.name || "",
            first_name: firstName(recipient.name) || recipient.email,
            email: recipient.email,
            source,
          };
          await sendEmail({
            to: recipient.email,
            subject: renderTemplate(subject, vars),
            html: renderTemplate(body, vars).replace(/\n/g, "<br/>"),
            text: renderTemplate(body, vars),
          });
          sentCount += 1;
        } catch (err) {
          lastError = `${err.message} (${recipient.email})`;
          console.error(`Email failed for ${recipient.email}:`, err);
        }
      }
      if (i + BATCH_SIZE < recipients.length) await sleep(BATCH_DELAY_MS);
    }

    await pool.query(
      `UPDATE email_campaigns
       SET status = 'sent', sent_count = $1, sent_at = CURRENT_TIMESTAMP, error = $2
       WHERE id = $3`,
      [sentCount, lastError, campaign.id],
    );
  } catch (err) {
    await pool.query(
      `UPDATE email_campaigns
       SET status = 'failed', sent_count = $1, error = $2
       WHERE id = $3`,
      [sentCount, err.message, campaign.id],
    );
    throw err;
  }

  const finalRes = await pool.query(
    "SELECT * FROM email_campaigns WHERE id = $1",
    [campaign.id],
  );

  return {
    campaign: finalRes.rows[0],
    totalRecipients: recipients.length,
    sentCount,
    simulated: !isConfigured(),
    templateId: templateId || null,
  };
};
