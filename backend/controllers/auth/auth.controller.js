
import Joi from "joi";
import xss from "xss";
import pool from "../../config/db.js";
import {
  findUserByEmail,
  createUser,
  findUserById,
  updateUserProfileImage,
  getUserBasicInfo,
  updateUserPassword,
  updateUserProfile,
  getUserNotifications,
  markNotificationsAsRead,
} from "../../models/auth/auth.model.js";
import { ROLES } from "../../utils/constants.js";
import {
  getUserProjects,
  getUserFundingRequests,
  getInvestorPendingRequests,
  getInvestorPortfolio,
} from "../../models/funding/funding.model.js";
import { getMentorProjects } from "../../models/project/project.model.js";
import {
  getUserWorkshops,
  getMentorWorkshops,
} from "../../models/workshop/Workshop.js";
import { hashPassword, comparePassword } from "../../utils/hash.js";
import { generateUserCode, isPasswordStrong } from "../../utils/helpers.js";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  getUserActivityLogs,
  getSystemMetrics,
} from "../../models/analytics/analytics.model.js";
import eventBus from "../../utils/eventBus.js";

export const signupPage = (req, res) =>
  res.render("auth/signup", {
    pageRoute: "/v1/auth/signup",
    error: req.flash("error")[0] || null,
    success: req.flash("success")[0] || null,
    token: req.query.token
  });

export const loginPage = (req, res) => res.redirect("/admin");

export const profilePage = async (req, res, next) => {
  try {
    const user = await getUserBasicInfo(req.session.userId);
    if (!user) {
      return res.redirect("/admin");
    }

    const userId = req.session.userId;
    const role = user.role;
    const activeTab = req.query.tab || "info";

    // Dashboard data container
    const dashboardData = {
      activeTab,
      projects: [],
      fundingRequests: [],
      workshops: [],
      notifications: [],
      pendingRequests: [],
      portfolio: [],
      activityLogs: [],
      stats: [],
    };

    if (role === "entrepreneur") {
      dashboardData.projects = await getUserProjects(userId);
      dashboardData.fundingRequests = await getUserFundingRequests(userId);
      dashboardData.workshops = await getUserWorkshops(userId);
      dashboardData.notifications = await getUserNotifications(userId);

      // Mark notifications as read if user is viewing notifications tab
      if (activeTab === "notifications") {
        await markNotificationsAsRead(userId);
      }
    } else if (role === "mentor") {
      dashboardData.projects = await getMentorProjects(userId);
      dashboardData.workshops = await getMentorWorkshops(userId);
    } else if (role === "investor") {
      dashboardData.pendingRequests = await getInvestorPendingRequests();
      dashboardData.portfolio = await getInvestorPortfolio(userId);
    }

    if (activeTab === "timeline") {
      dashboardData.activityLogs = await getUserActivityLogs(userId);
    } else if (activeTab === "stats") {
      dashboardData.stats = await getSystemMetrics();
    }

    const roleTitles = {
      admin: "Dx Valley ICMS - Admin Portal",
      superadmin: "Dx Valley ICMS - Super Admin Portal",
      entrepreneur: "Dx Valley ICMS - Entrepreneur Portal",
      mentor: "Dx Valley ICMS - Mentor Portal",
      investor: "Dx Valley ICMS - Investor Portal",
    };

    res.render("profile/profile", {
      title: roleTitles[user.role] || "Dx Valley ICMS",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userCode: user.user_code || null,
        role: user.role,
        profilePicture: user.profile_image || null,
        company: user.company || null,
        expertise: user.expertise || null,
        bio: user.bio || null,
      },
      dashboard: dashboardData,
      error: req.flash("error")[0] || null,
      success: req.flash("success")[0] || null,
      routes: {
        signupRoute: "/v1/auth/signup",
        loginRoute: "/admin",
        funding: "/v1/funding",
      },
      pageRoute: "/v1/auth/profile",
    });
  } catch (err) {
    next(err);
  }
};


const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
  token: Joi.string().required()
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required()
});

const profileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  bio: Joi.string().trim().allow("").max(1000).optional(),
  company: Joi.string().trim().allow("").max(100).optional(),
  expertise: Joi.string().trim().allow("").max(100).optional()
});

