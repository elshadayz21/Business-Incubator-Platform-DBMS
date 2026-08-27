import pool from "../../config/db.js";
import { hashPassword } from "../../utils/hash.js";
import { generateUserCode, isPasswordStrong } from "../../utils/helpers.js";
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
  if (!isPasswordStrong(password)) {
    throw new Error("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
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
  if (!Object.values(ROLES).includes(role)) {
    throw new Error("Invalid role.");
  }
  const target = await pool.query("SELECT role FROM users WHERE id = $1", [id]);
  if (target.rows.length === 0) throw new Error("User not found.");
  if (target.rows[0].role === ROLES.SUPERADMIN && role !== ROLES.SUPERADMIN) {
    const superCount = await pool.query(
      "SELECT COUNT(*)::int AS n FROM users WHERE role = 'superadmin'",
    );
    if (superCount.rows[0].n <= 1) {
      throw new Error("Cannot demote the last superadmin account.");
    }
  }
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

export const resetUserPassword = async (id, password) => {
  if (!password || !isPasswordStrong(String(password))) {
    throw new Error("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
  }
  const hashed = await hashPassword(String(password));
  const res = await pool.query(
    `UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
     RETURNING id, name, email, role, status`,
    [hashed, id],
  );
  if (res.rows.length === 0) throw new Error("User not found.");
  return res.rows[0];
};

export const deleteUser = async (id) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const target = await client.query("SELECT role FROM users WHERE id = $1", [id]);
    if (target.rows.length === 0) {
      const err = new Error("User not found.");
      err.statusCode = 404;
      throw err;
    }

    if (target.rows[0].role === ROLES.SUPERADMIN) {
      const superCount = await client.query(
        "SELECT COUNT(*)::int AS n FROM users WHERE role = 'superadmin'",
      );
      if (superCount.rows[0].n <= 1) {
        const err = new Error("Cannot delete the last superadmin account.");
        err.statusCode = 400;
        throw err;
      }
    }

    // Clean up dependent child records referencing user_id
    await client.query("DELETE FROM project_entrepreneurs WHERE user_id = $1", [id]);
    await client.query("DELETE FROM workshop_attendance WHERE user_id = $1", [id]);
    await client.query("DELETE FROM notifications WHERE user_id = $1", [id]);
    await client.query("DELETE FROM activity_logs WHERE user_id = $1", [id]);
    await client.query("DELETE FROM cohort_members WHERE user_id = $1", [id]);
    await client.query("DELETE FROM mentor_assignments WHERE mentor_id = $1 OR entrepreneur_id = $1", [id]);
    await client.query("DELETE FROM mentors WHERE user_id = $1", [id]);

    // Disassociate optional relations by setting foreign key columns to NULL
    await client.query("UPDATE workshops SET trainer_id = NULL WHERE trainer_id = $1", [id]);
    await client.query("UPDATE announcements SET author_id = NULL WHERE author_id = $1", [id]);
    await client.query("UPDATE funding_requests SET investor_id = NULL WHERE investor_id = $1", [id]);
    await client.query("UPDATE funding_requests SET reviewed_by = NULL WHERE reviewed_by = $1", [id]);
    await client.query("UPDATE email_campaigns SET created_by = NULL WHERE created_by = $1", [id]);

    // Clean up workshop_enrollments if table and column are present
    await client.query("DELETE FROM workshop_enrollments WHERE entrepreneur_id = $1", [id]).catch(() => {});

    // Finally delete user row
    await client.query("DELETE FROM users WHERE id = $1", [id]);

    await client.query("COMMIT");
    return { success: true };
  } catch (err) {
    await client.query("ROLLBACK");
    if (!err.statusCode) {
      err.statusCode = 400;
    }
    throw err;
  } finally {
    client.release();
  }
};
