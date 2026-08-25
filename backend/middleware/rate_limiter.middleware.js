import rateLimit from "express-rate-limit";
import { get429 } from "../controllers/error/error.controller.js"; 

// Signup limiter
export const signupLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    return get429(req, res);
  },
});

// Login limiter
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    return get429(req, res);
  },
});