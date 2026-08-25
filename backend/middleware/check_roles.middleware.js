import { get401, get403 } from "../controllers/error/error.controller.js";

export const authorizeRole = (...roles) => {
  return (req, res, next) => {
    
    if (!req.session || !req.session.userRole) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(401).json({ error: "Unauthorized access" });
      }
      return get401(req, res);
    }

    if (!roles.includes(req.session.userRole)) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(403).json({ error: "Access Forbidden" });
      }
      return get403(req, res);
    }

    next();
  };
};