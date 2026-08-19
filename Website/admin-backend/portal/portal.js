import pool from "../../config/db.js";

export const markNotificationsAsRead = async (userId) => {
  await pool.query(
    `UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`,
    [userId]
  );
};

const safeQuery = async (label, queryFn) => {
  try {
    const result = await queryFn();
    return { ok: true, data: result.rows };
  } catch (err) {
    console.error(`[Portal] Query failed (${label}):`, err.message);
    return { ok: false, data: [], error: err.message };
  }
};

export const getEntrepreneurDashboard = async (userId, email) => {
  const [userRes, applicationRes, projectsRes, cohortsRes, mentorsRes, fundingRes, workshopsRes, notificationsRes, activityLogsRes, statsRes] =
    await Promise.all([
      safeQuery("user", () =>
        pool.query(
          `SELECT id, name, email, user_code, role, profile_image, expertise, company, bio, status, created_at
           FROM users WHERE id = $1`,
          [userId],
        ),
      ),
      safeQuery("application", () =>
        pool.query(
          `SELECT id, announcement_id, full_name, email, phone, status, startup_idea, created_at, updated_at
           FROM applications WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
          [email],
        ),
      ),
      safeQuery("projects", () =>
        pool.query(
          `SELECT p.id, p.name, p.domain, p.stage, p.status, p.created_at, pe.role_in_project
           FROM project_entrepreneurs pe
           JOIN projects p ON p.id = pe.project_id
           WHERE pe.user_id = $1
           ORDER BY p.created_at DESC`,
          [userId],
        ),
      ),
      safeQuery("cohorts", () =>
        pool.query(
          `SELECT c.id, c.name, c.type, c.status, c.start_date, c.end_date, cm.current_stage, cm.joined_at
           FROM cohort_members cm
           JOIN cohorts c ON c.id = cm.cohort_id
           WHERE cm.user_id = $1
           ORDER BY cm.joined_at DESC`,
          [userId],
        ),
      ),
      safeQuery("mentors", () =>
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
      ),
      safeQuery("funding", () =>
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
      ),
      safeQuery("workshops", () =>
        pool.query(
          `SELECT w.id, w.title, w.schedule, w.capacity, w.category, w.created_at,
                  we.enrollment_date, we.attended
           FROM workshops w
           JOIN workshop_enrollments we ON w.id = we.workshop_id
           WHERE we.entrepreneur_id = $1
           ORDER BY w.schedule DESC`,
          [userId],
        ),
      ),
      safeQuery("notifications", () =>
        pool.query(
          `SELECT id, type, message, read, created_at
           FROM notifications
           WHERE user_id = $1
           ORDER BY created_at DESC`,
          [userId],
        ),
      ),
      safeQuery("activityLogs", () =>
        pool.query(
          `SELECT id, action_type, details, created_at
           FROM activity_logs
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT 50`,
          [userId],
        ),
      ),
      safeQuery("stats", () =>
        pool.query(
          `SELECT 'total_users' AS metric_key, COUNT(*)::int AS metric_value, NOW() AS updated_at FROM users
           UNION ALL
           SELECT 'total_projects', COUNT(*)::int, NOW() FROM projects
           UNION ALL
           SELECT 'total_workshops', COUNT(*)::int, NOW() FROM workshops
           UNION ALL
           SELECT 'total_funding_requested', COUNT(*)::int, NOW() FROM funding_requests
           UNION ALL
           SELECT 'total_funding_approved', COUNT(*)::int, NOW() FROM funding_requests WHERE LOWER(status) = 'approved'
           ORDER BY metric_key ASC`,
        ),
      ),
    ]);

  const u = userRes.ok ? userRes.data[0] : null;

  if (!u) {
    console.error(`[Portal] User not found for userId=${userId}, email=${email}`);
  }

  const cohortsData = cohortsRes.ok ? cohortsRes.data : [];
  const projectsData = projectsRes.ok ? projectsRes.data : [];

  const milestones = [];
  const seen = new Set();
  for (const cohort of cohortsData) {
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
  for (const project of projectsData) {
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
    application: applicationRes.ok ? applicationRes.data[0] || null : null,
    projects: projectsData,
    cohorts: cohortsData,
    mentors: mentorsRes.ok ? mentorsRes.data : [],
    funding: fundingRes.ok ? fundingRes.data : [],
    milestones,
    workshops: workshopsRes.ok ? workshopsRes.data : [],
    notifications: notificationsRes.ok ? notificationsRes.data : [],
    activityLogs: activityLogsRes.ok ? activityLogsRes.data : [],
    stats: statsRes.ok ? statsRes.data : [],
  };
};

export const getMentorDashboard = async (mentorId) => {
  const [assignmentsRes, notificationsRes, activityLogsRes] = await Promise.all([
    safeQuery("mentor-assignments", () =>
      pool.query(
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
      ),
    ),
    safeQuery("notifications", () =>
      pool.query(
        `SELECT id, type, message, read, created_at
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [mentorId],
      ),
    ),
    safeQuery("activityLogs", () =>
      pool.query(
        `SELECT id, action_type, details, created_at
         FROM activity_logs
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [mentorId],
      ),
    ),
  ]);

  return {
    assignments: assignmentsRes.ok ? assignmentsRes.data : [],
    notifications: notificationsRes.ok ? notificationsRes.data : [],
    activityLogs: activityLogsRes.ok ? activityLogsRes.data : [],
  };
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
