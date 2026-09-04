import cron from "node-cron";
import pool from "../config/db.js";
import { sendEmail } from "./mailer.js";

// How long an applicant can go quiet before we nudge them. Configurable via
// env so ops can tune it without a code change; defaults to a day.
const REMINDER_DELAY_HOURS = parseInt(process.env.APPLICATION_REMINDER_DELAY_HOURS || "24", 10);

const buildReminderEmail = (draft) => {
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const resumeLink = `${baseUrl}/apply/${draft.slug || draft.announcement_id}?resume=${draft.resume_token}`;
    const name = draft.full_name ? draft.full_name.split(" ")[0] : "there";

    return {
        subject: `You're partway through your application to "${draft.title}"`,
        html: `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 24px;">
        <p>Hi ${name},</p>
        <p>You started an application to <strong>${draft.title}</strong> but haven't finished it yet. Your answers are saved — pick up right where you left off:</p>
        <p style="text-align:center; margin: 28px 0;">
          <a href="${resumeLink}" style="display: inline-block; background-color: #E38524; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Continue my application</a>
        </p>
        ${draft.deadline ? `<p style="font-size: 13px; color: #666;">Applications close on ${new Date(draft.deadline).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}.</p>` : ""}
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">© ${new Date().getFullYear()} DxValley Incubation Center. Cooperative Bank of Oromia.</p>
      </div>
    `,
    };
};

// Finds drafts that have sat untouched past the reminder delay, are still
// eligible (open call, not past deadline, not yet submitted), and haven't
// already been reminded — then emails each one exactly once.
export const sendApplicationReminders = async () => {
    try {
        const staleRes = await pool.query(
            `SELECT d.id, d.announcement_id, d.email, d.full_name, d.resume_token,
                    a.title, a.slug, a.deadline
             FROM application_drafts d
             JOIN announcements a ON a.id = d.announcement_id
             WHERE d.status = 'in_progress'
               AND d.reminder_count = 0
               AND d.updated_at < NOW() - INTERVAL '1 hour' * $1
               AND a.is_open_call = true
               AND (a.deadline IS NULL OR a.deadline > NOW())`,
            [REMINDER_DELAY_HOURS]
        );

        if (staleRes.rows.length === 0) return [];

        const remindedIds = [];
        for (const draft of staleRes.rows) {
            const { subject, html } = buildReminderEmail(draft);
            const sent = await sendEmail({ to: draft.email, subject, html });
            if (sent) {
                await pool.query(
                    `UPDATE application_drafts SET reminder_sent_at = NOW(), reminder_count = reminder_count + 1 WHERE id = $1`,
                    [draft.id]
                );
                remindedIds.push(draft.id);
            }
        }

        if (remindedIds.length > 0) {
            console.log(`📧 Sent ${remindedIds.length} application reminder email(s).`);
        }
        return remindedIds;
    } catch (error) {
        console.error("Error sending application reminders:", error);
        return [];
    }
};

export const scheduleApplicationReminderJob = () => {
    // Hourly is plenty granular relative to a delay measured in hours, and
    // matches the cadence already used for the workshop-status job.
    cron.schedule("0 * * * *", async () => {
        console.log("\n[Hourly] Checking for abandoned applications...");
        await sendApplicationReminders();
    });
    console.log(`Application reminder job scheduled: hourly, ${REMINDER_DELAY_HOURS}h inactivity threshold`);
};