export const register = async (req, res, next) => {
  try {
    console.log("Backend received signup request:", req.body);
    const { name, email, password, token } = req.body;

    // 1. SECURITY CHECK: Ensure a token was provided
    if (!token) {
      req.flash("error", "Invitation token is required to sign up.");
      return res.redirect("/v1/auth/signup");
    }

    // 2. Check if the token is valid, accepted, and not used
    const tokenRes = await pool.query(
        "SELECT * FROM applications WHERE invite_token = $1 AND status = 'Accepted' AND invite_used = false",
        [token]
    );

    if (tokenRes.rows.length === 0) {
      req.flash("error", "Invalid, expired, or already used invitation link.");
      return res.redirect("/v1/auth/signup");
    }

    // Joi Whitelist Validation
    const { error: validationError } = signupSchema.validate(req.body);
    if (validationError) {
      req.flash("error", validationError.details[0].message);
      return res.redirect(`/v1/auth/signup?token=${token || ""}`);
    }

    if (!isPasswordStrong(password)) {
      req.flash("error", "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
      return res.redirect(`/v1/auth/signup?token=${token}`);
    }

    // 4. Check if user already exists (Using your team's model function!)
    let user = await findUserByEmail(email);
    if (user) {
      req.flash("error", "User already exists with this email");
      return res.redirect(`/v1/auth/signup?token=${token}`);
    }

    // 5. Create the user (Using your team's model functions so password gets hashed!)
    const hashedPassword = await hashPassword(password);
    let user_code = generateUserCode();

    const newUser = await createUser({
      name,
      user_code,
      email,
      password: hashedPassword,
    });

    // 6. Mark the token as used so it can't be used again!
    await pool.query("UPDATE applications SET invite_used = true WHERE invite_token = $1", [token]);

    req.flash("success", "Account created successfully! Please login.");
    res.redirect("/admin");

  } catch (err) {
    console.error("Registration error:", err);
    req.flash("error", "An error occurred during registration. Please try again.");
    res.redirect("/v1/auth/signup");
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { error: validationError } = loginSchema.validate(req.body);
    if (validationError) {
      req.flash("error", validationError.details[0].message);
      return res.redirect("/admin");
    }

    const user = await findUserByEmail(email);
    if (!user) {
      req.flash("error", "Invalid email or password");
      return res.redirect("/admin");
    }

    if (user.status === "inactive") {
      req.flash("error", "Account is deactivated. Please contact an administrator.");
      return res.redirect("/admin");
    }

    // Check brute-force lockout status
    if (user.lockout_until && new Date() < new Date(user.lockout_until)) {
      const minutesRemaining = Math.ceil((new Date(user.lockout_until) - new Date()) / 60000);
      req.flash("error", `Account is temporarily locked due to consecutive failed login attempts. Try again in ${minutesRemaining} minutes.`);
      return res.redirect("/admin");
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      if (failedAttempts >= 5) {
        const lockoutTime = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        await pool.query("UPDATE users SET failed_login_attempts = $1, lockout_until = $2 WHERE id = $3", [failedAttempts, lockoutTime, user.id]);
        req.flash("error", "Too many failed attempts. Your account has been temporarily locked for 15 minutes.");
      } else {
        await pool.query("UPDATE users SET failed_login_attempts = $1 WHERE id = $2", [failedAttempts, user.id]);
        req.flash("error", `Invalid email or password. Attempts remaining: ${5 - failedAttempts}`);
      }
      return res.redirect("/admin");
    }

    // Reset attempts on successful login
    if ((user.failed_login_attempts || 0) > 0 || user.lockout_until) {
      await pool.query("UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = $1", [user.id]);
    }

    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userName = user.name;
    req.session.userEmail = user.email;

    // Emit login event to trigger activity log subscriber
    eventBus.emit("auth.login", { user });

    let redirectUrl = "/v1/auth/profile";
    if (user.role === ROLES.SUPERADMIN || user.role === ROLES.ADMIN) {
      redirectUrl = "/admin/dashboard";
    } else if (user.role === ROLES.MENTOR || user.role === ROLES.ENTREPRENEUR) {
      redirectUrl = "/admin/";
    }

    const userDataJson = JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile_image: user.profile_image || null,
    });

    req.session.save((err) => {
      if (err) {
        console.error("Session save error during login:", err);
        req.flash("error", "An error occurred during login. Please try again.");
        return res.redirect("/admin");
      }

      res.send(`
        <script>
          sessionStorage.setItem('isLoggedIn', 'true');
          sessionStorage.setItem('user', JSON.stringify(${userDataJson}));
          localStorage.setItem('isLoggedIn', 'true');
          window.location.href = '${redirectUrl}';
        </script>
      `);
    });
  } catch (err) {
    req.flash("error", "An error occurred during login. Please try again.");
    res.redirect("/admin");
  }
};

