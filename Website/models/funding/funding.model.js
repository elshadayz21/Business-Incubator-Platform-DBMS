import pool from "../../config/db.js";

// Create a new funding request
export const createFundingRequest = async ({
  project_id,
  investor_id = null,
  amount,
  status = "Pending",
  funding_stage,
  description,
}) => {
  try {
    const result = await pool.query(
      `INSERT INTO funding_requests(
        project_id,
        investor_id,
        amount,
        status,
        funding_stage,
        description,
        requested_at,
        created_at,
        updated_at
      )
      VALUES($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
      RETURNING *`,
      [project_id, investor_id, amount, status, funding_stage, description],
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error creating funding request:", error);
    throw error;
  }
};

// Get all funding requests with project and founder info
export const getAllFundingRequests = async (filters = {}) => {
  try {
    let query = `
      SELECT 
        fr.id,
        fr.project_id,
        fr.amount,
        fr.status,
        fr.funding_stage,
        fr.description,
        fr.requested_at,
        fr.reviewed_at,
        fr.reviewed_by,
        fr.notes,
        fr.created_at,
        fr.updated_at,
        p.id as project_id_info,
        p.name as project_name,
        p.domain as project_domain,
        p.stage as project_stage,
        p.status as project_status,
        u.id as founder_id,
        u.name as founder_name,
        u.email as founder_email,
        u.profile_image as founder_image
      FROM funding_requests fr
      JOIN projects p ON fr.project_id = p.id
      LEFT JOIN project_entrepreneurs pe ON p.id = pe.project_id
      LEFT JOIN users u ON pe.user_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Apply filters
    if (filters.status) {
      query += ` AND fr.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.funding_stage) {
      query += ` AND fr.funding_stage = $${paramCount}`;
      params.push(filters.funding_stage);
      paramCount++;
    }

    if (filters.project_id) {
      query += ` AND fr.project_id = $${paramCount}`;
      params.push(filters.project_id);
      paramCount++;
    }

    query += ` ORDER BY fr.requested_at DESC`;

    const result = await pool.query(query, params);

    // Group by funding request to avoid duplicates from multiple founders
    const grouped = {};
    result.rows.forEach((row) => {
      if (!grouped[row.id]) {
        grouped[row.id] = {
          id: row.id,
          project_id: row.project_id,
          amount: row.amount,
          status: row.status,
          funding_stage: row.funding_stage,
          description: row.description,
          requested_at: row.requested_at,
          reviewed_at: row.reviewed_at,
          reviewed_by: row.reviewed_by,
          notes: row.notes,
          created_at: row.created_at,
          updated_at: row.updated_at,
          project: {
            id: row.project_id_info,
            name: row.project_name,
            domain: row.project_domain,
            stage: row.project_stage,
            status: row.project_status,
          },
          founders: [],
        };
      }

      if (
        row.founder_id &&
        !grouped[row.id].founders.some((f) => f.id === row.founder_id)
      ) {
        grouped[row.id].founders.push({
          id: row.founder_id,
          name: row.founder_name,
          email: row.founder_email,
          profile_image: row.founder_image,
        });
      }
    });

    return Object.values(grouped);
  } catch (error) {
    console.error("Error fetching funding requests:", error);
    throw error;
  }
};

