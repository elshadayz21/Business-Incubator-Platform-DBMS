import pool from "../../config/db.js";

// 1. Get All Workshops
export const getAllWorkshopsQuery = async () => {
  try {
    const result = await pool.query(`
      SELECT 
        w.id,
        w.title,
        w.description,
        w.trainer_id,
        w.mentor_name,
        w.location,
        w.start_date,
        w.end_date,
        w.start_time,
        w.end_time,
        w.capacity,
        COUNT(we.id)::integer as enrolled_count,
        w.status,
        w.schedule,
        w.category
      FROM workshops w
      LEFT JOIN workshop_enrollments we ON w.id = we.workshop_id
      GROUP BY w.id, w.title, w.description, w.trainer_id, w.mentor_name, w.location, w.start_date, w.end_date, w.start_time, w.end_time, w.capacity, w.status, w.schedule, w.category
      ORDER BY w.start_date DESC
    `);
    return result.rows;
  } catch (err) {
    throw err;
  }
};

// 2. Get One Workshop
export const getWorkshopByIdQuery = async (id) => {
  try {
    const query = `
      SELECT 
        w.id,
        w.title,
        w.description,
        w.trainer_id,
        w.mentor_name,
        w.location,
        w.start_date,
        w.end_date,
        w.start_time,
        w.end_time,
        w.capacity,
        COUNT(we.id)::integer as enrolled_count,
        w.status,
        w.schedule,
        w.category,
        COALESCE(
          json_agg(
            json_build_object(
              'id', we.id,
              'name', we.entrepreneur_name, 
              'email', we.entrepreneur_email,
              'attended', we.attended,
              'feedback_rating', we.feedback_rating,
              'feedback_comment', we.feedback_comment,
              'enrollment_date', we.enrollment_date
            ) ORDER BY we.id
          ) FILTER (WHERE we.id IS NOT NULL), 
          '[]'::json
        ) as attendees
      FROM workshops w
      LEFT JOIN workshop_enrollments we ON w.id = we.workshop_id
      WHERE w.id = $1
      GROUP BY w.id, w.title, w.description, w.trainer_id, w.mentor_name, w.location, w.start_date, w.end_date, w.start_time, w.end_time, w.capacity, w.status, w.schedule, w.category
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (err) {
    throw err;
  }
};

// 6. Update status of workshops dynamically based on time and capacity
export const updateWorkshopStatusesQuery = async () => {
  try {
    // A. Completed (past end time)
    await pool.query(`
      UPDATE workshops 
      SET status = 'completed'
      WHERE 
        (end_date + end_time) < NOW()
        AND status != 'completed'
    `);

    // B. Full (upcoming but enrolled count >= capacity)
    await pool.query(`
      UPDATE workshops 
      SET status = 'full'
      WHERE 
        (end_date + end_time) >= NOW()
        AND enrolled_count >= capacity
        AND status != 'full'
    `);

    // C. Scheduled (upcoming and enrolled count < capacity)
    await pool.query(`
      UPDATE workshops 
      SET status = 'scheduled'
      WHERE 
        (end_date + end_time) >= NOW()
        AND enrolled_count < capacity
        AND status NOT IN ('scheduled', 'cancelled')
    `);
  } catch (err) {
    console.error("Error in updateWorkshopStatusesQuery:", err);
    throw err;
  }
};

// 3. Attend Workshop (Insert into workshop_enrollments)
export const joinWorkshopQuery = async (
  workshopId,
  userId,
  entrepreneurName,
  entrepreneurEmail,
) => {
  try {
    console.log(
      "Inserting enrollment - workshopId:",
      workshopId,
      "userId:",
      userId,
      "name:",
      entrepreneurName,
      "email:",
      entrepreneurEmail,
    );

    const query = `
      INSERT INTO workshop_enrollments (workshop_id, entrepreneur_id, entrepreneur_name, entrepreneur_email, enrollment_date)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [
      workshopId,
      userId,
      entrepreneurName,
      entrepreneurEmail,
    ]);

    console.log("Inserted enrollment result:", result.rows[0]);

    // Update enrolled_count in workshops table
    if (result.rows[0]) {
      await pool.query(
        "UPDATE workshops SET enrolled_count = enrolled_count + 1 WHERE id = $1",
        [workshopId],
      );
    }

    return result.rows[0];
  } catch (err) {
    throw err;
  }
};

// 4. Cancel Attendance (Delete from workshop_enrollments)
export const leaveWorkshopQuery = async (workshopId, userId) => {
  try {
    const query = `
      DELETE FROM workshop_enrollments 
      WHERE workshop_id = $1 AND entrepreneur_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [workshopId, userId]);

    // Decrease enrolled_count in workshops table
    if (result.rows[0]) {
      await pool.query(
        "UPDATE workshops SET enrolled_count = GREATEST(enrolled_count - 1, 0) WHERE id = $1",
        [workshopId],
      );
    }

    return result.rows[0];
  } catch (err) {
    throw err;
  }
};

// 5. Check if user is already enrolled
export const checkEnrollmentQuery = async (workshopId, userId) => {
  try {
    const query = `
      SELECT * FROM workshop_enrollments
      WHERE workshop_id = $1 AND entrepreneur_id = $2
      LIMIT 1
    `;
    const result = await pool.query(query, [workshopId, userId]);
    return result.rows[0] || null;
  } catch (err) {
    throw err;
  }
};

export const getMentorWorkshops = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT w.* 
       FROM workshops w
       LEFT JOIN mentor_workshop_assignments mwa ON w.id = mwa.workshop_id
       LEFT JOIN mentors m ON mwa.mentor_id = m.id
       WHERE w.trainer_id = $1 OR m.user_id = $1
       GROUP BY w.id
       ORDER BY w.start_date DESC`,
      [userId]
    );
    return result.rows;
  } catch (err) {
    console.error("Error getting mentor workshops:", err);
    throw err;
  }
};

export const getUserWorkshops = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT w.*, we.enrollment_date, we.attended
       FROM workshops w
       JOIN workshop_enrollments we ON w.id = we.workshop_id
       WHERE we.entrepreneur_id = $1
       ORDER BY w.start_date DESC`,
      [userId]
    );
    return result.rows;
  } catch (err) {
    console.error("Error getting user workshops:", err);
    throw err;
  }
};
