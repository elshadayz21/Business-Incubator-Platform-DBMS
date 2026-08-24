import pool from "../../config/db.js";
import eventBus from "../../utils/eventBus.js";
import { createNotification } from "../../utils/notificationHelper.js";

// Get All Projects
export const getAllProjects = async () => {
  const res = await pool.query(`
    SELECT p.*
    FROM projects p
    ORDER BY p.created_at DESC
  `);
  return res.rows;
};

// Get One Project by ID
export const getProjectById = async (id) => {
  const res = await pool.query("SELECT * FROM projects WHERE id = $1", [id]);
  return res.rows[0];
};

// Update Project Status
export const updateProjectStatus = async (id, status) => {
  const normalized = (status || "").toLowerCase().trim();
  // Keep `stage` in sync for pipeline statuses so stage filters/stats stay consistent.
  const pipelineStages = ["idea", "in-progress", "completed"];
  const syncStage = pipelineStages.includes(normalized) ? normalized : null;

  const res = await pool.query(
    `UPDATE projects
     SET status = $1,
         stage = COALESCE($2, stage),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [normalized, syncStage, id],
  );
  const project = res.rows[0];

  if (project) {
    const entrepreneurs = await pool.query(
      "SELECT user_id FROM project_entrepreneurs WHERE project_id = $1",
      [id]
    );
    for (const row of entrepreneurs.rows) {
      eventBus.emit("project.status_changed", {
        projectId: id,
        projectName: project.name,
        status,
        userId: row.user_id,
      });
    }

    const ownerRes = await pool.query(
      "SELECT user_id FROM project_entrepreneurs WHERE project_id = $1 AND (role_in_project IS NULL OR role_in_project != 'Mentor') LIMIT 1",
      [project.id]
    );

    const userId = ownerRes.rows[0]?.user_id;

    if (userId) {
      const message =
        status === "approved"
          ? `Great news! Your project "${project.name}" has been approved.`
          : `Update: Your project "${project.name}" status was updated to ${status}.`;

      await createNotification(
        userId,
        "project_status",
        message,
        { projectId: project.id },
        `/v1/auth/profile?tab=projects`
      );
    }
  }

  return project;
};

// Get Projects by Status
export const getProjectsByStatus = async (status) => {
  const res = await pool.query(
    "SELECT * FROM projects WHERE status = $1 ORDER BY created_at DESC",
    [status],
  );
  return res.rows;
};

// Toggle Project Approved Status
export const toggleProjectApproved = async (id) => {
  const res = await pool.query(
    `UPDATE projects
     SET approved = NOT approved,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *;`,
    [id],
  );

  const project = res.rows[0];
  if (!project) return null;

  const entrepreneurs = await pool.query(
    "SELECT user_id FROM project_entrepreneurs WHERE project_id = $1",
    [id]
  );
  for (const row of entrepreneurs.rows) {
    eventBus.emit("project.approval_toggled", {
      projectId: id,
      projectName: project.name,
      approved: project.approved,
      userId: row.user_id,
    });
  }

  // Find the project owner
  const ownerRes = await pool.query(
    "SELECT user_id FROM project_entrepreneurs WHERE project_id = $1 AND (role_in_project IS NULL OR role_in_project != 'Mentor') LIMIT 1",
    [project.id]
  );

  const userId = ownerRes.rows[0]?.user_id;

  if (userId) {
    if (project.approved) {
      await createNotification(
        userId,
        "project_status",
        `Great news! Your project "${project.name}" has been approved.`,
        { projectId: project.id },
        `/v1/auth/profile?tab=projects`
      );
    } else {
      await createNotification(
        userId,
        "project_status",
        `Update: Your project "${project.name}" status has been toggled off. Please review feedback.`,
        { projectId: project.id },
        `/v1/auth/profile?tab=projects`
      );
    }
  }

  return project;
};

// Get Projects Statistics
// Counts by the pipeline stage (falling back to status) with legacy value
// mapping, so the four cards always add up to the total.
export const getProjectsStats = async () => {
  const res = await pool.query(`
    WITH pipeline AS (
      SELECT CASE
        WHEN LOWER(TRIM(COALESCE(NULLIF(TRIM(stage), ''), status))) IN ('completed', 'scale-up', 'scaleup', 'scale up')
          THEN 'completed'
        WHEN LOWER(TRIM(COALESCE(NULLIF(TRIM(stage), ''), status))) IN ('in-progress', 'in progress', 'inprogress', 'mvp')
          THEN 'in-progress'
        WHEN LOWER(TRIM(COALESCE(NULLIF(TRIM(stage), ''), status))) = 'idea'
          THEN 'idea'
        -- Anything unrecognized (e.g. legacy 'Pending'/'Approved' review states)
        -- still belongs to a card: treat it as active work in the incubator.
        ELSE 'in-progress'
      END AS stage_norm
      FROM projects
    )
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE stage_norm = 'idea') AS idea,
      COUNT(*) FILTER (WHERE stage_norm = 'in-progress') AS in_progress,
      COUNT(*) FILTER (WHERE stage_norm = 'completed') AS completed
    FROM pipeline
  `);
  return res.rows[0];
};

// --- AI SUGGESTED MENTORS LOGIC ---
const calculateScore = (domain, expertise) => {
  if (!domain || !expertise) return Math.random() * 15 + 5;

  const d = domain.toLowerCase();
  const e = expertise.toLowerCase();

  if (d === e) return 98;

  const dWords = d.split(/[\s,]+/);
  const eWords = e.split(/[\s,]+/);
  let matchCount = 0;

  dWords.forEach((dw) => {
    eWords.forEach((ew) => {
      if (dw.length > 2 && ew.length > 2 && (dw.includes(ew) || ew.includes(dw))) {
        matchCount++;
      }
    });
  });

  if (matchCount > 0) {
    return 70 + matchCount * 10;
  }

  const dChars = new Set(d.replace(/[^a-z]/g, "").split(""));
  const eChars = new Set(e.replace(/[^a-z]/g, "").split(""));
  let charMatch = 0;

  dChars.forEach((c) => {
    if (eChars.has(c)) charMatch++;
  });

  const score = (charMatch / (dChars.size + eChars.size)) * 100;
  return Math.max(5, Math.min(score, 60));
};

export const getSuggestedMentors = async (projectId) => {
  try {
    const projectRes = await pool.query("SELECT domain FROM projects WHERE id = $1", [projectId]);
    if (projectRes.rows.length === 0) return { success: false, message: "Project not found" };

    const domain = projectRes.rows[0].domain || "General";

    const mentorsRes = await pool.query(
      `SELECT id, name, expertise, email, profile_image 
       FROM users 
       WHERE role = 'mentor' 
       AND status = 'active'`
    );

    if (mentorsRes.rows.length === 0) {
      return { success: true, mentors: [], message: "No active mentors found in the system." };
    }

    const scoredMentors = mentorsRes.rows.map((mentor) => {
      const score = calculateScore(domain, mentor.expertise);
      return { ...mentor, matchScore: score / 100 };
    });

    scoredMentors.sort((a, b) => b.matchScore - a.matchScore);
    const topMentors = scoredMentors.slice(0, 5);

    return { success: true, mentors: topMentors, message: `Top 5 mentors matched based on ${domain} domain.` };
  } catch (error) {
    console.error("Error getting suggested mentors:", error);
    return { success: false, message: "Server error fetching mentors." };
  }
};

// --- ASSIGN MENTOR TO PROJECT ---
export const assignMentor = async (projectId, mentorId) => {
  try {
    const mentorCheck = await pool.query(
      "SELECT * FROM project_entrepreneurs WHERE project_id = $1 AND role_in_project = 'Mentor'",
      [projectId]
    );

    if (mentorCheck.rows.length > 0) {
      return { success: false, message: "This project already has a mentor assigned." };
    }

    await pool.query(
      "INSERT INTO project_entrepreneurs (project_id, user_id, role_in_project) VALUES ($1, $2, $3)",
      [projectId, mentorId, "Mentor"]
    );

    const ownerRes = await pool.query(
      "SELECT user_id FROM project_entrepreneurs WHERE project_id = $1 AND (role_in_project IS NULL OR role_in_project != 'Mentor') LIMIT 1",
      [projectId]
    );

    const userId = ownerRes.rows[0]?.user_id;

    if (userId) {
      let cohortRes = await pool.query(
        "SELECT cohort_id FROM cohort_members WHERE user_id = $1 LIMIT 1",
        [userId]
      );
      let cohortId = cohortRes.rows[0]?.cohort_id;
      if (!cohortId) {
        const anyCohort = await pool.query("SELECT id FROM cohorts ORDER BY created_at DESC LIMIT 1");
        cohortId = anyCohort.rows[0]?.id;
      }
      if (cohortId) {
        await pool.query(
          `INSERT INTO cohort_members (cohort_id, user_id, joined_at, current_stage)
           VALUES ($1, $2, NOW(), 'incubation')
           ON CONFLICT (cohort_id, user_id) DO NOTHING`,
          [cohortId, userId]
        ).catch(() => {});

        await pool.query(
          `INSERT INTO mentor_assignments (mentor_id, entrepreneur_id, cohort_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (mentor_id, entrepreneur_id, cohort_id) DO NOTHING`,
          [mentorId, userId, cohortId]
        ).catch(() => {});
      }

      const projRes = await pool.query("SELECT name FROM projects WHERE id = $1", [projectId]);
      const projectName = projRes.rows[0]?.name || "your project";

      const mentorRes = await pool.query("SELECT name FROM users WHERE id = $1", [mentorId]);
      const mentorName = mentorRes.rows[0]?.name || "A mentor";

      await createNotification(
        userId,
        "mentor_assignment",
        `${mentorName} has been assigned as a mentor to your project "${projectName}"! Please contact your mentor.`,
        { projectId, mentorId },
        `/v1/auth/profile?tab=projects`
      );
    }

    return { success: true, message: "Mentor assigned successfully!" };
  } catch (error) {
    console.error("Error assigning mentor:", error);
    return { success: false, message: "Server error assigning mentor." };
  }
};

// --- PRE-ASSIGNMENT MENTOR INVITATIONS ---
let mentorInvitationsTableReady = false;
export const ensureMentorInvitationsTable = async () => {
  if (mentorInvitationsTableReady) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mentor_invitations (
        id SERIAL PRIMARY KEY,
        project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        mentor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invited_by INT REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        message TEXT,
        invited_at TIMESTAMP DEFAULT NOW(),
        responded_at TIMESTAMP,
        decline_reason TEXT,
        UNIQUE(project_id, mentor_id)
      )
    `);
    // Older installs may have created the table before this column existed.
    await pool.query("ALTER TABLE mentor_invitations ADD COLUMN IF NOT EXISTS decline_reason TEXT");
    mentorInvitationsTableReady = true;
  } catch (err) {
    console.error("Failed to ensure mentor_invitations table:", err.message);
  }
};

