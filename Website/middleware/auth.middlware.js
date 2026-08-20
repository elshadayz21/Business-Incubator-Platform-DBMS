import { get401 } from "../controllers/error/error.controller.js";

export const isAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return get401(req, res);
  }

  req.user = {
    id: req.session.userId,
    role: req.session.userRole,
    name: req.session.userName,
    email: req.session.userEmail,
  };

  next();
};
