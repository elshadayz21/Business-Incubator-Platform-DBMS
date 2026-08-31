import pool from "../../config/db.js";

// GET ALL SUBMISSIONS (Contact + Newsletter) (Paginated)
export const getAllSubmissions = async (limit = null, offset = 0) => {
    let sql = "SELECT * FROM public_submissions ORDER BY created_at DESC";
    const params = [];
    if (limit != null) {
        sql += " LIMIT $1 OFFSET $2";
        params.push(limit, offset);
    }
    const result = await pool.query(sql, params);
    return result.rows;
};

// DELETE A SUBMISSION
export const deleteSubmission = async (id) => {
    await pool.query("DELETE FROM public_submissions WHERE id = $1", [id]);
    return { success: true, message: "Submission deleted successfully" };
};