import pool from "../../config/db.js";

// GET ALL SUBMISSIONS (Contact + Newsletter)
export const getAllSubmissions = async () => {
    const result = await pool.query("SELECT * FROM public_submissions ORDER BY created_at DESC");
    return result.rows;
};

// DELETE A SUBMISSION
export const deleteSubmission = async (id) => {
    await pool.query("DELETE FROM public_submissions WHERE id = $1", [id]);
    return { success: true, message: "Submission deleted successfully" };
};