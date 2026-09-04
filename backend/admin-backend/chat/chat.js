import pool from "../../config/db.js";
import { createNotification } from "../../utils/notificationHelper.js";
import { sendChatMessageEmail } from "../../utils/mailer.js";

// Who a given user is allowed to chat with:
//   - admin / superadmin can message anyone
//   - anyone can message admin
//   - mentor <-> entrepreneur can message if they share a project or cohort
//   - mentor <-> mentor can always message each other
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
           -- Check if they share a project
           SELECT 1 FROM project_entrepreneurs pe1
           JOIN project_entrepreneurs pe2 ON pe1.project_id = pe2.project_id
           WHERE pe1.user_id = $3 AND pe2.user_id = $1
         )
         OR EXISTS (
           -- Check cohort mentor assignments via mentors table
           SELECT 1 FROM mentor_assignments ma
           JOIN mentors m ON m.id = ma.mentor_id
           WHERE (m.user_id = $3 AND ma.entrepreneur_id = $1)
              OR (ma.entrepreneur_id = $3 AND m.user_id = $1)
         )
       )
     ) AS eligible`,
      [otherUserId, currentUserRole, currentUserId],
  );

  return rows[0]?.eligible === true;
};

// The contact/thread list shown on the left of the chat tab.
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
           -- Share a project
           SELECT 1 FROM project_entrepreneurs pe1
           JOIN project_entrepreneurs pe2 ON pe1.project_id = pe2.project_id
           WHERE pe1.user_id = $1 AND pe2.user_id = u.id
         )
         OR EXISTS (
           -- Share a cohort
           SELECT 1 FROM mentor_assignments ma
           JOIN mentors m ON m.id = ma.mentor_id
           WHERE (m.user_id = $1 AND ma.entrepreneur_id = u.id)
              OR (ma.entrepreneur_id = $1 AND m.user_id = u.id)
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

// Full message history with one contact.
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

  // Email the receiver too, like LinkedIn does, so they know to log in and
  // reply even if they aren't currently on the site. To avoid spamming
  // someone's inbox during a fast back-and-forth, we only email them when
  // this is the start of a fresh batch of unread messages from this sender
  // (i.e. they don't already have other unread messages from the same
  // sender sitting in their inbox that would already have triggered one).
  try {
    const { rows: unreadRows } = await pool.query(
        `SELECT EXISTS (
         SELECT 1 FROM messages
         WHERE sender_id = $1 AND receiver_id = $2 AND read_at IS NULL AND id != $3
       ) AS already_unread`,
        [senderId, receiverId, message.id],
    );
    const alreadyNotified = unreadRows[0]?.already_unread === true;

    if (!alreadyNotified) {
      const receiverRes = await pool.query(
          `SELECT name, email, role FROM users WHERE id = $1`,
          [receiverId],
      );
      const receiver = receiverRes.rows[0];

      if (receiver?.email) {
        await sendChatMessageEmail(receiver.email, {
          recipientName: receiver.name,
          senderName,
          senderId,
          preview,
          recipientRole: receiver.role,
        });
      }
    }
  } catch (emailErr) {
    // Never let an email failure break message sending.
    console.error("❌ Error sending chat notification email:", emailErr);
  }

  return message;
};

// Total unread messages across all conversations.
export const getUnreadMessageCount = async (userId) => {
  const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM messages WHERE receiver_id = $1 AND read_at IS NULL`,
      [userId],
  );
  return rows[0]?.cnt || 0;
};