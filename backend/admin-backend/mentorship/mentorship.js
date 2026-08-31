import pool from "../../config/db.js";
import eventBus from "../../utils/eventBus.js";

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

  eventBus.emit("cohort.member_added", { cohortId: cohort_id, userId: user_id });

  return result.rows[0];
};

export const removeCohortMember = async (id) => {
  const member = await pool.query(
    `SELECT cm.user_id, cm.cohort_id, c.name AS cohort_name
     FROM cohort_members cm
     JOIN cohorts c ON c.id = cm.cohort_id
     WHERE cm.id = $1`,
    [id],
  );
  await pool.query(`DELETE FROM cohort_members WHERE id = $1`, [id]);

  if (member.rows[0]) {
    eventBus.emit("cohort.member_removed", {
      cohortId: member.rows[0].cohort_id,
      cohortName: member.rows[0].cohort_name,
      userId: member.rows[0].user_id,
    });
  }

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

  eventBus.emit("mentor.assigned", {
    mentorId: mentor_id,
    entrepreneurId: entrepreneur_id,
    cohortId: cohort_id,
  });

  return result.rows[0];
};

export const deleteMentorAssignment = async (id) => {
  const assignment = await pool.query(
    `SELECT ma.mentor_id, ma.entrepreneur_id, ma.cohort_id,
            c.name AS cohort_name
     FROM mentor_assignments ma
     JOIN cohorts c ON c.id = ma.cohort_id
     WHERE ma.id = $1`,
    [id],
  );
  await pool.query(`DELETE FROM mentor_assignments WHERE id = $1`, [id]);

  if (assignment.rows[0]) {
    eventBus.emit("mentor.unassigned", {
      mentorId: assignment.rows[0].mentor_id,
      entrepreneurId: assignment.rows[0].entrepreneur_id,
      cohortId: assignment.rows[0].cohort_id,
      cohortName: assignment.rows[0].cohort_name,
    });
  }

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