export const inviteMentorToProject = async (projectId, mentorId, adminId, message = "") => {
  await ensureMentorInvitationsTable();
  try {
    // 1. Check if the project ALREADY has an assigned mentor
    const mentorCheck = await pool.query(
      "SELECT * FROM project_entrepreneurs WHERE project_id = $1 AND LOWER(role_in_project) = 'mentor'",
      [projectId]
    );

    if (mentorCheck.rows.length > 0) {
      return { success: false, message: "This project already has an assigned mentor." };
    }

    // 2. Check if an invitation for this project has ALREADY been accepted
    const acceptedCheck = await pool.query(
      "SELECT 1 FROM mentor_invitations WHERE project_id = $1 AND status = 'accepted'",
      [projectId]
    );

    if (acceptedCheck.rows.length > 0) {
      return { success: false, message: "A mentor has already accepted the invitation for this project." };
    }

    // 3. Only ONE pending invitation allowed per project at a time.
    //    If the invited mentor declines, the project becomes open again for other mentors.
    const pendingCheck = await pool.query(
      "SELECT 1 FROM mentor_invitations WHERE project_id = $1 AND status = 'pending' AND mentor_id <> $2 LIMIT 1",
      [projectId, mentorId]
    );

    if (pendingCheck.rows.length > 0) {
      return { success: false, message: "An invitation is already pending for this project. You can invite another mentor after it is declined." };
    }

    const res = await pool.query(
      `INSERT INTO mentor_invitations (project_id, mentor_id, invited_by, status, message, invited_at)
       VALUES ($1, $2, $3, 'pending', $4, NOW())
       ON CONFLICT (project_id, mentor_id) 
       DO UPDATE SET status = 'pending', message = EXCLUDED.message, invited_at = NOW()
       RETURNING *`,
      [projectId, mentorId, adminId || null, message || ""]
    );

    const projRes = await pool.query("SELECT name FROM projects WHERE id = $1", [projectId]);
    const projectName = projRes.rows[0]?.name || "a startup project";

    await createNotification(
      mentorId,
      "mentor_invitation",
      `You have been invited to mentor the project "${projectName}". Please review and respond in your mentor portal.`,
      { projectId, invitationId: res.rows[0].id },
      `/v1/auth/profile?tab=invitations`
    );

    return { success: true, invitation: res.rows[0], message: `Invitation sent to mentor for "${projectName}"` };
  } catch (error) {
    console.error("Error in inviteMentorToProject:", error);
    return { success: false, message: "Server error sending mentor invitation." };
  }
};

