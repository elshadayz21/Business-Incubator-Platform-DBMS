import pool from "../../config/db.js";
import { hashPassword } from "../../utils/hash.js";
import { generateUserCode } from "../../utils/helpers.js";
import { ROLES } from "../../utils/constants.js";

export const getAllUsers = async () => {
  const res = await pool.query(
    `SELECT id, name, email, user_code, role, status, created_at FROM users ORDER BY created_at DESC`,
  );
  return res.rows;
};

export const createAdminUser = async ({ name, email, password, role }) => {
  if (![ROLES.ADMIN, ROLES.SUPERADMIN].includes(role)) {
    throw new Error("Only admin or superadmin roles can be created here.");
  }
  const hashed = await hashPassword(password);
  const user_code = generateUserCode();
  const res = await pool.query(
    `INSERT INTO users (name, user_code, email, password, role)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, status, created_at`,
    [name, user_code, email, hashed, role],
  );
  return res.rows[0];
};

export const updateUserRole = async (id, role) => {
  const res = await pool.query(
    `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
     RETURNING id, name, email, role, status`,
    [role, id],
  );
  if (res.rows.length === 0) throw new Error("User not found.");
  return res.rows[0];
};

export const setUserStatus = async (id, status) => {
  const res = await pool.query(
    `UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
     RETURNING id, name, email, role, status`,
    [status, id],
  );
  if (res.rows.length === 0) throw new Error("User not found.");
  return res.rows[0];
};
