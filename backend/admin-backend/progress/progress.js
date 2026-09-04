import pool from "../../config/db.js";
import { createNotification } from "../../utils/notificationHelper.js";

/* ------------------------------------------------------------------ */
/*  Admin: Phases                                                     */
/* ------------------------------------------------------------------ */

// Returns every phase (optionally filtered to one cohort + the global/
// shared phases) with its tasks nested inside, plus a submission count per
// task so the admin view can show progress at a glance.
export const getAllPhases = async (cohortId) => {
  const phaseParams = [];
  let phaseWhere = "";
  if (cohortId) {
    phaseWhere = "WHERE p.cohort_id = $1 OR p.cohort_id IS NULL";
    phaseParams.push(cohortId);
  }

  const phasesRes = await pool.query(
    `SELECT p.id, p.cohort_id, p.name, p.description, p.order_index, p.status,
            p.created_at, p.updated_at, c.name AS cohort_name
     FROM progress_phases p
     LEFT JOIN cohorts c ON c.id = p.cohort_id
     ${phaseWhere}
     ORDER BY p.order_index ASC, p.created_at ASC`,
    phaseParams,
  );

  const phaseIds = phasesRes.rows.map((p) => p.id);
  let tasksByPhase = {};
  if (phaseIds.length > 0) {
    const tasksRes = await pool.query(
      `SELECT t.id, t.phase_id, t.title, t.description, t.order_index, t.due_date,
              t.created_at, t.updated_at,
              COUNT(s.id)::int AS submission_count,
              COUNT(s.id) FILTER (WHERE s.status = 'submitted')::int AS pending_review_count,
              COUNT(s.id) FILTER (WHERE s.status = 'approved')::int AS approved_count
       FROM progress_tasks t
       LEFT JOIN progress_submissions s ON s.task_id = t.id
       WHERE t.phase_id = ANY($1::int[])
       GROUP BY t.id
       ORDER BY t.order_index ASC, t.created_at ASC`,
      [phaseIds],
    );
    tasksByPhase = tasksRes.rows.reduce((acc, task) => {
      (acc[task.phase_id] = acc[task.phase_id] || []).push(task);
      return acc;
    }, {});
  }

  return phasesRes.rows.map((phase) => ({
    ...phase,
    tasks: tasksByPhase[phase.id] || [],
  }));
};

export const createPhase = async ({ cohort_id, name, description, order_index }) => {
  const result = await pool.query(
    `INSERT INTO progress_phases (cohort_id, name, description, order_index)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [cohort_id || null, name, description || null, order_index || 0],
  );
  return result.rows[0];
};

export const updatePhase = async (id, { cohort_id, name, description, order_index, status }) => {
  const result = await pool.query(
    `UPDATE progress_phases
     SET cohort_id = $1, name = $2, description = $3, order_index = $4,
         status = COALESCE($5, status), updated_at = NOW()
     WHERE id = $6 RETURNING *`,
    [cohort_id || null, name, description || null, order_index || 0, status || null, id],
  );
  return result.rows[0];
};

export const deletePhase = async (id) => {
  await pool.query(`DELETE FROM progress_phases WHERE id = $1`, [id]);
  return { success: true };
};

/* ------------------------------------------------------------------ */
/*  Admin: Tasks                                                      */
/* ------------------------------------------------------------------ */

export const createTask = async ({ phase_id, title, description, order_index, due_date }) => {
  const result = await pool.query(
    `INSERT INTO progress_tasks (phase_id, title, description, order_index, due_date)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [phase_id, title, description || null, order_index || 0, due_date || null],
  );
  return result.rows[0];
};

export const updateTask = async (id, { title, description, order_index, due_date }) => {
  const result = await pool.query(
    `UPDATE progress_tasks
     SET title = $1, description = $2, order_index = $3, due_date = $4, updated_at = NOW()
     WHERE id = $5 RETURNING *`,
    [title, description || null, order_index || 0, due_date || null, id],
  );
  return result.rows[0];
};

export const deleteTask = async (id) => {
  await pool.query(`DELETE FROM progress_tasks WHERE id = $1`, [id]);
  return { success: true };
};

