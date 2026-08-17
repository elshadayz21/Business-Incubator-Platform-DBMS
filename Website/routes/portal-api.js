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
} from "../admin-backend/portal/portal.js";

const router = Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
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

router.get(
  "/mentor/dashboard",
  isAuth,
  authorizeRole(ROLES.MENTOR, ROLES.SUPERADMIN, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const dashboard = await getMentorDashboard(req.session.userId);
    res.json(dashboard);
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

export default router;
