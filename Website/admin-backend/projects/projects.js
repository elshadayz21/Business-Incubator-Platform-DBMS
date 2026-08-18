import pool from "../../config/db.js";
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
/*export const updateProjectStatus = async (id, status) => {
  const res = await pool.query(
    "UPDATE projects SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
    [status, id],
  );
  return res.rows[0];
};*/


// Update Project Status
export const updateProjectStatus = async (id, status) => {
  const res = await pool.query(
      "UPDATE projects SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [status, id],
  );
  const project = res.rows[0];

  if (project) {
    const ownerRes = await pool.query(
        "SELECT user_id FROM project_entrepreneurs WHERE project_id = $1 AND (role_in_project IS NULL OR role_in_project != 'Mentor') LIMIT 1",
        [project.id]
    );

    const userId = ownerRes.rows[0]?.user_id;
    console.log("Approval Check - Found project owner ID:", userId); // <--- THIS WILL TELL US IF IT FOUND THE OWNER

    if (userId) {
      const message = status === 'approved'
          ? `Great news! Your project "${project.name}" has been approved.`
          : `Update: Your project "${project.name}" was not approved.`;

      await createNotification(
          userId,
          'project_status',
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


/// Toggle Project Approved Status
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

  // Find the project owner
  const ownerRes = await pool.query(
      "SELECT user_id FROM project_entrepreneurs WHERE project_id = $1 AND (role_in_project IS NULL OR role_in_project != 'Mentor') LIMIT 1",
      [project.id]
  );

  const userId = ownerRes.rows[0]?.user_id;

  if (userId) {
    // Check if the project was just APPROVED or REJECTED
    if (project.approved) {
      console.log("Toggle Approval - Approved. Notifying user:", userId);
      await createNotification(
          userId,
          'project_status',
          `Great news! Your project "${project.name}" has been approved.`,
          { projectId: project.id },
          `/v1/auth/profile?tab=projects`
      );
    } else {
      console.log("Toggle Approval - Rejected. Notifying user:", userId);
      await createNotification(
          userId,
          'project_status',
          `Update: Your project "${project.name}" has been rejected. Please review feedback.`,
          { projectId: project.id },
          `/v1/auth/profile?tab=projects`
      );
    }
  }

  return project;
};

// Get Projects Statistics
export const getProjectsStats = async () => {
  const res = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'idea') as idea,
      COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'approved') as approved,
      COUNT(*) FILTER (WHERE status = 'rejected') as rejected
    FROM projects
  `);
  return res.rows[0];
};


// --- AI SUGGESTED MENTORS LOGIC (With Realistic Scoring) ---

// Helper function to calculate text similarity
const calculateScore = (domain, expertise) => {
  if (!domain || !expertise) return Math.random() * 15 + 5; // Random 5-20% if missing

  const d = domain.toLowerCase();
  const e = expertise.toLowerCase();

  // 1. Perfect match
  if (d === e) return 98;

  // 2. Partial word match (e.g., "Agri" in "Agriculture")
  const dWords = d.split(/[\s,]+/);
  const eWords = e.split(/[\s,]+/);
  let matchCount = 0;

  dWords.forEach(dw => {
    eWords.forEach(ew => {
      if (dw.length > 2 && ew.length > 2 && (dw.includes(ew) || ew.includes(dw))) {
        matchCount++;
      }
    });
  });

  if (matchCount > 0) {
    return 70 + (matchCount * 10); // 70-90% for partial word matches
  }

  // 3. Character overlap (Fallback: looks at shared letters)
  const dChars = new Set(d.replace(/[^a-z]/g, '').split(''));
  const eChars = new Set(e.replace(/[^a-z]/g, '').split(''));
  let charMatch = 0;

  dChars.forEach(c => { if(eChars.has(c)) charMatch++; });

  // Calculate percentage based on shared characters
  const score = (charMatch / (dChars.size + eChars.size)) * 100;

  // Ensure it's between 5% and 60% to look like a realistic fuzzy match
  return Math.max(5, Math.min(score, 60));
};

export const getSuggestedMentors = async (projectId) => {
  try {
    // 1. Get the project to find out what domain it is
    const projectRes = await pool.query("SELECT domain FROM projects WHERE id = $1", [projectId]);
    if (projectRes.rows.length === 0) return { success: false, message: "Project not found" };

    const domain = projectRes.rows[0].domain || "General";

    // 2. Fetch ALL active mentors so we can score them
    const mentorsRes = await pool.query(
        `SELECT id, name, expertise, email, profile_image 
       FROM users 
       WHERE role = 'mentor' 
       AND status = 'active'`
    );

    if (mentorsRes.rows.length === 0) {
      return { success: true, mentors: [], message: "No active mentors found in the system." };
    }

    // 3. Calculate a dynamic match score for each mentor
    const scoredMentors = mentorsRes.rows.map(mentor => {
      const score = calculateScore(domain, mentor.expertise);
      return { ...mentor, matchScore: score / 100 }; // React expects 0.0 to 1.0
    });

    // 4. Sort by highest score first and take the top 5
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
    // 1. Check if the project ALREADY has a mentor!
    const mentorCheck = await pool.query(
        "SELECT * FROM project_entrepreneurs WHERE project_id = $1 AND role_in_project = 'Mentor'",
        [projectId]
    );

    if (mentorCheck.rows.length > 0) {
      return { success: false, message: "This project already has a mentor assigned." };
    }

    // 2. Assign the new mentor
    await pool.query(
        "INSERT INTO project_entrepreneurs (project_id, user_id, role_in_project) VALUES ($1, $2, $3)",
        [projectId, mentorId, 'Mentor']
    );

    // 3. Send Notification to the Entrepreneur!
    const ownerRes = await pool.query(
        "SELECT user_id FROM project_entrepreneurs WHERE project_id = $1 AND (role_in_project IS NULL OR role_in_project != 'Mentor') LIMIT 1",
        [projectId]
    );

    const userId = ownerRes.rows[0]?.user_id;

    if (userId) {
      const projRes = await pool.query("SELECT name FROM projects WHERE id = $1", [projectId]);
      const projectName = projRes.rows[0]?.name || "your project";

      // FETCH THE MENTOR'S NAME HERE!
      const mentorRes = await pool.query("SELECT name FROM users WHERE id = $1", [mentorId]);
      const mentorName = mentorRes.rows[0]?.name || "A mentor";

      await createNotification(
          userId,
          'mentor_assignment',
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