// Overview stats for the admin tab header.
export const getProgressOverview = async () => {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM progress_phases) AS total_phases,
      (SELECT COUNT(*)::int FROM progress_tasks) AS total_tasks,
      (SELECT COUNT(*)::int FROM progress_submissions WHERE status = 'submitted') AS pending_reviews,
      (SELECT COUNT(*)::int FROM progress_submissions WHERE status = 'approved') AS approved_submissions
  `);
  return result.rows[0];
};

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                    */
/* ------------------------------------------------------------------ */

// An entrepreneur's "own" project — the first project they're listed on
// with a non-mentor role, mirroring the pattern used elsewhere in the
// portal (see admin-backend/projects/projects.js assignMentor).
export const getEntrepreneurProject = async (userId) => {
  const result = await pool.query(
    `SELECT p.id, p.name, p.domain, p.stage, p.status
     FROM project_entrepreneurs pe
     JOIN projects p ON p.id = pe.project_id
     WHERE pe.user_id = $1 AND (pe.role_in_project IS NULL OR LOWER(pe.role_in_project) != 'mentor')
     ORDER BY p.created_at ASC
     LIMIT 1`,
    [userId],
  );
  return result.rows[0] || null;
};

const getEntrepreneurCohortIds = async (userId) => {
  const result = await pool.query(
    `SELECT DISTINCT cohort_id FROM cohort_members WHERE user_id = $1
     UNION
     SELECT DISTINCT cohort_id FROM mentor_assignments WHERE entrepreneur_id = $1`,
    [userId],
  );
  return result.rows.map((r) => r.cohort_id).filter(Boolean);
};

/* ------------------------------------------------------------------ */
/*  Entrepreneur                                                      */
/* ------------------------------------------------------------------ */

// Phases + tasks visible to this entrepreneur (global phases plus any
// belonging to a cohort they're a member of), each task annotated with
// their project's latest submission (if any) so the UI can show status.
export const getEntrepreneurProgress = async (userId) => {
  const project = await getEntrepreneurProject(userId);
  const cohortIds = await getEntrepreneurCohortIds(userId);

  const phasesRes = await pool.query(
    `SELECT id, cohort_id, name, description, order_index
     FROM progress_phases
     WHERE status = 'active' AND (cohort_id IS NULL OR cohort_id = ANY($1::int[]))
     ORDER BY order_index ASC, created_at ASC`,
    [cohortIds],
  );

  const phaseIds = phasesRes.rows.map((p) => p.id);
  let tasksByPhase = {};
  if (phaseIds.length > 0 && project) {
    const tasksRes = await pool.query(
      `SELECT t.id, t.phase_id, t.title, t.description, t.order_index, t.due_date,
              latest.id AS submission_id, latest.status AS submission_status,
              latest.notes, latest.link_url, latest.file_path, latest.file_name,
              latest.title AS submission_title, latest.submitted_at,
              latest_review.feedback AS review_feedback, latest_review.status AS review_status,
              latest_review.reviewed_at
       FROM progress_tasks t
       LEFT JOIN LATERAL (
         SELECT * FROM progress_submissions s
         WHERE s.task_id = t.id AND s.project_id = $2
         ORDER BY s.submitted_at DESC LIMIT 1
       ) latest ON true
       LEFT JOIN LATERAL (
         SELECT * FROM progress_reviews r
         WHERE r.submission_id = latest.id
         ORDER BY r.reviewed_at DESC LIMIT 1
       ) latest_review ON true
       WHERE t.phase_id = ANY($1::int[])
       ORDER BY t.order_index ASC, t.created_at ASC`,
      [phaseIds, project.id],
    );
    tasksByPhase = tasksRes.rows.reduce((acc, task) => {
      (acc[task.phase_id] = acc[task.phase_id] || []).push(task);
      return acc;
    }, {});
  } else if (phaseIds.length > 0) {
    // No project yet — still show the tasks, just with no submission data.
    const tasksRes = await pool.query(
      `SELECT id, phase_id, title, description, order_index, due_date
       FROM progress_tasks WHERE phase_id = ANY($1::int[])
       ORDER BY order_index ASC, created_at ASC`,
      [phaseIds],
    );
    tasksByPhase = tasksRes.rows.reduce((acc, task) => {
      (acc[task.phase_id] = acc[task.phase_id] || []).push(task);
      return acc;
    }, {});
  }

  return {
    project,
    phases: phasesRes.rows.map((phase) => ({
      ...phase,
      tasks: tasksByPhase[phase.id] || [],
    })),
  };
};

// Who to notify when work is submitted: mentors assigned to this project.
const getProjectMentorUserIds = async (projectId) => {
  const result = await pool.query(
    `SELECT user_id FROM project_entrepreneurs
     WHERE project_id = $1 AND LOWER(role_in_project) = 'mentor'`,
    [projectId],
  );
  return result.rows.map((r) => r.user_id);
};

export const submitWork = async (
  userId,
  { task_id, title, notes, link_url, file_path, file_name },
) => {
  const project = await getEntrepreneurProject(userId);
  if (!project) {
    const err = new Error("You don't have a project yet, so there's nothing to submit work against.");
    err.statusCode = 400;
    throw err;
  }

  const taskRes = await pool.query(
    `SELECT t.*, p.name AS phase_name FROM progress_tasks t
     JOIN progress_phases p ON p.id = t.phase_id WHERE t.id = $1`,
    [task_id],
  );
  const task = taskRes.rows[0];
  if (!task) {
    const err = new Error("Task not found.");
    err.statusCode = 404;
    throw err;
  }

  const result = await pool.query(
    `INSERT INTO progress_submissions
       (task_id, project_id, submitted_by, title, notes, link_url, file_path, file_name, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'submitted')
     RETURNING *`,
    [task_id, project.id, userId, title || task.title, notes || null, link_url || null, file_path || null, file_name || null],
  );

  const mentorIds = await getProjectMentorUserIds(project.id);
  await Promise.all(
    mentorIds.map((mentorId) =>
      createNotification(
        mentorId,
        "progress_submission",
        `${project.name} submitted work for "${task.title}" (${task.phase_name}). Please review it.`,
        { projectId: project.id, taskId: task.id, submissionId: result.rows[0].id },
        `/admin/mentor?openTab=Progress`,
      ),
    ),
  );

  return result.rows[0];
};

export const getSubmissionHistory = async (userId, taskId) => {
  const project = await getEntrepreneurProject(userId);
  if (!project) return [];
  const result = await pool.query(
    `SELECT s.*, u.name AS submitted_by_name
     FROM progress_submissions s
     LEFT JOIN users u ON u.id = s.submitted_by
     WHERE s.task_id = $1 AND s.project_id = $2
     ORDER BY s.submitted_at DESC`,
    [taskId, project.id],
  );
  return result.rows;
};

/* ------------------------------------------------------------------ */
/*  Mentor                                                            */
/* ------------------------------------------------------------------ */

// Every project this mentor can review, across all three ways a mentor can
// end up linked to a project in this codebase (direct project assignment,
// cohort-based mentor_assignments, and the legacy mentor_project_assignments
// table) — mirrors the union already used for the mentor dashboard.
const getMentorProjectIds = async (mentorUserId) => {
  const result = await pool.query(
    `SELECT DISTINCT p.id FROM (
       SELECT pe_mentor.project_id AS project_id
       FROM project_entrepreneurs pe_mentor
       WHERE pe_mentor.user_id = $1 AND LOWER(pe_mentor.role_in_project) = 'mentor'

       UNION

       SELECT pe_owner.project_id AS project_id
       FROM mentor_assignments ma
       JOIN project_entrepreneurs pe_owner
         ON pe_owner.user_id = ma.entrepreneur_id
        AND (pe_owner.role_in_project IS NULL OR LOWER(pe_owner.role_in_project) != 'mentor')
       WHERE ma.mentor_id = $1

       UNION

       SELECT mpa.project_id AS project_id
       FROM mentor_project_assignments mpa
       JOIN mentors m ON m.id = mpa.mentor_id
       LEFT JOIN users mu ON mu.id = m.user_id OR LOWER(mu.email) = LOWER(m.email)
       WHERE mu.id = $1
     ) combined
     JOIN projects p ON p.id = combined.project_id`,
    [mentorUserId],
  );
  return result.rows.map((r) => r.id);
};

// Submissions across every mentee project, most recent first, each with its
// latest review (if any) and phase/task context. `status=submitted` filters
// to only what's still awaiting review.
export const getSubmissionsForMentor = async (mentorUserId, statusFilter) => {
  const projectIds = await getMentorProjectIds(mentorUserId);
  if (projectIds.length === 0) return [];

  const params = [projectIds];
  let statusClause = "";
  if (statusFilter && statusFilter !== "all") {
    statusClause = "AND s.status = $2";
    params.push(statusFilter);
  }

  const result = await pool.query(
    `SELECT s.id, s.task_id, s.project_id, s.title, s.notes, s.link_url, s.file_path,
            s.file_name, s.status, s.submitted_at,
            t.title AS task_title, t.description AS task_description, t.due_date,
            ph.id AS phase_id, ph.name AS phase_name,
            p.name AS project_name,
            u.id AS submitted_by_id, u.name AS submitted_by_name,
            latest_review.feedback AS review_feedback, latest_review.status AS review_status,
            latest_review.reviewed_at, reviewer.name AS reviewer_name
     FROM progress_submissions s
     JOIN progress_tasks t ON t.id = s.task_id
     JOIN progress_phases ph ON ph.id = t.phase_id
     JOIN projects p ON p.id = s.project_id
     LEFT JOIN users u ON u.id = s.submitted_by
     LEFT JOIN LATERAL (
       SELECT * FROM progress_reviews r WHERE r.submission_id = s.id
       ORDER BY r.reviewed_at DESC LIMIT 1
     ) latest_review ON true
     LEFT JOIN users reviewer ON reviewer.id = latest_review.mentor_id
     WHERE s.project_id = ANY($1::int[]) ${statusClause}
     ORDER BY s.submitted_at DESC`,
    params,
  );
  return result.rows;
};

export const reviewSubmission = async (mentorUserId, submissionId, { status, feedback }) => {
  if (!["approved", "changes_requested", "rejected"].includes(status)) {
    const err = new Error("Invalid review status.");
    err.statusCode = 400;
    throw err;
  }

  const projectIds = await getMentorProjectIds(mentorUserId);
  const subRes = await pool.query(
    `SELECT s.*, t.title AS task_title FROM progress_submissions s
     JOIN progress_tasks t ON t.id = s.task_id WHERE s.id = $1`,
    [submissionId],
  );
  const submission = subRes.rows[0];
  if (!submission) {
    const err = new Error("Submission not found.");
    err.statusCode = 404;
    throw err;
  }
  if (!projectIds.includes(submission.project_id)) {
    const err = new Error("You're not assigned to this project.");
    err.statusCode = 403;
    throw err;
  }

  const reviewRes = await pool.query(
    `INSERT INTO progress_reviews (submission_id, mentor_id, status, feedback)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [submissionId, mentorUserId, status, feedback || null],
  );

  await pool.query(`UPDATE progress_submissions SET status = $1, updated_at = NOW() WHERE id = $2`, [
    status,
    submissionId,
  ]);

  const ownerRes = await pool.query(
    `SELECT pe.user_id, p.name AS project_name FROM project_entrepreneurs pe
     JOIN projects p ON p.id = pe.project_id
     WHERE pe.project_id = $1 AND (pe.role_in_project IS NULL OR LOWER(pe.role_in_project) != 'mentor')
     LIMIT 1`,
    [submission.project_id],
  );
  const owner = ownerRes.rows[0];
  if (owner) {
    const statusLabel =
      status === "approved" ? "approved" : status === "rejected" ? "rejected" : "sent back for changes";
    await createNotification(
      owner.user_id,
      "progress_review",
      `Your submission for "${submission.task_title}" was ${statusLabel} by your mentor.`,
      { projectId: submission.project_id, taskId: submission.task_id, submissionId },
      `/admin/entrepreneur?openTab=Progress`,
    );
  }

  return reviewRes.rows[0];
};
