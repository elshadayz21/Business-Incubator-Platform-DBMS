import { findUserByEmail } from "../models/user.model.js";
import bcrypt from "bcrypt";
import { ROLES } from "../../utils/constants.js";
import pool from "../../config/db.js";

export default async function loginRequest(credentials) {
  try {
    console.log("---- Login Attempt Debug ----");
    console.log("1. Email provided:", credentials.email);
    console.log("2. Password provided:", credentials.password);

    const user = await findUserByEmail(credentials.email);

    if (!user) {
      console.log("❌ User not found in DB");
      return { success: false, message: "User not found" };
    }

    console.log("3. User found in DB:", user.email);
    console.log("3.5. Account status:", user.status);

    if (user.status === "inactive") {
      console.log("❌ Account is deactivated:", user.status);
      return {
        success: false,
        message: "Account is deactivated. Please contact a superadmin.",
      };
    }

    // Check brute-force lockout status
    if (user.lockout_until && new Date() < new Date(user.lockout_until)) {
      const minutesRemaining = Math.ceil((new Date(user.lockout_until) - new Date()) / 60000);
      return {
        success: false,
        message: `Account is temporarily locked. Try again in ${minutesRemaining} minutes.`,
      };
    }

    // Comparison
    const passwordMatch = await bcrypt.compare(
      credentials.password,
      user.password,
    );
    console.log("5. Password Match Result:", passwordMatch);

    if (!passwordMatch) {
      console.log("❌ Passwords do not match!");
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      if (failedAttempts >= 5) {
        const lockoutTime = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        await pool.query("UPDATE users SET failed_login_attempts = $1, lockout_until = $2 WHERE id = $3", [failedAttempts, lockoutTime, user.id]);
        return {
          success: false,
          message: "Too many failed attempts. Your account is temporarily locked for 15 minutes.",
        };
      } else {
        await pool.query("UPDATE users SET failed_login_attempts = $1 WHERE id = $2", [failedAttempts, user.id]);
        return {
          success: false,
          message: `Incorrect password. Attempts remaining: ${5 - failedAttempts}`,
        };
      }
    }

    // Reset attempts on successful login
    if ((user.failed_login_attempts || 0) > 0 || user.lockout_until) {
      await pool.query("UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = $1", [user.id]);
    }

    if (!Object.values(ROLES).includes(user.role)) {
      console.log("❌ Unknown role:", user.role);
      return { success: false, message: "Access denied: Invalid account role" };
    }

    console.log("✅ Login Successful!");
    const { password: _password, ...safeUser } = user;
    return { success: true, message: "Login successful", user: safeUser };
  } catch (error) {
    console.error("🔥 Error during login:", error);
    return { success: false, message: "An error occurred during login" };
  }
}

