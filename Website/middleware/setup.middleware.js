import { checkSuperadminExists } from "../models/auth/auth.model.js";

let isSetupComplete = null;

export const setSetupComplete = (val) => {
  isSetupComplete = val;
};

export const setupMiddleware = async (req, res, next) => {
  try {
    // If we haven't checked yet or it's false, check the DB
    if (!isSetupComplete) {
      isSetupComplete = await checkSuperadminExists();
    }

    const isSetupRoute = req.path.startsWith("/setup") || req.path.startsWith("/v1/auth/setup");
    const isPublicStatic = req.path.startsWith("/css") || req.path.startsWith("/js") || req.path.startsWith("/images") || req.path.startsWith("/assets");

    // Allow static assets to load
    if (isPublicStatic) {
      return next();
    }

    // If setup is NOT complete
    if (!isSetupComplete) {
      if (!isSetupRoute) {
        return res.redirect("/v1/auth/setup");
      }
      return next();
    }

    // If setup IS complete
    if (isSetupRoute) {
      return res.redirect("/v1/auth/login");
    }

    next();
  } catch (err) {
    console.error("Setup middleware error:", err);
    next(err);
  }
};
