import pool from "../../config/db.js";
import { createNotification } from "../../utils/notificationHelper.js";

// Get all funding requests
export const getAllFundingRequests = async (query = "") => {
    try {
        let querySQL = `
      SELECT 
        fr.id,
        fr.project_id,
        fr.amount,
        fr.approved_amount,
        fr.founder_action,
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
    `;

        // Parse query parameters for filtering
        const params = [];
        if (query.includes("status=")) {
            const match = query.match(/status=([^&]+)/);
            if (match) {
                querySQL += ` WHERE fr.status = $${params.length + 1}`;
                params.push(match[1]);
            }
        }

        if (query.includes("funding_stage=")) {
            const match = query.match(/funding_stage=([^&]+)/);
            if (match) {
                querySQL += querySQL.includes("WHERE") ? " AND" : " WHERE";
                querySQL += ` fr.funding_stage = $${params.length + 1}`;
                params.push(match[1]);
            }
        }

        querySQL += ` ORDER BY fr.requested_at DESC`;

        const res = await pool.query(querySQL, params);

        // Group by funding request to avoid duplicates from multiple founders
        const grouped = {};
        res.rows.forEach((row) => {
            if (!grouped[row.id]) {
                grouped[row.id] = {
                    id: row.id,
                    project_id: row.project_id,
                    amount: row.amount,
                    approved_amount: row.approved_amount, // ADDED THIS!
                    founder_action: row.founder_action,   // ADDED THIS!
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

        return { success: true, data: Object.values(grouped) };
    } catch (error) {
        console.error("Error fetching funding requests:", error);
        throw error;
    }
};

// Get funding dashboard
export const getFundingDashboard = async () => {
    try {
        const res = await pool.query(
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

        return { success: true, data: res.rows };
    } catch (error) {
        console.error("Error fetching dashboard:", error);
        throw error;
    }
};

// Get funding by stage
export const getFundingByStage = async () => {
    try {
        const res = await pool.query(
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

        return { success: true, data: res.rows };
    } catch (error) {
        console.error("Error fetching funding by stage:", error);
        throw error;
    }
};

// Get single funding request
export const getFundingRequestById = async (id) => {
    try {
        const res = await pool.query(
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

        if (res.rows.length === 0) {
            return { success: true, data: null };
        }

        // Group founders
        const firstRow = res.rows[0];
        const fundingRequest = {
            id: firstRow.id,
            project_id: firstRow.project_id,
            amount: firstRow.amount,
            approved_amount: firstRow.approved_amount, // ADDED THIS!
            founder_action: firstRow.founder_action,   // ADDED THIS!
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
            founders: res.rows
                .filter((row) => row.founder_id)
                .map((row) => ({
                    id: row.founder_id,
                    name: row.founder_name,
                    email: row.founder_email,
                    profile_image: row.founder_image,
                })),
        };

        return { success: true, data: fundingRequest };
    } catch (error) {
        console.error("Error fetching funding request:", error);
        throw error;
    }
};

// Update funding request status
export const updateFundingRequestStatus = async (id, status, notes, approvedAmount = null) => {
    // 1. Parse amount safely so it doesn't crash if left blank
    const parsedAmount = approvedAmount && !isNaN(approvedAmount) ? approvedAmount : null;

    // 2. If admin selects "Approved", change to "Offer Under Review"
    const finalStatus = status === 'Approved' ? 'Offer Under Review' : status;

    // 3. Update the database FIRST!
    const res = await pool.query(
        `UPDATE funding_requests 
     SET status = $1, notes = $2, approved_amount = $3, founder_action = 'Pending', updated_at = CURRENT_TIMESTAMP 
     WHERE id = $4 RETURNING *`,
        [finalStatus, notes, parsedAmount, id]
    );

    const funding = res.rows[0];
    if (!funding) return null;

    // 4. NOW that 'funding' is defined, find the owner and send notification!
    try {
        const ownerRes = await pool.query(
            "SELECT user_id FROM project_entrepreneurs WHERE project_id = $1 AND (role_in_project IS NULL OR role_in_project != 'Mentor') LIMIT 1",
            [funding.project_id]
        );
        const userId = ownerRes.rows[0]?.user_id;

        const projRes = await pool.query("SELECT name FROM projects WHERE id = $1", [funding.project_id]);
        const projectName = projRes.rows[0]?.name || "your project";

        if (userId && finalStatus === 'Offer Under Review') {
            const message = `Funding offer made for "${projectName}"! The admin offered $${parsedAmount}. Please review and Accept or Decline.`;
            await createNotification(
                userId,
                'funding_approval',
                message,
                { fundingId: funding.id, projectId: funding.project_id },
                `/v1/auth/profile?tab=funding`
            );
        }
    } catch (error) {
        console.error("Error sending funding notification:", error);
    }

    return funding;
};

// ENTREPRENEUR ACCEPTS OR REJECTS FUNDING
export const founderRespondToFunding = async (fundingId, userId, action) => {
    // 1. Get the funding request
    const fundRes = await pool.query("SELECT * FROM funding_requests WHERE id = $1", [fundingId]);
    if (fundRes.rows.length === 0) throw new Error("Funding request not found.");

    const funding = fundRes.rows[0];

    // 2. Safely find the project owner from project_entrepreneurs
    const ownerRes = await pool.query(
        "SELECT user_id FROM project_entrepreneurs WHERE project_id = $1 AND (role_in_project IS NULL OR role_in_project != 'Mentor') LIMIT 1",
        [funding.project_id]
    );
    const projectOwnerId = ownerRes.rows[0]?.user_id;

    // Security check: Make sure the founder owns this project
    if (projectOwnerId !== userId) {
        throw new Error("Unauthorized: You do not own this project.");
    }

    // 3. Determine the final status for the Admin table
    let finalStatus = 'Offer Under Review';
    if (action === 'Founder Accepted') finalStatus = 'Approved';
    if (action === 'Founder Declined') finalStatus = 'Rejected';

    // 4. Update the main status column AND the founder_action column
    const res = await pool.query(
        "UPDATE funding_requests SET status = $1, founder_action = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
        [finalStatus, action, fundingId]
    );

    // 5. Notify the Admin that the founder responded!
    const projRes = await pool.query("SELECT name FROM projects WHERE id = $1", [funding.project_id]);
    const projectName = projRes.rows[0]?.name || "a project";

    await createNotification(1, 'funding_response', `Founder ${action === 'Founder Accepted' ? 'accepted' : 'declined'} the funding for project "${projectName}".`, { fundingId });

    return res.rows[0];
};

// Delete funding request
export const deleteFundingRequest = async (id) => {
    try {
        const res = await pool.query(
            `DELETE FROM funding_requests WHERE id = $1 RETURNING *`,
            [id],
        );

        if (res.rows.length === 0) {
            return { success: false, data: null };
        }

        return { success: true, data: res.rows[0] };
    } catch (error) {
        console.error("Error deleting funding request:", error);
        throw error;
    }
};

export const getNegotiations = async (fundingRequestId) => {
  const res = await pool.query(
    `SELECT n.*, u.name AS sender_name
     FROM funding_negotiations n
     JOIN users u ON u.id = n.sender_id
     WHERE n.funding_request_id = $1
     ORDER BY n.created_at ASC`,
    [fundingRequestId]
  );
  return { success: true, data: res.rows };
};

export const addNegotiation = async ({ funding_request_id, sender_id, sender_role, message, proposed_amount }) => {
  const res = await pool.query(
    `INSERT INTO funding_negotiations(funding_request_id, sender_id, sender_role, message, proposed_amount)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [funding_request_id, sender_id, sender_role, message || null, proposed_amount || null]
  );
  return { success: true, data: res.rows[0] };
};