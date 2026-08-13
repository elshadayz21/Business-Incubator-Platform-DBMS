import pool from "../../config/db.js";

// Cohort Members
export const getCohortMembers = async (cohortId) => {
  const result = await pool.query(
    `SELECT cm.*, u.name, u.email
     FROM cohort_members cm
     JOIN users u ON u.id = cm.user_id
     WHERE cm.cohort_id = $1
     ORDER BY cm.joined_at DESC`,
    [cohortId],
  );
  return result.rows;
};

export const addCohortMember = async ({
  cohort_id,
  user_id,
  current_stage,
}) => {
  const result = await pool.query(
    `INSERT INTO cohort_members(cohort_id, user_id, current_stage)
     VALUES ($1, $2, $3) RETURNING *`,
    [cohort_id, user_id, current_stage || "idea"],
  );
  return result.rows[0];
};

export const removeCohortMember = async (id) => {
  await pool.query(`DELETE FROM cohort_members WHERE id = $1`, [id]);
  return { success: true };
};

// Mentor Assignments
export const getMentorAssignments = async (cohortId) => {
  const result = await pool.query(
    `SELECT ma.*, m.name AS mentor_name, 
            e.name AS entrepreneur_name 
     FROM mentor_assignments ma
     JOIN users m ON m.id = ma.mentor_id
     JOIN users e ON e.id = ma.entrepreneur_id
     WHERE ma.cohort_id = $1
     ORDER BY ma.assigned_at DESC`,
    [cohortId],
  );
  return result.rows;
};

export const createMentorAssignment = async ({
  mentor_id,
  entrepreneur_id,
  cohort_id,
}) => {
  const result = await pool.query(
    `INSERT INTO mentor_assignments(mentor_id, entrepreneur_id, cohort_id)
     VALUES ($1, $2, $3) RETURNING *`,
    [mentor_id, entrepreneur_id, cohort_id],
  );
  return result.rows[0];
};

export const deleteMentorAssignment = async (id) => {
  await pool.query(`DELETE FROM mentor_assignments WHERE id = $1`, [id]);
  return { success: true };
};

// Mentor Sessions
export const getSessionsForAssignment = async (assignmentId) => {
  const result = await pool.query(
    `SELECT * FROM mentor_sessions WHERE assignment_id = $1 ORDER BY session_date DESC`,
    [assignmentId],
  );
  return result.rows;
};

export const createMentorSession = async ({
  assignment_id,
  session_date,
  notes,
  feedback,
}) => {
  const result = await pool.query(
    `INSERT INTO mentor_sessions(assignment_id, session_date, notes, feedback)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [assignment_id, session_date, notes, feedback],
  );
  return result.rows[0];
};

// For dropdowns: users by role
export const getUsersByRole = async (role) => {
  const result = await pool.query(
    `SELECT id, name, email FROM users WHERE role = $1 ORDER BY name`,
    [role],
  );
  return result.rows;
};
