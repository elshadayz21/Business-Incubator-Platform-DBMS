import pool from "../../config/db.js";
import { hashPassword } from "../../utils/hash.js";
import { generateUserCode } from "../../utils/helpers.js";

const VALID_STATUSES = ["active", "inactive"];

// 1. Get All Mentors (Paginated)
export const getAllMentors = async (limit = null, offset = 0) => {
  try {
    let sql = `
      SELECT 
        m.*, 
        COUNT(DISTINCT mp.project_id) as projects_count,
        COUNT(DISTINCT mw.workshop_id) as workshops_count
      FROM mentors m
      LEFT JOIN mentor_project_assignments mp ON mp.mentor_id = m.id
      LEFT JOIN mentor_workshop_assignments mw ON mw.mentor_id = m.id
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `;
    const params = [];
    if (limit != null) {
      sql += ` LIMIT $1 OFFSET $2`;
      params.push(limit, offset);
    }
    const res = await pool.query(sql, params);

    return res.rows.map((mentor) => ({
      ...mentor,
      projects_count: parseInt(mentor.projects_count) || 0,
      workshops_count: parseInt(mentor.workshops_count) || 0,
    }));
  } catch (error) {
    console.error("Error in getAllMentors:", error);
    throw new Error("Failed to fetch mentors.");
  }
};

// 2. Add New Mentor (creates both Mentor profile and User login account)
export const addMentor = async (data) => {
  const {
    name,
    email,
    phone,
    expertise,
    status,
    password,
    assignedProject,
    assignedWorkshop,
  } = data;

  if (!name || !email) {
    throw new Error("Name and Email are required.");
  }
  if (status && !VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // A. Create or update user account in "users" table so mentor can log in
    let userId = null;
    const userCheck = await client.query("SELECT id FROM users WHERE email = $1", [email]);

    if (userCheck.rows.length > 0) {
      userId = userCheck.rows[0].id;
      if (password && password.trim().length >= 6) {
        const hashed = await hashPassword(password.trim());
        await client.query(
            `UPDATE users 
           SET role = 'mentor', name = COALESCE($1, name), expertise = COALESCE($2, expertise), status = COALESCE($3, status), password = $4, updated_at = CURRENT_TIMESTAMP
           WHERE id = $5`,
            [name, expertise, status || "active", hashed, userId]
        );
      } else {
        await client.query(
            `UPDATE users 
           SET role = 'mentor', name = COALESCE($1, name), expertise = COALESCE($2, expertise), status = COALESCE($3, status), updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
            [name, expertise, status || "active", userId]
        );
      }
    } else {
      const rawPass = password && password.trim().length >= 6 ? password.trim() : "Mentor123!";
      const hashed = await hashPassword(rawPass);
      const userCode = generateUserCode();

      const userInsert = await client.query(
          `INSERT INTO users (name, user_code, email, password, role, expertise, status)
         VALUES ($1, $2, $3, $4, 'mentor', $5, $6)
         RETURNING id`,
          [name, userCode, email, hashed, expertise, status || "active"]
      );
      userId = userInsert.rows[0].id;
    }

    // B. Insert Mentor profile
    const insertRes = await client.query(
        `INSERT INTO mentors (user_id, name, email, phone, expertise, status) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
        [userId, name, email, phone, expertise, status || "active"],
    );
    const newMentor = insertRes.rows[0];

    // C. Handle Quick Assignments
    if (assignedProject) {
      await client.query(
          "INSERT INTO mentor_project_assignments (mentor_id, project_id) VALUES ($1, $2)",
          [newMentor.id, assignedProject],
      );
    }

    if (assignedWorkshop) {
      await client.query(
          "INSERT INTO mentor_workshop_assignments (mentor_id, workshop_id) VALUES ($1, $2)",
          [newMentor.id, assignedWorkshop],
      );
    }

    await client.query("COMMIT");
    return newMentor;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in addMentor:", error);
    throw new Error(error.message || "Failed to add mentor.");
  } finally {
    client.release();
  }
};

// 3. Delete Mentor
export const deleteMentor = async (id) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
        "DELETE FROM mentor_project_assignments WHERE mentor_id = $1",
        [id],
    );
    await client.query(
        "DELETE FROM mentor_workshop_assignments WHERE mentor_id = $1",
        [id],
    );

    const res = await client.query(
        "DELETE FROM mentors WHERE id = $1 RETURNING id",
        [id],
    );

    if (res.rows.length === 0) {
      throw new Error("Mentor not found to delete.");
    }

    await client.query("COMMIT");
    return { success: true, id };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`Error in deleteMentor (${id}):`, error);
    throw new Error("Failed to delete mentor.");
  } finally {
    client.release();
  }
};

// 4. Update Mentor
export const updateMentor = async (id, data = {}) => {
  const { name, email, phone, expertise, status, password } = data || {};

  if (status && !VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const res = await client.query(
        `UPDATE mentors 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email), 
           phone = COALESCE($3, phone), 
           expertise = COALESCE($4, expertise), 
           status = COALESCE($5, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 
       RETURNING *`,
        [name, email, phone, expertise, status, id],
    );

    if (res.rows.length === 0) {
      throw new Error("Mentor not found to update.");
    }
    const updatedMentor = res.rows[0];

    // Sync changes to users table
    if (updatedMentor.email) {
      if (password && password.trim().length >= 6) {
        const hashed = await hashPassword(password.trim());
        await client.query(
            `UPDATE users 
           SET name = COALESCE($1, name), expertise = COALESCE($2, expertise), status = COALESCE($3, status), password = $4, updated_at = CURRENT_TIMESTAMP
           WHERE email = $5`,
            [name, expertise, status, hashed, updatedMentor.email]
        );
      } else {
        await client.query(
            `UPDATE users 
           SET name = COALESCE($1, name), expertise = COALESCE($2, expertise), status = COALESCE($3, status), updated_at = CURRENT_TIMESTAMP
           WHERE email = $4`,
            [name, expertise, status, updatedMentor.email]
        );
      }
    }

    await client.query("COMMIT");
    return updatedMentor;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`Error in updateMentor (${id}):`, error);
    throw new Error(error.message || "Failed to update mentor.");
  } finally {
    client.release();
  }
};
// 5. Get Mentor Totals (for stats cards — independent of pagination)
export const getMentorTotals = async () => {
  try {
    const res = await pool.query(`
      SELECT
        (SELECT COUNT(*)::integer FROM mentors) AS total,
        (SELECT COUNT(*)::integer FROM mentors WHERE status = 'active') AS active,
        (SELECT COUNT(*)::integer FROM mentor_project_assignments) AS assigned_projects,
        (SELECT COUNT(*)::integer FROM mentor_workshop_assignments) AS workshops_led
    `);
    return res.rows[0];
  } catch (error) {
    console.error("Error in getMentorTotals:", error);
    throw new Error("Failed to fetch mentor totals.");
  }
};