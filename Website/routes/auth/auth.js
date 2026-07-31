import { Router } from "express";
import {
  signupPage,
  loginPage,
  profilePage,
  register,
  login,
  logout,
  getBasicUserData,
  updateProfileImage,
  changePassword,
} from "../../controllers/auth/auth.controller.js";
import { setupPage, createSetupAdmin } from "../../controllers/auth/setup.controller.js";
import upload from "../../config/multer.js";
import { isAuth } from "../../middleware/auth.middlware.js";

const router = Router();

const uploadProfileImage = (req, res, next) => {
  upload.single("profilePicture")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ message: "Image size must not exceed 5MB." });
      }
      return res
        .status(400)
        .json({ message: err.message || "File upload failed." });
    }
    next();
  });
};

// Pages
router.get("/setup", setupPage);
router.post("/setup", createSetupAdmin);
router.get("/signup", signupPage);
router.get("/login", loginPage);
router.get("/profile", isAuth, profilePage);

// Pages Logic
router.post("/register", register);
router.post("/login", login);
router.post("/logout", isAuth, logout);

router.post(
  "/profile/upload-picture",
  isAuth,
  uploadProfileImage,
  updateProfileImage
);

router.post(
  "/profile/update-password",
  isAuth,
  changePassword
);

router.get("/me", isAuth, getBasicUserData);

export { router as AuthRouter };