// Get funding request by ID
export const getFundingRequestById = async (id) => {
  try {
    const result = await pool.query(
      `SELECT 
        fr.*,
        p.id as project_id_info,
        p.name as project_name,
        p.domain as project_domain,
        p.stage as project_stage,
        p.status as project_status,
        u.id as founder_id,
        u.name as founder_name,
        u.email as founder_email,
        u.profile_image as founder_image
      FROM funding_requests fr
      JOIN projects p ON fr.project_id = p.id
      LEFT JOIN project_entrepreneurs pe ON p.id = pe.project_id
      LEFT JOIN users u ON pe.user_id = u.id
      WHERE fr.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    // Group founders
    const firstRow = result.rows[0];
    const fundingRequest = {
      id: firstRow.id,
      project_id: firstRow.project_id,
      amount: firstRow.amount,
      status: firstRow.status,
      funding_stage: firstRow.funding_stage,
      description: firstRow.description,
      requested_at: firstRow.requested_at,
      reviewed_at: firstRow.reviewed_at,
      reviewed_by: firstRow.reviewed_by,
      notes: firstRow.notes,
      created_at: firstRow.created_at,
      updated_at: firstRow.updated_at,
      project: {
        id: firstRow.project_id_info,
        name: firstRow.project_name,
        domain: firstRow.project_domain,
        stage: firstRow.project_stage,
        status: firstRow.project_status,
      },
      founders: result.rows
        .filter((row) => row.founder_id)
        .map((row) => ({
          id: row.founder_id,
          name: row.founder_name,
          email: row.founder_email,
          profile_image: row.founder_image,
        })),
    };

    return fundingRequest;
  } catch (error) {
    console.error("Error fetching funding request:", error);
    throw error;
  }
};

// Update funding request status
export const updateFundingRequestStatus = async (
  id,
  status,
  reviewedBy = null,
  notes = null,
  isInvestor = false,
) => {
  try {
    const query = isInvestor && status === "Approved"
      ? `UPDATE funding_requests 
         SET 
           status = $1,
           reviewed_at = NOW(),
           reviewed_by = $2,
           investor_id = $2,
           notes = $3,
           updated_at = NOW()
         WHERE id = $4
         RETURNING *`
      : `UPDATE funding_requests 
         SET 
           status = $1,
           reviewed_at = NOW(),
           reviewed_by = $2,
           notes = $3,
           updated_at = NOW()
         WHERE id = $4
         RETURNING *`;

    const result = await pool.query(query, [status, reviewedBy, notes, id]);
    return result.rows[0];
  } catch (error) {
    console.error("Error updating funding request:", error);
    throw error;
  }
};

// Delete funding request
export const deleteFundingRequest = async (id) => {
  try {
    const result = await pool.query(
      `DELETE FROM funding_requests WHERE id = $1 RETURNING *`,
      [id],
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error deleting funding request:", error);
    throw error;
  }
};

// Get funding status dashboard
export const getFundingDashboard = async () => {
  try {
    const result = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.domain,
        p.stage,
        COUNT(fr.id) as total_requests,
        SUM(CASE WHEN fr.status = 'Approved' THEN fr.amount ELSE 0 END) as approved_amount,
        SUM(CASE WHEN fr.status = 'Pending' THEN fr.amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN fr.status = 'Rejected' THEN fr.amount ELSE 0 END) as rejected_amount,
        MAX(fr.requested_at) as last_request_at
      FROM projects p
      LEFT JOIN funding_requests fr ON p.id = fr.project_id
      GROUP BY p.id, p.name, p.domain, p.stage
      ORDER BY total_requests DESC, p.name ASC`,
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching funding dashboard:", error);
    throw error;
  }
};

// Get funding status by stage
export const getFundingByStage = async () => {
  try {
    const result = await pool.query(
      `SELECT 
        p.stage,
        fr.status,
        COUNT(fr.id) as count,
        SUM(fr.amount) as total_amount,
        AVG(fr.amount) as avg_amount
      FROM funding_requests fr
      JOIN projects p ON fr.project_id = p.id
      WHERE fr.status IS NOT NULL
      GROUP BY p.stage, fr.status
      ORDER BY p.stage ASC, fr.status ASC`,
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching funding by stage:", error);
    throw error;
  }
};

// Get user's projects for funding request form
export const getUserProjects = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.domain,
        p.stage,
        p.funding_stage,
        p.short_description
      FROM projects p
      JOIN project_entrepreneurs pe ON p.id = pe.project_id
      WHERE pe.user_id = $1
      ORDER BY p.created_at DESC`,
      [userId],
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching user projects:", error);
    throw error;
  }
};

export const getUserFundingRequests = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT fr.*, p.name as project_name
       FROM funding_requests fr
       JOIN projects p ON fr.project_id = p.id
       JOIN project_entrepreneurs pe ON p.id = pe.project_id
       WHERE pe.user_id = $1
       ORDER BY fr.requested_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching user funding requests:", error);
    throw error;
  }
};

export const getInvestorPendingRequests = async () => {
  try {
    const result = await pool.query(
      `SELECT fr.*, p.name as project_name, u.name as founder_name
       FROM funding_requests fr
       JOIN projects p ON fr.project_id = p.id
       LEFT JOIN project_entrepreneurs pe ON p.id = pe.project_id AND pe.role_in_project = 'founder'
       LEFT JOIN users u ON pe.user_id = u.id
       WHERE fr.status = 'Pending'
       ORDER BY fr.requested_at DESC`
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching investor pending requests:", error);
    throw error;
  }
};

export const getInvestorPortfolio = async (investorId) => {
  try {
    const result = await pool.query(
      `SELECT fr.*, p.name as project_name
       FROM funding_requests fr
       JOIN projects p ON fr.project_id = p.id
       WHERE fr.investor_id = $1 AND fr.status = 'Approved'
       ORDER BY fr.reviewed_at DESC`,
      [investorId]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching investor portfolio:", error);
    throw error;
  }
};
