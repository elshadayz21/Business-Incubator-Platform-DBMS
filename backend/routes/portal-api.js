import { Router } from "express";
import multer from "multer";
import path from "path";
import pool from "../config/db.js";
import { authorizeRole } from "../middleware/check_roles.middleware.js";
import { isAuth } from "../middleware/auth.middlware.js";
import { ROLES } from "../utils/constants.js";
import { getWorkshopsWithEnrollmentQuery } from "../models/workshop/Workshop.js";
import {
  getEntrepreneurDashboard,
    getProjectDetailsForPortal,
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
import {
  getEntrepreneurProgress,
  submitWork,
  getSubmissionHistory,
  getSubmissionsForMentor,
  reviewSubmission,
} from "../admin-backend/progress/progress.js";

// Multer for the optional file attached to a submitted-work form. Mirrors
// the config already used for application/announcement documents (same
// storage folder, allowed types, per-file size cap) plus zip, since work
// submissions may be a code archive.
const progressUploadStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) =>
    cb(null, `submission-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const uploadSubmissionFile = multer({
  storage: progressUploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedExt = /\.(pdf|doc|docx|png|jpg|jpeg|zip)$/i.test(file.originalname);
    const allowedMime = /^(application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|zip|x-zip-compressed)|image\/(png|jpe?g))$/.test(
      file.mimetype,
    );
    const genericMime = file.mimetype === "application/octet-stream";
    if (allowedExt && (allowedMime || genericMime)) return cb(null, true);
    cb(new Error("Invalid file type. Only PDF, DOC, DOCX, ZIP, PNG, JPG, and JPEG files are allowed."));
  },
});

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

// GET: Load more activity logs (Pagination)
router.get("/entrepreneur/activity-logs", async (req, res) => {
    try {
        const userId = req.session.userId;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * 10;

        const result = await pool.query(
            `SELECT id, action_type, details, created_at
       FROM activity_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10 OFFSET $2`,
            [userId, offset]
        );

        res.json({ logs: result.rows });
    } catch (error) {
        console.error("Error fetching more logs:", error);
        res.status(500).json({ error: "Failed to load more logs" });
    }
});
// GET: Load more notifications (Pagination)
router.get("/entrepreneur/notifications", async (req, res) => {
    try {
        const userId = req.session.userId;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * 5;

        const result = await pool.query(
            `SELECT id, type, message, read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 5 OFFSET $2`,
            [userId, offset]
        );

        res.json({ notifications: result.rows });
    } catch (error) {
        console.error("Error fetching more notifications:", error);
        res.status(500).json({ error: "Failed to load more notifications" });
    }
});

// GET: Load more funding requests (Pagination)
router.get("/entrepreneur/funding", async (req, res) => {
    try {
        const userId = req.session.userId;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * 5;

        const result = await pool.query(
            `SELECT fr.id, fr.project_id, p.name AS project_name, fr.amount, fr.approved_amount, fr.founder_action, fr.status,
              fr.funding_stage, fr.description, fr.requested_at, fr.reviewed_at, fr.notes
       FROM funding_requests fr
       JOIN projects p ON p.id = fr.project_id
       JOIN project_entrepreneurs pe ON pe.project_id = fr.project_id
       WHERE pe.user_id = $1
       ORDER BY fr.requested_at DESC
       LIMIT 5 OFFSET $2`,
            [userId, offset]
        );

        res.json({ funding: result.rows });
    } catch (error) {
        console.error("Error fetching more funding:", error);
        res.status(500).json({ error: "Failed to load more funding" });
    }
});
// GET: All workshops with the logged-in entrepreneur's enrollment status (browse tab)
router.get("/entrepreneur/workshops/browse", async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ error: "Please log in." });

        const workshops = await getWorkshopsWithEnrollmentQuery(userId);
        res.json({ workshops });
    } catch (error) {
        console.error("Error fetching workshops for browse:", error);
        res.status(500).json({ error: "Failed to load workshops" });
    }
});
// GET: One project's details (member-only)
router.get("/entrepreneur/projects/:id", async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ error: "Please log in." });

        const project = await getProjectDetailsForPortal(req.params.id, userId);
        if (!project) return res.status(404).json({ error: "Project not found or not yours." });

        res.json({ project });
    } catch (error) {
        console.error("Error fetching project details:", error);
        res.status(500).json({ error: "Failed to load project" });
    }
});
// -------- Progress Tracking --------

// Entrepreneur: their phases/tasks + latest submission status per task.
router.get(
  "/entrepreneur/progress",
  isAuth,
  authorizeRole(ROLES.ENTREPRENEUR, ROLES.SUPERADMIN, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    res.json(await getEntrepreneurProgress(req.session.userId));
  }),
);

// Entrepreneur: submit work for a task (multipart/form-data — file is optional).
router.post(
  "/entrepreneur/progress/submit",
  isAuth,
  authorizeRole(ROLES.ENTREPRENEUR),
  uploadSubmissionFile.single("file"),
  asyncHandler(async (req, res) => {
    const submission = await submitWork(req.session.userId, {
      task_id: req.body.task_id,
      title: req.body.title,
      notes: req.body.notes,
      link_url: req.body.link_url,
      file_path: req.file ? `/uploads/${req.file.filename}` : null,
      file_name: req.file ? req.file.originalname : null,
    });
    res.status(201).json(submission);
  }),
);

// Entrepreneur: full submission history for one task (so they can see past
// feedback if they had to resubmit).
router.get(
  "/entrepreneur/progress/tasks/:taskId/history",
  isAuth,
  authorizeRole(ROLES.ENTREPRENEUR, ROLES.SUPERADMIN, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    res.json(await getSubmissionHistory(req.session.userId, req.params.taskId));
  }),
);

// Mentor: submissions across every assigned project, optionally filtered by status.
router.get(
  "/mentor/progress/submissions",
  isAuth,
  authorizeRole(ROLES.MENTOR, ROLES.SUPERADMIN, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    res.json(await getSubmissionsForMentor(req.session.userId, req.query.status));
  }),
);

// Mentor: approve / request changes / reject a submission.
router.post(
  "/mentor/progress/submissions/:id/review",
  isAuth,
  authorizeRole(ROLES.MENTOR),
  asyncHandler(async (req, res) => {
    const review = await reviewSubmission(req.session.userId, req.params.id, {
      status: req.body.status,
      feedback: req.body.feedback,
    });
    res.status(201).json(review);
  }),
);

// Convert submission-upload errors (bad file type, over the size cap) into
// JSON 400 responses instead of an HTML error page — mirrors the same
// pattern used for announcement/application document uploads.
router.use("/entrepreneur/progress/submit", (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let message = err && err.message ? err.message : "Invalid request";
  if (err && err.name === "MulterError") {
    message = err.code === "LIMIT_FILE_SIZE" ? "File exceeds the maximum size of 10MB." : err.message;
  }
  req.on("error", () => {});
  req.resume();
  res.setHeader("Connection", "close");
  return res.status(400).json({ message });
});

export default router;
