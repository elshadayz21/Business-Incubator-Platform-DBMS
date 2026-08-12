import pool from "../../config/db.js";

export const getAllCohorts = async () => {
  const result = await pool.query(
    `SELECT * FROM cohorts ORDER BY start_date DESC NULLS LAST`,
  );
  return result.rows;
};

export const getCohortById = async (id) => {
  const result = await pool.query(`SELECT * FROM cohorts WHERE id = $1`, [id]);
  return result.rows[0];
};

export const createCohort = async ({
  name,
  type,
  start_date,
  end_date,
  application_deadline,
  status,
}) => {
  const result = await pool.query(
    `INSERT INTO cohorts(name, type, start_date, end_date, application_deadline, status)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      name,
      type,
      start_date || null,
      end_date || null,
      application_deadline || null,
      status || "upcoming",
    ],
  );
  return result.rows[0];
};

export const updateCohort = async (
  id,
  { name, type, start_date, end_date, application_deadline, status },
) => {
  const result = await pool.query(
    `UPDATE cohorts SET name=$1, type=$2, start_date=$3, end_date=$4, application_deadline=$5, status=$6, updated_at=now()
     WHERE id=$7 RETURNING *`,
    [
      name,
      type,
      start_date || null,
      end_date || null,
      application_deadline || null,
      status,
      id,
    ],
  );
  return result.rows[0];
};

export const deleteCohort = async (id) => {
  await pool.query(`DELETE FROM cohorts WHERE id = $1`, [id]);
  return { success: true };
};
