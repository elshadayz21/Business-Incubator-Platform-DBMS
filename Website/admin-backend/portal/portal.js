import pool from "../../config/db.js";

export const getEntrepreneurDashboard = async (userId, email) => {
  const [user, application, projects, cohorts, mentors, funding] =
    await Promise.all([
      pool.query(
        `SELECT id, name, email, user_code, role, profile_image, expertise, company, bio, status, created_at
         FROM users WHERE id = $1`,
        [userId],
      ),
      pool.query(
        `SELECT id, announcement_id, full_name, email, phone, status, startup_idea, created_at, updated_at
         FROM applications WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
        [email],
      ),
      pool.query(
        `SELECT p.id, p.name, p.domain, p.stage, p.status, p.created_at, pe.role_in_project
         FROM project_entrepreneurs pe
         JOIN projects p ON p.id = pe.project_id
         WHERE pe.user_id = $1
         ORDER BY p.created_at DESC`,
        [userId],
      ),
      pool.query(
        `SELECT c.id, c.name, c.type, c.status, c.start_date, c.end_date, cm.current_stage, cm.joined_at
         FROM cohort_members cm
         JOIN cohorts c ON c.id = cm.cohort_id
         WHERE cm.user_id = $1
         ORDER BY cm.joined_at DESC`,
        [userId],
      ),
      pool.query(
        `SELECT ma.id AS assignment_id, u.id AS mentor_id, u.name AS mentor_name,
                u.email AS mentor_email, u.expertise AS mentor_expertise,
                c.id AS cohort_id, c.name AS cohort_name, c.status AS cohort_status,
                ma.assigned_at
         FROM mentor_assignments ma
         JOIN users u ON u.id = ma.mentor_id
         JOIN cohorts c ON c.id = ma.cohort_id
         WHERE ma.entrepreneur_id = $1
         ORDER BY ma.assigned_at DESC`,
        [userId],
      ),
      pool.query(
        `SELECT fr.id, fr.project_id, p.name AS project_name, fr.amount, fr.status,
                fr.funding_stage, fr.description, fr.requested_at, fr.reviewed_at, fr.notes
         FROM funding_requests fr
         JOIN projects p ON p.id = fr.project_id
         JOIN project_entrepreneurs pe ON pe.project_id = fr.project_id
         WHERE pe.user_id = $1
         ORDER BY fr.requested_at DESC`,
        [userId],
      ),
    ]);

  const u = user.rows[0];

  const milestones = [];
  const seen = new Set();
  for (const cohort of cohorts.rows) {
    if (!seen.has(cohort.current_stage)) {
      seen.add(cohort.current_stage);
      milestones.push({
        source: "cohort",
        cohort_id: cohort.id,
        cohort_name: cohort.name,
        stage: cohort.current_stage,
        updated_at: cohort.joined_at,
      });
    }
  }
  for (const project of projects.rows) {
    if (!seen.has(project.stage)) {
      seen.add(project.stage);
      milestones.push({
        source: "project",
        project_id: project.id,
        project_name: project.name,
        stage: project.stage,
        updated_at: project.created_at,
      });
    }
  }

  return {
    user: u,
    application: application.rows[0] || null,
    projects: projects.rows,
    cohorts: cohorts.rows,
    mentors: mentors.rows,
    funding: funding.rows,
    milestones,
  };
};

export const getMentorDashboard = async (mentorId) => {
  const result = await pool.query(
    `SELECT ma.id AS assignment_id, ma.cohort_id,
            u.id AS entrepreneur_id, u.name AS entrepreneur_name,
            u.email AS entrepreneur_email, u.company AS entrepreneur_company,
            u.profile_image AS entrepreneur_profile_image,
            c.name AS cohort_name, c.status AS cohort_status,
            ma.assigned_at,
            (SELECT COUNT(*) FROM mentor_sessions ms WHERE ms.assignment_id = ma.id) AS session_count
     FROM mentor_assignments ma
     JOIN users u ON u.id = ma.entrepreneur_id
     JOIN cohorts c ON c.id = ma.cohort_id
     WHERE ma.mentor_id = $1
     ORDER BY ma.assigned_at DESC`,
    [mentorId],
  );
  return result.rows;
};

const getOwnedAssignment = async (mentorId, assignmentId) => {
  const result = await pool.query(
    `SELECT ma.id
     FROM mentor_assignments ma
     WHERE ma.id = $1 AND ma.mentor_id = $2`,
    [assignmentId, mentorId],
  );
  return result.rows[0];
};

export const getMentorAssignmentSessions = async (mentorId, assignmentId) => {
  const owned = await getOwnedAssignment(mentorId, assignmentId);
  if (!owned) return null;

  const result = await pool.query(
    `SELECT ms.*
     FROM mentor_sessions ms
     WHERE ms.assignment_id = $1
     ORDER BY ms.session_date DESC, ms.created_at DESC`,
    [assignmentId],
  );
  return result.rows;
};

export const createMentorSession = async (mentorId, data) => {
  const { assignment_id, session_date, notes, feedback } = data;
  const owned = await getOwnedAssignment(mentorId, assignment_id);
  if (!owned) return null;

  const result = await pool.query(
    `INSERT INTO mentor_sessions(assignment_id, session_date, notes, feedback)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [assignment_id, session_date, notes, feedback],
  );
  return result.rows[0];
};

export const deleteMentorSession = async (mentorId, sessionId) => {
  const result = await pool.query(
    `DELETE FROM mentor_sessions ms
     USING mentor_assignments ma
     WHERE ms.id = $1 AND ma.id = ms.assignment_id AND ma.mentor_id = $2
     RETURNING ms.id`,
    [sessionId, mentorId],
  );
  if (result.rows.length === 0) return null;
  return { success: true };
};