export const logout = (req, res, next) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie("repodoctor.sid");

      res.send(`
        <script>
          sessionStorage.clear();
          localStorage.setItem('isLoggedIn', 'false');
          window.location.href = '/admin';
        </script>
      `);
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      req.flash("error", "No image file provided.");
      return res.redirect("/v1/auth/profile");
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      await fs.unlink(req.file.path);
      req.flash(
        "error",
        "Invalid file type. Only JPG, JPEG, and PNG are allowed.",
      );
      return res.redirect("/v1/auth/profile");
    }

    const maxFileSize = 5 * 1024 * 1024;
    if (req.file.size > maxFileSize) {
      await fs.unlink(req.file.path);
      req.flash("error", "Image size must not exceed 5MB.");
      return res.redirect("/v1/auth/profile");
    }

    const user = await findUserById(req.session.userId);
    if (!user) {
      await fs.unlink(req.file.path);
      req.flash("error", "User not found. Please login again.");
      return res.redirect("/admin");
    }

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const processedImageDir = path.join(
      __dirname,
      "../../public/uploads/profile-images",
    );

    try {
      await fs.mkdir(processedImageDir, { recursive: true });
    } catch (err) {
      await fs.unlink(req.file.path);
      req.flash("error", "Failed to create upload directory.");
      return res.redirect("/v1/auth/profile");
    }

    const timestamp = Date.now();
    const filename = `profile-${req.session.userId}-${timestamp}.jpg`;
    const processedImagePath = path.join(processedImageDir, filename);

    try {
      await sharp(req.file.path)
        .resize(200, 200, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 80, progressive: true })
        .toFile(processedImagePath);
    } catch (err) {
      await fs.unlink(req.file.path);
      req.flash(
        "error",
        "Failed to process image. Please try again with a different image.",
      );
      return res.redirect("/v1/auth/profile");
    }

    try {
      await fs.unlink(req.file.path);
    } catch (err) {
      console.warn("Could not delete original file:", err.message);
    }

    if (user.profile_image) {
      try {
        const oldImagePath = path.join(
          __dirname,
          "../../public",
          user.profile_image,
        );
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.warn("Could not delete old profile image:", err.message);
      }
    }

    const imagePath = `/uploads/profile-images/${filename}`;
    try {
      await updateUserProfileImage(req.session.userId, imagePath);
      req.flash("success", "Profile picture updated successfully!");
      res.redirect("/v1/auth/profile");
    } catch (err) {
      try {
        await fs.unlink(processedImagePath);
      } catch (e) {
        console.warn("Could not delete processed image:", e.message);
      }
      req.flash("error", "Failed to update profile picture in database.");
      return res.redirect("/v1/auth/profile");
    }
  } catch (err) {
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        console.warn("Could not delete uploaded file:", e.message);
      }
    }
    req.flash("error", "An unexpected error occurred. Please try again.");
    res.redirect("/v1/auth/profile");
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      req.flash("error", "All password fields are required.");
      return res.redirect("/v1/auth/profile");
    }

    if (!isPasswordStrong(newPassword)) {
      req.flash("error", "New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
      return res.redirect("/v1/auth/profile");
    }

    if (newPassword !== confirmPassword) {
      req.flash("error", "New password and confirmation do not match.");
      return res.redirect("/v1/auth/profile");
    }

    const user = await findUserById(req.session.userId);
    if (!user) {
      req.flash("error", "User not found. Please login again.");
      return res.redirect("/admin");
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      req.flash("error", "Current password is incorrect.");
      return res.redirect("/v1/auth/profile");
    }

    const isSameAsOld = await comparePassword(newPassword, user.password);
    if (isSameAsOld) {
      req.flash(
        "error",
        "New password must be different from current password.",
      );
      return res.redirect("/v1/auth/profile");
    }

    const hashedPassword = await hashPassword(newPassword);
    await updateUserPassword(req.session.userId, hashedPassword);

    req.flash("success", "Password changed successfully!");
    res.redirect("/v1/auth/profile");
  } catch (err) {
    req.flash("error", "Failed to change password. Please try again.");
    res.redirect("/v1/auth/profile");
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, company, expertise } = req.body;

    const { error: validationError } = profileSchema.validate(req.body);
    if (validationError) {
      req.flash("error", validationError.details[0].message);
      return res.redirect("/v1/auth/profile");
    }

    await updateUserProfile(req.session.userId, {
      name: xss(name.trim()),
      bio: bio ? xss(bio.trim()) : "",
      company: company ? xss(company.trim()) : "",
      expertise: expertise ? xss(expertise.trim()) : "",
    });

    // Update session name so the header reflects the change
    req.session.userName = name.trim();

    req.flash("success", "Profile updated successfully!");
    res.redirect("/v1/auth/profile");
  } catch (err) {
    console.error("Error updating profile:", err);
    req.flash("error", "Failed to update profile. Please try again.");
    res.redirect("/v1/auth/profile");
  }
};

export const getBasicUserData = async (req, res, next) => {
  try {
    const user = await getUserBasicInfo(req.session.userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({
      message: "User data retrieved successfully!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile_image: user.profile_image,
        role: user.role,
        bio: user.bio || null,
        company: user.company || null,
        expertise: user.expertise || null,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
};
