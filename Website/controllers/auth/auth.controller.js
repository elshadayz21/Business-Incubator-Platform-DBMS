import {
  findUserByEmail,
  createUser,
  findUserById,
  updateUserProfileImage,
  getUserBasicInfo,
  updateUserPassword,
  getUserNotifications,
  markNotificationsAsRead,
} from "../../models/auth/auth.model.js";
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
import { generateUserCode } from "../../utils/helpers.js";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getUserActivityLogs, getSystemMetrics } from "../../models/analytics/analytics.model.js";
import eventBus from "../../utils/eventBus.js";

export const signupPage = (req, res) =>
  res.render("auth/signup", {
    pageRoute: "/v1/auth/signup",
    error: req.flash("error")[0] || null,
    success: req.flash("success")[0] || null,
  });

export const loginPage = (req, res) =>
  res.render("auth/login", {
    pageRoute: "/v1/auth/login",
    error: req.flash("error")[0] || null,
    success: req.flash("success")[0] || null,
  });

export const profilePage = async (req, res, next) => {
  try {
    const user = await getUserBasicInfo(req.session.userId);
    if (!user) {
      return res.redirect("/v1/auth/login");
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

    res.render("profile/profile", {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
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
        loginRoute: "/v1/auth/login",
        funding: "/v1/funding",
      },
      pageRoute: "/v1/auth/profile",
    });
  } catch (err) {
    next(err);
  }
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      req.flash("error", "All fields are required");
      return res.redirect("/v1/auth/signup");
    }

    if (password.length < 8) {
      req.flash("error", "Password must be at least 8 characters");
      return res.redirect("/v1/auth/signup");
    }

    let user = await findUserByEmail(email);
    if (user) {
      req.flash("error", "User already exists with this email");
      return res.redirect("/v1/auth/signup");
    }

    const hashedPassword = await hashPassword(password);
    let user_code = generateUserCode();

    const newUser = await createUser({
      name,
      user_code,
      email,
      password: hashedPassword,
    });

    req.flash("success", "Account created successfully! Please login.");
    res.redirect("/v1/auth/login");
  } catch (err) {
    req.flash(
      "error",
      "An error occurred during registration. Please try again.",
    );
    res.redirect("/v1/auth/signup");
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash("error", "Email and password are required");
      return res.redirect("/v1/auth/login");
    }

    const user = await findUserByEmail(email);
    if (!user) {
      req.flash("error", "Invalid email or password");
      return res.redirect("/v1/auth/login");
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      req.flash("error", "Invalid email or password");
      return res.redirect("/v1/auth/login");
    }

    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userName = user.name;
    req.session.userEmail = user.email;

    // Emit login event to trigger activity log subscriber
    eventBus.emit("auth.login", { user });

    res.send(`
      <script>
        localStorage.setItem('isLoggedIn', 'true');
        window.location.href = '/v1/auth/profile';
      </script>
    `);
  } catch (err) {
    req.flash("error", "An error occurred during login. Please try again.");
    res.redirect("/v1/auth/login");
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
          localStorage.setItem('isLoggedIn', 'false');
          window.location.href = '/v1/auth/login';
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
      return res.redirect("/v1/auth/login");
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

    if (newPassword.length < 8) {
      req.flash("error", "New password must be at least 8 characters.");
      return res.redirect("/v1/auth/profile");
    }

    if (newPassword !== confirmPassword) {
      req.flash("error", "New password and confirmation do not match.");
      return res.redirect("/v1/auth/profile");
    }

    const user = await findUserById(req.session.userId);
    if (!user) {
      req.flash("error", "User not found. Please login again.");
      return res.redirect("/v1/auth/login");
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
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
};
