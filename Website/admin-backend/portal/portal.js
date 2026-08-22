import pool from "../../config/db.js";
import { createNotification } from "../../utils/notificationHelper.js";

export const getEntrepreneurDashboard = async (userId, email) => {
  const [userRes, applicationRes, projectsRes, cohortsRes, mentorsRes, fundingRes, workshopsRes, notificationsRes, activityLogsRes, statsRes, mentorSessionsRes] =
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
          `SELECT DISTINCT c.id, c.name, c.type, c.status, c.start_date, c.end_date,
                 COALESCE(cm.current_stage, 'incubation') AS current_stage,
                 COALESCE(cm.joined_at, ma.assigned_at) AS joined_at
           FROM cohorts c
           LEFT JOIN cohort_members cm ON cm.cohort_id = c.id AND cm.user_id = $1
           LEFT JOIN mentor_assignments ma ON ma.cohort_id = c.id AND ma.entrepreneur_id = $1
           WHERE cm.user_id = $1 OR ma.entrepreneur_id = $1
           ORDER BY joined_at DESC`,
          [userId],
        ),
      ),
      safeQuery("mentors", () =>
        pool.query(
          `SELECT * FROM (
            SELECT 
              'cohort' AS assignment_type,
              ma.id AS assignment_id, 
              u.id AS mentor_id, 
              u.name AS mentor_name,
              u.email AS mentor_email, 
              u.expertise AS mentor_expertise,
              c.id AS cohort_id, 
              c.name AS cohort_name, 
              c.status AS cohort_status,
              NULL::int AS project_id,
              NULL::varchar AS project_name,
              ma.assigned_at
            FROM mentor_assignments ma
            JOIN users u ON u.id = ma.mentor_id
            JOIN cohorts c ON c.id = ma.cohort_id
            WHERE ma.entrepreneur_id = $1

            UNION ALL

            SELECT 
              'project' AS assignment_type,
              pe_mentor.project_id AS assignment_id, 
              u.id AS mentor_id, 
              u.name AS mentor_name,
              u.email AS mentor_email, 
              u.expertise AS mentor_expertise,
              NULL::int AS cohort_id, 
              NULL::varchar AS cohort_name, 
              NULL::varchar AS cohort_status,
              p.id AS project_id,
              p.name AS project_name,
              p.created_at AS assigned_at
            FROM project_entrepreneurs pe_owner
            JOIN projects p ON p.id = pe_owner.project_id
            JOIN project_entrepreneurs pe_mentor ON pe_mentor.project_id = p.id AND LOWER(pe_mentor.role_in_project) = 'mentor'
            JOIN users u ON u.id = pe_mentor.user_id
            WHERE pe_owner.user_id = $1 AND (pe_owner.role_in_project IS NULL OR LOWER(pe_owner.role_in_project) != 'mentor')

            UNION ALL

            SELECT 
              'project' AS assignment_type,
              mpa.id AS assignment_id, 
              COALESCE(u.id, m.id) AS mentor_id, 
              COALESCE(u.name, m.name) AS mentor_name,
              COALESCE(u.email, m.email) AS mentor_email, 
              COALESCE(u.expertise, m.expertise) AS mentor_expertise,
              NULL::int AS cohort_id, 
              NULL::varchar AS cohort_name, 
              NULL::varchar AS cohort_status,
              p.id AS project_id,
              p.name AS project_name,
              mpa.assigned_at
            FROM project_entrepreneurs pe_owner
            JOIN projects p ON p.id = pe_owner.project_id
            JOIN mentor_project_assignments mpa ON mpa.project_id = p.id
            JOIN mentors m ON m.id = mpa.mentor_id
            LEFT JOIN users u ON u.id = m.user_id OR LOWER(u.email) = LOWER(m.email)
            WHERE pe_owner.user_id = $1 AND (pe_owner.role_in_project IS NULL OR LOWER(pe_owner.role_in_project) != 'mentor')
          ) combined_mentors
          ORDER BY assigned_at DESC`,
          [userId],
        ),
      ),
      safeQuery("funding", () =>
        pool.query(
          `SELECT fr.id, fr.project_id, p.name AS project_name, fr.amount, fr.approved_amount, fr.founder_action, fr.status,
                  fr.funding_stage, fr.description, fr.requested_at, fr.reviewed_at, fr.notes
           FROM funding_requests fr
           JOIN projects p ON p.id = fr.project_id
           JOIN project_entrepreneurs pe ON pe.project_id = fr.project_id
           WHERE pe.user_id = $1
           ORDER BY fr.requested_at DESC`,
          [userId],
        ),
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
      safeQuery("mentorSessions", () =>
        pool.query(
          `SELECT ms.id, ms.assignment_id, ms.session_date, ms.notes, ms.feedback, ms.entrepreneur_reply, ms.reply_at, ms.mentor_response, ms.mentor_response_at, ms.created_at,
                  u.name AS mentor_name, u.email AS mentor_email
           FROM mentor_sessions ms
           JOIN mentor_assignments ma ON ma.id = ms.assignment_id
           JOIN users u ON u.id = ma.mentor_id
           WHERE ma.entrepreneur_id = $1
           ORDER BY ms.session_date DESC, ms.created_at DESC`,
          [userId],
        ),
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
    application: applicationRes.ok ? applicationRes.data[0] || null : null,
    projects: projectsData,
    cohorts: cohortsData,
    mentors: mentorsRes.ok ? mentorsRes.data : [],
    mentorSessions: mentorSessionsRes.ok ? mentorSessionsRes.data : [],
    funding: fundingRes.ok ? fundingRes.data : [],
    milestones,
  };
};

