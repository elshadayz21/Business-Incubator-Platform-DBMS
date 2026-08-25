import pool from "../../config/db.js";

export const createProject = async ({
  name,
  domain,
  short_description,
  problem,
  solution,
  tech_stack,
  stage = "idea",
  status = "Pending",
  github_url,
  demo_url,
  team_type,
  looking_for_cofounders = false,
  funding_stage,
}) => {
  try {
    const result = await pool.query(
      `INSERT INTO projects(
                name, 
                domain, 
                short_description, 
                problem, 
                solution, 
                tech_stack, 
                stage, 
                status,
                github_url, 
                demo_url, 
                team_type, 
                looking_for_cofounders, 
                funding_stage,
                created_at,
                updated_at
            )
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
            RETURNING *`,
      [
        name,
        domain,
        short_description,
        problem,
        solution,
        tech_stack,
        stage,
        status,
        github_url || null,
        demo_url || null,
        team_type,
        looking_for_cofounders,
        funding_stage || null,
      ],
    );

    return result.rows[0];
  } catch (err) {
    console.error("Error creating project:", err);
    throw err;
  }
};

export const addProjectEntrepreneur = async (
  project_id,
  user_id,
  role_in_project = "co-founder",
) => {
  try {
    const result = await pool.query(
      `INSERT INTO project_entrepreneurs(project_id, user_id, role_in_project)
             VALUES($1, $2, $3)
             RETURNING *`,
      [project_id, user_id, role_in_project],
    );
    return result.rows[0];
  } catch (err) {
    console.error("Error adding project entrepreneur:", err);
    throw err;
  }
};

export const getUserIdByCode = async (user_code) => {
  try {
    const result = await pool.query(
      `SELECT id FROM users WHERE user_code = $1`,
      [user_code],
    );
    return result.rows[0]?.id || null;
  } catch (err) {
    console.error("Error getting user by code:", err);
    throw err;
  }
};

export const getProjectEntrepreneurs = async (project_id) => {
  try {
    const result = await pool.query(
      `SELECT 
                pe.project_id,
                pe.user_id,
                pe.role_in_project,
                u.name,
                u.email,
                u.user_code,
                u.profile_image
             FROM project_entrepreneurs pe
             JOIN users u ON pe.user_id = u.id
             WHERE pe.project_id = $1`,
      [project_id],
    );
    return result.rows;
  } catch (err) {
    console.error("Error getting project entrepreneurs:", err);
    throw err;
  }
};

export const getAllProjects = async () => {
  try {
    const result = await pool.query(
      `SELECT 
                p.*,
                COUNT(pe.user_id) as entrepreneur_count
             FROM projects p
             LEFT JOIN project_entrepreneurs pe ON p.id = pe.project_id
             GROUP BY p.id
             ORDER BY p.created_at DESC`,
    );
    return result.rows;
  } catch (err) {
    console.error("Error getting all projects:", err);
    throw err;
  }
};

export const getProjectById = async (project_id) => {
  try {
    const result = await pool.query(`SELECT * FROM projects WHERE id = $1`, [
      project_id,
    ]);
    return result.rows[0] || null;
  } catch (err) {
    console.error("Error getting project by ID:", err);
    throw err;
  }
};

export const getMentorProjects = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT p.* 
       FROM projects p
       JOIN mentor_project_assignments mpa ON p.id = mpa.project_id
       JOIN mentors m ON mpa.mentor_id = m.id
       WHERE m.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (err) {
    console.error("Error getting mentor projects:", err);
    throw err;
  }
};
