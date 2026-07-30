import pool from "../../config/db.js";

const VALID_STATUSES = ["active", "inactive"];

// 1. Get All Mentors
export const getAllMentors = async () => {
  try {
    const res = await pool.query(`
      SELECT 
        m.*, 
        COUNT(DISTINCT mp.project_id) as projects_count,
        COUNT(DISTINCT mw.workshop_id) as workshops_count
      FROM mentors m
      LEFT JOIN mentor_project_assignments mp ON mp.mentor_id = m.id
      LEFT JOIN mentor_workshop_assignments mw ON mw.mentor_id = m.id
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `);

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

// 2. Add New Mentor
export const addMentor = async (data) => {
  const {
    name,
    email,
    phone,
    expertise,
    status,
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

    // A. Insert Mentor
    const insertRes = await client.query(
      `INSERT INTO mentors (name, email, phone, expertise, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, email, phone, expertise, status || "active"],
    );
    const newMentor = insertRes.rows[0];

    // B. Handle Quick Assignments
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
    throw new Error("Failed to add mentor.");
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
export const updateMentor = async (id, data) => {
  const { name, email, phone, expertise, status } = data;

  if (status && !VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  try {
    const res = await pool.query(
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
    return res.rows[0];
  } catch (error) {
    console.error(`Error in updateMentor (${id}):`, error);
    throw new Error("Failed to update mentor.");
  }
};