export const getMentorDashboard = async (mentorId) => {
  const [assignmentsRes, notificationsRes, activityLogsRes] = await Promise.all([
    safeQuery("mentor-assignments", () =>
      pool.query(
        `SELECT * FROM (
          SELECT 
            'cohort' AS assignment_type,
            ma.id AS assignment_id, 
            ma.cohort_id,
            u.id AS entrepreneur_id, 
            u.name AS entrepreneur_name,
            u.email AS entrepreneur_email, 
            u.company AS entrepreneur_company,
            u.profile_image AS entrepreneur_profile_image,
            c.name AS cohort_name, 
            c.status AS cohort_status,
            NULL::int AS project_id,
            NULL::varchar AS project_name,
            ma.assigned_at,
            (SELECT COUNT(*)::int FROM mentor_sessions ms WHERE ms.assignment_id = ma.id) AS session_count
          FROM mentor_assignments ma
          JOIN users u ON u.id = ma.entrepreneur_id
          JOIN cohorts c ON c.id = ma.cohort_id
          WHERE ma.mentor_id = $1

          UNION ALL

          SELECT 
            'project' AS assignment_type,
            pe_mentor.project_id AS assignment_id,
            NULL::int AS cohort_id,
            u.id AS entrepreneur_id,
            u.name AS entrepreneur_name,
            u.email AS entrepreneur_email,
            u.company AS entrepreneur_company,
            u.profile_image AS entrepreneur_profile_image,
            NULL::varchar AS cohort_name,
            NULL::varchar AS cohort_status,
            p.id AS project_id,
            p.name AS project_name,
            p.created_at AS assigned_at,
            0 AS session_count
          FROM project_entrepreneurs pe_mentor
          JOIN projects p ON p.id = pe_mentor.project_id
          JOIN project_entrepreneurs pe_owner ON pe_owner.project_id = p.id AND (pe_owner.role_in_project IS NULL OR LOWER(pe_owner.role_in_project) != 'mentor')
          JOIN users u ON u.id = pe_owner.user_id
          WHERE pe_mentor.user_id = $1 AND LOWER(pe_mentor.role_in_project) = 'mentor'

          UNION ALL

          SELECT 
            'project' AS assignment_type,
            mpa.id AS assignment_id,
            NULL::int AS cohort_id,
            u.id AS entrepreneur_id,
            u.name AS entrepreneur_name,
            u.email AS entrepreneur_email,
            u.company AS entrepreneur_company,
            u.profile_image AS entrepreneur_profile_image,
            NULL::varchar AS cohort_name,
            NULL::varchar AS cohort_status,
            p.id AS project_id,
            p.name AS project_name,
            mpa.assigned_at,
            0 AS session_count
          FROM mentor_project_assignments mpa
          JOIN mentors m ON m.id = mpa.mentor_id
          JOIN projects p ON p.id = mpa.project_id
          JOIN project_entrepreneurs pe_owner ON pe_owner.project_id = p.id AND (pe_owner.role_in_project IS NULL OR LOWER(pe_owner.role_in_project) != 'mentor')
          JOIN users u ON u.id = pe_owner.user_id
          LEFT JOIN users mu ON mu.id = m.user_id OR LOWER(mu.email) = LOWER(m.email)
          WHERE mu.id = $1
        ) combined_assignments
        ORDER BY assigned_at DESC`,
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
  const maRes = await pool.query(
    `SELECT ma.id
     FROM mentor_assignments ma
     WHERE ma.id = $1 AND ma.mentor_id = $2`,
    [assignmentId, mentorId],
  );
  if (maRes.rows.length > 0) return maRes.rows[0];

  const peRes = await pool.query(
    `SELECT pe_mentor.user_id AS mentor_id, pe_owner.user_id AS entrepreneur_id
     FROM project_entrepreneurs pe_mentor
     JOIN project_entrepreneurs pe_owner 
       ON pe_owner.project_id = pe_mentor.project_id 
       AND (pe_owner.role_in_project IS NULL OR LOWER(pe_owner.role_in_project) != 'mentor')
     WHERE pe_mentor.project_id = $1 AND pe_mentor.user_id = $2 AND LOWER(pe_mentor.role_in_project) = 'mentor'`,
    [assignmentId, mentorId],
  );
  if (peRes.rows.length > 0) {
    const { mentor_id, entrepreneur_id } = peRes.rows[0];
    let cmRes = await pool.query(`SELECT cohort_id FROM cohort_members WHERE user_id = $1 LIMIT 1`, [entrepreneur_id]);
    let cohortId = cmRes.rows[0]?.cohort_id;
    if (!cohortId) {
      const anyCohort = await pool.query("SELECT id FROM cohorts ORDER BY created_at DESC LIMIT 1");
      cohortId = anyCohort.rows[0]?.id;
    }
    if (cohortId) {
      const insRes = await pool.query(
        `INSERT INTO mentor_assignments (mentor_id, entrepreneur_id, cohort_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (mentor_id, entrepreneur_id, cohort_id) DO UPDATE SET mentor_id = EXCLUDED.mentor_id
         RETURNING id`,
        [mentor_id, entrepreneur_id, cohortId]
      );
      return insRes.rows[0];
    }
  }

  return null;
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

export const replyToMentorSession = async (entrepreneurUserId, sessionId, replyText) => {
  if (!replyText || !replyText.trim()) {
    const err = new Error("Reply text cannot be empty.");
    err.statusCode = 400;
    throw err;
  }

  const checkRes = await pool.query(
    `SELECT ms.id, ms.session_date, ma.mentor_id, u.name AS entrepreneur_name
     FROM mentor_sessions ms
     JOIN mentor_assignments ma ON ma.id = ms.assignment_id
     JOIN users u ON u.id = ma.entrepreneur_id
     WHERE ms.id = $1 AND ma.entrepreneur_id = $2`,
    [sessionId, entrepreneurUserId]
  );

  if (checkRes.rows.length === 0) {
    const err = new Error("Session not found or access denied.");
    err.statusCode = 403;
    throw err;
  }

  const { mentor_id, entrepreneur_name, session_date } = checkRes.rows[0];

  const updateRes = await pool.query(
    `UPDATE mentor_sessions
     SET entrepreneur_reply = $1, reply_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [replyText.trim(), sessionId]
  );

  const formattedDate = new Date(session_date).toLocaleDateString();
  const truncatedReply = replyText.trim().slice(0, 60) + (replyText.trim().length > 60 ? "..." : "");

  await createNotification(
    mentor_id,
    "mentor_session_reply",
    `${entrepreneur_name} replied to your feedback for session on ${formattedDate}: "${truncatedReply}"`,
    { sessionId, entrepreneurUserId },
    `/v1/auth/profile?tab=mentorship`
  ).catch((e) => console.error("Error creating notification for mentor:", e));

  return updateRes.rows[0];
};

export const mentorReplyToEntrepreneurSession = async (mentorUserId, sessionId, responseText) => {
  if (!responseText || !responseText.trim()) {
    const err = new Error("Response text cannot be empty.");
    err.statusCode = 400;
    throw err;
  }

  const checkRes = await pool.query(
    `SELECT ms.id, ms.session_date, ma.entrepreneur_id, u.name AS mentor_name
     FROM mentor_sessions ms
     JOIN mentor_assignments ma ON ma.id = ms.assignment_id
     JOIN users u ON u.id = ma.mentor_id
     WHERE ms.id = $1 AND ma.mentor_id = $2`,
    [sessionId, mentorUserId]
  );

  if (checkRes.rows.length === 0) {
    const err = new Error("Session not found or access denied.");
    err.statusCode = 403;
    throw err;
  }

  const { entrepreneur_id, mentor_name, session_date } = checkRes.rows[0];

  const updateRes = await pool.query(
    `UPDATE mentor_sessions
     SET mentor_response = $1, mentor_response_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [responseText.trim(), sessionId]
  );

  const formattedDate = new Date(session_date).toLocaleDateString();
  const truncatedResp = responseText.trim().slice(0, 60) + (responseText.trim().length > 60 ? "..." : "");

  await createNotification(
    entrepreneur_id,
    "mentor_session_response",
    `${mentor_name} responded to your reply for session on ${formattedDate}: "${truncatedResp}"`,
    { sessionId, mentorUserId },
    `/v1/auth/profile?tab=mentorship`
  ).catch((e) => console.error("Error creating notification for entrepreneur:", e));

  return updateRes.rows[0];
};
