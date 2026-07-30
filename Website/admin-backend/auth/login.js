import { findUserByEmail } from "../models/user.model.js";
import bcrypt from "bcrypt";
import { ROLES } from "../../utils/constants.js";

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
    console.log("4. Stored Password (Hash) in DB:", user.password);

    // 🔥 السطر ده هو الحل: هنخلي النظام يولد هاش جديد لنفس الباسورد عشان نشوف شكله إيه
    const generatedHash = await bcrypt.hash(credentials.password, 10);
    console.log(
      "🔐 CORRECT HASH for your password should look like:",
      generatedHash,
    );

    // المقارنة
    const passwordMatch = await bcrypt.compare(
      credentials.password,
      user.password,
    );
    console.log("5. Password Match Result:", passwordMatch);

    if (!passwordMatch) {
      console.log("❌ Passwords do not match!");
      // نصيحة: انسخ الهاش اللي طلعلك في الخطوة اللي فوق وحطه في الداتا بيز
      return { success: false, message: "Incorrect password" };
    }

    if (user.role !== ROLES.ADMIN && user.role !== ROLES.SUPERADMIN) {
      console.log("❌ Role check failed:", user.role);
      return { success: false, message: "Access denied: Admins only" };
    }

    console.log("✅ Login Successful!");
    return { success: true, message: "Login successful", user };
  } catch (error) {
    console.error("🔥 Error during login:", error);
    return { success: false, message: "An error occurred during login" };
  }
}