export const getProjectInvitations = async (projectId) => {
  await ensureMentorInvitationsTable();
  try {
    // LEFT JOIN so invitation history survives even if the mentor's account was deleted.
    const res = await pool.query(
      `SELECT mi.*, u.name as mentor_name, u.email as mentor_email, u.expertise as mentor_expertise
       FROM mentor_invitations mi
       LEFT JOIN users u ON u.id = mi.mentor_id
       WHERE mi.project_id = $1
       ORDER BY mi.invited_at DESC`,
      [projectId]
    );

    // Currently assigned mentor (if any). LEFT JOIN keeps orphaned rows visible
    // after the mentor account is gone so admins can still replace them.
    const curRes = await pool.query(
      `SELECT pe.user_id AS mentor_id, u.name AS mentor_name, u.email AS mentor_email,
              (u.id IS NULL) AS account_removed
       FROM project_entrepreneurs pe
       LEFT JOIN users u ON u.id = pe.user_id
       WHERE pe.project_id = $1 AND LOWER(pe.role_in_project) = 'mentor'
       LIMIT 1`,
      [projectId]
    );

    return { success: true, data: res.rows, currentMentor: curRes.rows[0] || null };
  } catch (error) {
    console.error("Error in getProjectInvitations:", error);
    return { success: false, data: [], currentMentor: null };
  }
};

