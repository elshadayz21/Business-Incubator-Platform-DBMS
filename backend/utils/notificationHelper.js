import pool from "../config/db.js";

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
    } catch (error) {
        console.error("❌ Error creating notification:", error);
    }
};
