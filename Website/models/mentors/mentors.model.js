import pool from "../../config/db.js";

export const getAllMentors = async () => {
  const query = `
    SELECT 
      id, 
      name, 
      email, 
      expertise, 
      company,
      bio, 
      profile_image, 
      role,
      status
    FROM users 
    WHERE role = 'mentor' AND status = 'active'
    ORDER BY created_at DESC;
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Database Error in getAllMentors:", error);
    throw error;
  }
};

export const getMentorById = async (id) => {
  const query = `
    SELECT id, name, email, expertise, bio, profile_image 
    FROM users 
    WHERE id = $1 AND role = 'mentor' LIMIT 1;
  `;

  try {
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    console.error(`Database Error in getMentorById (${id}):`, error);
    throw error;
  }
};
