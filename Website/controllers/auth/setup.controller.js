import { checkSuperadminExists, createUser } from "../../models/auth/auth.model.js";
import { hashPassword } from "../../utils/hash.js";
import { generateUserCode } from "../../utils/helpers.js";
import { ROLES } from "../../utils/constants.js";
import { setSetupComplete } from "../../middleware/setup.middleware.js";

export const setupPage = async (req, res, next) => {
  try {
    const isSetup = await checkSuperadminExists();
    if (isSetup) {
      return res.redirect("/v1/auth/login");
    }
    res.render("auth/setup", {
      pageRoute: "/v1/auth/setup",
      error: req.flash("error")[0] || null,
      success: req.flash("success")[0] || null,
    });
  } catch (err) {
    next(err);
  }
};

export const createSetupAdmin = async (req, res, next) => {
  try {
    const isSetup = await checkSuperadminExists();
    if (isSetup) {
      return res.redirect("/v1/auth/login");
    }

    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      req.flash("error", "All fields are required.");
      return res.redirect("/v1/auth/setup");
    }

    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match.");
      return res.redirect("/v1/auth/setup");
    }

    if (password.length < 8) {
      req.flash("error", "Password must be at least 8 characters.");
      return res.redirect("/v1/auth/setup");
    }

    const hashedPassword = await hashPassword(password);
    let user_code = generateUserCode();

    await createUser({
      name,
      user_code,
      email,
      password: hashedPassword,
      role: ROLES.SUPERADMIN,
    });

    setSetupComplete(true);

    req.flash("success", "Superadmin created successfully! Please login.");
    res.redirect("/v1/auth/login");
  } catch (err) {
    req.flash("error", "An error occurred during setup. Please try again.");
    res.redirect("/v1/auth/setup");
  }
};
