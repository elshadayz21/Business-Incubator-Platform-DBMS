import { Router } from "express";
import { authorizeRole } from "../middleware/check_roles.middleware.js";
import { isAuth } from "../middleware/auth.middlware.js";
import { ROLES } from "../utils/constants.js";
import {
  getEntrepreneurDashboard,
  getMentorDashboard,
  getMentorAssignmentSessions,
  createMentorSession,
  deleteMentorSession,
  replyToMentorSession,
  mentorReplyToEntrepreneurSession,
  markNotificationsAsRead,
  respondToMentorInvitation,
} from "../admin-backend/portal/portal.js";
import {
  getChatContacts,
  getConversation,
  sendChatMessage,
  getUnreadMessageCount,
} from "../admin-backend/chat/chat.js";

const router = Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error("[Portal API] Error:", err);
    if (req.originalUrl.startsWith("/api/")) {
      const statusCode = err.statusCode || err.status || 400;
      const errorMessage = err.message || "Internal server error";
      return res.status(statusCode).json({ error: errorMessage });
    }
    next(err);
  });
};

router.get(
  "/me",
  isAuth,
  asyncHandler(async (req, res) => {
    res.json({
      user: {
        id: req.session.userId,
        name: req.session.userName,
        email: req.session.userEmail,
        role: req.session.userRole,
      },
    });
  }),
);

router.get(
  "/entrepreneur/dashboard",
  isAuth,
  authorizeRole(ROLES.ENTREPRENEUR, ROLES.SUPERADMIN, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const dashboard = await getEntrepreneurDashboard(
      req.session.userId,
      req.session.userEmail,
    );
    res.json(dashboard);
  }),
);

router.post(
  "/entrepreneur/sessions/:id/reply",
  isAuth,
  authorizeRole(ROLES.ENTREPRENEUR, ROLES.SUPERADMIN, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const result = await replyToMentorSession(
      req.session.userId,
      req.params.id,
      req.body.reply,
    );
    res.json({ success: true, session: result });
  }),
);

router.post(
  "/notifications/read",
  isAuth,
  authorizeRole(ROLES.ENTREPRENEUR, ROLES.MENTOR, ROLES.SUPERADMIN, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    await markNotificationsAsRead(req.session.userId);
    res.json({ success: true });
  }),
);

router.get(
  "/mentor/dashboard",
  isAuth,
  authorizeRole(ROLES.MENTOR, ROLES.SUPERADMIN, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const dashboard = await getMentorDashboard(req.session.userId);
    res.json(dashboard);
  }),
);

router.post(
  "/mentor/invitations/:id/respond",
  isAuth,
  authorizeRole(ROLES.MENTOR, ROLES.SUPERADMIN, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    try {
      const result = await respondToMentorInvitation(
        req.session.userId,
        req.params.id,
        req.body.action,
        req.body.reason,
      );
      res.json(result);
    } catch (err) {
      // Business errors (already responded, not found, etc.) as JSON 400 so the
      // portal UI can display them instead of failing to parse an HTML error page.
      res.status(400).json({ success: false, error: err.message });
    }
  }),
);

router.get(
  "/mentor/sessions/:assignmentId",
  isAuth,
  authorizeRole(ROLES.MENTOR, ROLES.SUPERADMIN, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const sessions = await getMentorAssignmentSessions(
      req.session.userId,
      req.params.assignmentId,
    );
    if (!sessions) return res.status(403).json({ error: "Access denied" });
    res.json(sessions);
  }),
);

router.post(
  "/mentor/sessions",
  isAuth,
  authorizeRole(ROLES.MENTOR),
  asyncHandler(async (req, res) => {
    const session = await createMentorSession(req.session.userId, req.body);
    if (!session) return res.status(403).json({ error: "Access denied" });
    res.status(201).json(session);
  }),
);

router.post(
  "/mentor/sessions/:id/response",
  isAuth,
  authorizeRole(ROLES.MENTOR, ROLES.SUPERADMIN, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const result = await mentorReplyToEntrepreneurSession(
      req.session.userId,
      req.params.id,
      req.body.response,
    );
    res.json({ success: true, session: result });
  }),
);

router.delete(
  "/mentor/sessions/:id",
  isAuth,
  authorizeRole(ROLES.MENTOR),
  asyncHandler(async (req, res) => {
    const result = await deleteMentorSession(req.session.userId, req.params.id);
    if (!result) return res.status(403).json({ error: "Access denied" });
    res.json(result);
  }),
);

// -------- Chat (available to every authenticated role) --------

// Contact/thread list: everyone this user can message, with last message
// preview and unread count, most recently active first.
router.get(
  "/chat/contacts",
  isAuth,
  asyncHandler(async (req, res) => {
    const contacts = await getChatContacts(req.session.userId, req.session.userRole);
    res.json({ contacts });
  }),
);

// Total unread messages across all conversations (for a sidebar badge).
router.get(
  "/chat/unread-count",
  isAuth,
  asyncHandler(async (req, res) => {
    const count = await getUnreadMessageCount(req.session.userId);
    res.json({ count });
  }),
);

// Full message history with one contact; marks their messages to us as read.
router.get(
  "/chat/messages/:userId",
  isAuth,
  asyncHandler(async (req, res) => {
    const messages = await getConversation(
      req.session.userId,
      req.session.userRole,
      req.params.userId,
    );
    if (messages === null) {
      return res.status(403).json({ error: "You are not able to view this conversation." });
    }
    res.json({ messages });
  }),
);

// Send a message to another user.
router.post(
  "/chat/messages",
  isAuth,
  asyncHandler(async (req, res) => {
    const { receiverId, content } = req.body;
    if (!receiverId) {
      return res.status(400).json({ error: "receiverId is required." });
    }
    try {
      const message = await sendChatMessage(
        req.session.userId,
        req.session.userRole,
        receiverId,
        content,
      );
      res.status(201).json({ message });
    } catch (err) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  }),
);

export default router;
