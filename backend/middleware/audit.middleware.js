import { logAdminAudit } from "../utils/auditLog.js";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Logs every state-changing request under /api/admin to admin_audit_log,
// regardless of which controller ends up handling it. This is deliberately
// coarse (method + path + a trimmed body, not a hand-written description of
// "what changed") in exchange for completeness: a new admin endpoint is
// covered the moment it's mounted, with nothing extra to remember to wire up.
//
// /auth/login is skipped here and logged explicitly by the login route
// instead, since req.session isn't populated yet when this middleware runs
// for that request, and we want failed attempts recorded too (with no actor).
export const auditTrail = (req, res, next) => {
  if (!MUTATING_METHODS.has(req.method) || req.path.startsWith("/auth/login")) {
    return next();
  }

  res.on("finish", () => {
    logAdminAudit({
      actorId: req.session?.userId,
      actorName: req.session?.userName,
      actorRole: req.session?.userRole,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      body: req.body,
    });
  });

  next();
};
