import pool from "../../config/db.js";
import { createNotification } from "../../utils/notificationHelper.js";

// Who a given user is allowed to chat with:
//   - admin / superadmin can message anyone on the platform (top-down reach,
//     e.g. to step in on a mentor/entrepreneur conversation if needed)
//   - anyone can message admin (general support line)
//   - superadmin is NOT a general support contact: entrepreneurs and mentors
//     reach the platform through admin and escalate from there. Only an
//     admin/superadmin can message a superadmin directly.
//   - mentor <-> entrepreneur can message each other only if they are linked
//     via mentor_assignments (i.e. the mentor is actually assigned to them)
//   - mentor <-> mentor can always message each other: mentors are staff
//     coordinating on shared entrepreneurs/cohorts/workshops, not peers who
//     need an explicit link the way mentor<->entrepreneur does
const isEligibleContact = async (currentUserId, currentUserRole, otherUserId) => {
  if (Number(currentUserId) === Number(otherUserId)) return false;

  const { rows } = await pool.query(
    `SELECT EXISTS (
       SELECT 1 FROM users u
       WHERE u.id = $1
       AND (
         $2 IN ('admin', 'superadmin')
         OR u.role = 'admin'
         OR ($2 = 'mentor' AND u.role = 'mentor')
         OR EXISTS (
           SELECT 1 FROM mentor_assignments ma
           WHERE (ma.mentor_id = $3 AND ma.entrepreneur_id = $1)
              OR (ma.entrepreneur_id = $3 AND ma.mentor_id = $1)
         )
       )
     ) AS eligible`,
    [otherUserId, currentUserRole, currentUserId],
  );

  return rows[0]?.eligible === true;
};

// The contact/thread list shown on the left of the chat tab, Telegram-style:
// every person this user can talk to, with their most recent message preview
// and unread count, most-recently-active conversations first.
export const getChatContacts = async (userId, userRole) => {
  const { rows } = await pool.query(
    `WITH eligible_users AS (
       SELECT u.id, u.name, u.role, u.profile_image
       FROM users u
       WHERE u.id != $1
       AND (
         $2 IN ('admin', 'superadmin')
         OR u.role = 'admin'
         OR ($2 = 'mentor' AND u.role = 'mentor')
         OR EXISTS (
           SELECT 1 FROM mentor_assignments ma
           WHERE (ma.mentor_id = $1 AND ma.entrepreneur_id = u.id)
              OR (ma.entrepreneur_id = $1 AND ma.mentor_id = u.id)
         )
       )
     )
     SELECT
       eu.id,
       eu.name,
       eu.role,
       eu.profile_image,
       lm.content AS last_message,
       lm.created_at AS last_message_at,
       lm.sender_id AS last_message_sender_id,
       COALESCE(unread.cnt, 0) AS unread_count
     FROM eligible_users eu
     LEFT JOIN LATERAL (
       SELECT content, created_at, sender_id
       FROM messages
       WHERE (sender_id = $1 AND receiver_id = eu.id)
          OR (sender_id = eu.id AND receiver_id = $1)
       ORDER BY created_at DESC
       LIMIT 1
     ) lm ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS cnt
       FROM messages
       WHERE sender_id = eu.id AND receiver_id = $1 AND read_at IS NULL
     ) unread ON true
     ORDER BY lm.created_at DESC NULLS LAST, eu.name ASC`,
    [userId, userRole],
  );

  return rows;
};

// Full message history with one contact, oldest first (like opening a
// Telegram thread). Marks any messages that contact sent to us as read.
export const getConversation = async (userId, userRole, otherUserId) => {
  const eligible = await isEligibleContact(userId, userRole, otherUserId);
  if (!eligible) return null;

  const { rows } = await pool.query(
    `SELECT id, sender_id, receiver_id, content, read_at, created_at
     FROM messages
     WHERE (sender_id = $1 AND receiver_id = $2)
        OR (sender_id = $2 AND receiver_id = $1)
     ORDER BY created_at ASC`,
    [userId, otherUserId],
  );

  await pool.query(
    `UPDATE messages
     SET read_at = NOW()
     WHERE sender_id = $2 AND receiver_id = $1 AND read_at IS NULL`,
    [userId, otherUserId],
  );

  return rows;
};

// Send a message; rejects if the two users aren't allowed to chat.
export const sendChatMessage = async (senderId, senderRole, receiverId, content) => {
  const trimmed = (content || "").trim();
  if (!trimmed) {
    const err = new Error("Message content is required.");
    err.statusCode = 400;
    throw err;
  }
  if (trimmed.length > 4000) {
    const err = new Error("Message is too long.");
    err.statusCode = 400;
    throw err;
  }

  const eligible = await isEligibleContact(senderId, senderRole, receiverId);
  if (!eligible) {
    const err = new Error("You are not able to message this user.");
    err.statusCode = 403;
    throw err;
  }

  const { rows } = await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, sender_id, receiver_id, content, read_at, created_at`,
    [senderId, receiverId, trimmed],
  );

  const message = rows[0];

  const senderRes = await pool.query(`SELECT name FROM users WHERE id = $1`, [senderId]);
  const senderName = senderRes.rows[0]?.name || "Someone";
  const preview = trimmed.length > 80 ? `${trimmed.slice(0, 80)}...` : trimmed;
  await createNotification(
    receiverId,
    "chat",
    `New message from ${senderName}: ${preview}`,
    { senderId },
  );

  return message;
};

// Total unread messages across all conversations, for a sidebar badge.
export const getUnreadMessageCount = async (userId) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS cnt FROM messages WHERE receiver_id = $1 AND read_at IS NULL`,
    [userId],
  );
  return rows[0]?.cnt || 0;
};
