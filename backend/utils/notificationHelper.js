import pool from "../config/db.js";
import { sendGenericNotificationEmail } from "./mailer.js";

// Which notification types are important/actionable enough to also email the
// recipient about (decisions they're waiting on, invitations, offers), and
// which portal tab the "Log in to view" button should land them on. Chat is
// deliberately excluded here — it has its own emailing path in chat.js with
// unread-based throttling, since messages fire far more often than these
// one-off events. Lower-stakes/admin-facing types (e.g. funding_response,
// mentor_invitation_response — both just FYIs for staff who are already in
// the portal daily) are left as in-app-only notifications.
const EMAIL_NOTIFICATION_CONFIG = {
    project_status: { subject: "Update on your project", tab: "Dashboard" },
    project_approved: { subject: "Your project has been approved! 🎉", tab: "Dashboard" },
    project_rejected: { subject: "Update on your project submission", tab: "Dashboard" },
    mentor_assignment: { subject: "A mentor update on your project", tab: "My Mentor" },
    mentor_accepted: { subject: "Your mentor has accepted!", tab: "My Mentor" },
    mentor_invitation: { subject: "You've been invited to mentor a project", tab: "My Mentees" },
    funding_approval: { subject: "You have a new funding offer", tab: "Funding" },
    mentor_session_reply: { subject: "New reply on a mentorship session", tab: "My Mentees" },
    mentor_session_response: { subject: "Your mentor replied to your session", tab: "My Mentor" },
    progress_submission: { subject: "New work submitted for review", tab: "Progress" },
    progress_review: { subject: "Your submission was reviewed", tab: "Progress" },
};

/**
 * Creates a notification for a specific user.
 * @param {number} userId - The ID of the user receiving the notification.
 * @param {string} type - The type of notification (e.g., 'project_approval').
 * @param {string} message - The text message to display.
 * @param {object} metadata - Extra data (e.g., { projectId: 1 }).
 * @param {string} actionUrl - Optional URL for the user to click.
 */
export const createNotification = async (userId, type, message, metadata = {}, actionUrl = null) => {
    try {
        const metaToSave = metadata && Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null;

        try {
            await pool.query(
                `INSERT INTO notifications (user_id, type, message, metadata, action_url, read) 
                 VALUES ($1, $2, $3, $4, $5, false)`,
                [userId, type, message, metaToSave, actionUrl]
            );
        } catch (colErr) {
            // Fallback for when metadata / action_url columns don't exist
            await pool.query(
                `INSERT INTO notifications (user_id, type, type_message, message, read) 
                 VALUES ($1, $2, $3, $3, false)`,
                [userId, type, message]
            ).catch(async () => {
                await pool.query(
                    `INSERT INTO notifications (user_id, type, message, read) 
                     VALUES ($1, $2, $3, false)`,
                    [userId, type, message]
                );
            });
        }
        console.log(`✅ Notification created for user ${userId}: ${type}`);

        // Fire off an email for the notification types that warrant one.
        // Never let this affect the notification itself — it's already
        // saved by this point either way.
        const emailConfig = EMAIL_NOTIFICATION_CONFIG[type];
        if (emailConfig) {
            try {
                const { rows } = await pool.query(`SELECT name, email, role FROM users WHERE id = $1`, [userId]);
                const user = rows[0];
                if (user?.email) {
                    await sendGenericNotificationEmail(user.email, {
                        recipientName: user.name,
                        recipientRole: user.role,
                        subject: emailConfig.subject,
                        message,
                        tab: emailConfig.tab,
                    });
                }
            } catch (emailErr) {
                console.error("❌ Error sending notification email:", emailErr);
            }
        }
    } catch (error) {
        console.error("❌ Error creating notification:", error);
    }
};