// --- REMOVE / REPLACE CURRENT PROJECT MENTOR ---
// Used when a mentor leaves or their account was deleted. Frees the project so
// another mentor can be invited or directly assigned.
export const removeProjectMentor = async (projectId) => {
  try {
    // 1. Find the currently assigned mentor row (works for orphaned rows too).
    const curRes = await pool.query(
      `SELECT pe.user_id AS mentor_id, u.name AS mentor_name
       FROM project_entrepreneurs pe
       LEFT JOIN users u ON u.id = pe.user_id
       WHERE pe.project_id = $1 AND LOWER(pe.role_in_project) = 'mentor'
       LIMIT 1`,
      [projectId]
    );

    if (curRes.rows.length === 0) {
      return { success: false, message: "This project has no assigned mentor." };
    }

    const oldMentorId = curRes.rows[0].mentor_id;
    const oldMentorName = curRes.rows[0].mentor_name || "The previous mentor";

    // 2. Remove the mentor role row from the project team.
    await pool.query(
      "DELETE FROM project_entrepreneurs WHERE project_id = $1 AND LOWER(role_in_project) = 'mentor'",
      [projectId]
    );

    // 3. Revoke any pending/accepted invitations for this project so new ones can be sent.
    await pool.query(
      `UPDATE mentor_invitations
       SET status = 'revoked', responded_at = NOW()
       WHERE project_id = $1 AND status IN ('pending', 'accepted')`,
      [projectId]
    );

    // 4. Remove portal mentorship assignments linking the old mentor to this project's founders.
    if (oldMentorId) {
      await pool.query(
        `DELETE FROM mentor_assignments ma
         USING project_entrepreneurs pe
         WHERE pe.project_id = $1
           AND pe.user_id = ma.entrepreneur_id
           AND ma.mentor_id = $2`,
        [projectId, oldMentorId]
      ).catch(() => {});
    }

    // 5. Notify the project founders about the change.
    const foundersRes = await pool.query(
      `SELECT user_id FROM project_entrepreneurs
       WHERE project_id = $1 AND (role_in_project IS NULL OR LOWER(role_in_project) != 'mentor')`,
      [projectId]
    );

    const projRes = await pool.query("SELECT name FROM projects WHERE id = $1", [projectId]);
    const projectName = projRes.rows[0]?.name || "your project";

    for (const founder of foundersRes.rows) {
      await createNotification(
        founder.user_id,
        "mentor_assignment",
        `${oldMentorName} is no longer the mentor of "${projectName}". A new mentor will be assigned soon.`,
        { projectId, removedMentorId: oldMentorId },
        `/v1/auth/profile?tab=projects`
      ).catch(() => {});
    }

    return { success: true, message: `${oldMentorName === "The previous mentor" ? "Previous mentor" : oldMentorName} removed from "${projectName}". You can now invite another mentor.` };
  } catch (error) {
    console.error("Error in removeProjectMentor:", error);
    return { success: false, message: "Server error removing mentor." };
  }
};

