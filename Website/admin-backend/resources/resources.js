import pool from "../../config/db.js";

const VALID_RESOURCE_TYPES = ["workspace", "meeting_room", "equipment"];
const VALID_BOOKING_STATUSES = ["pending", "approved", "rejected"];

// 1. Get All Resources
export const getAllResources = async () => {
  try {
    const res = await pool.query(
      "SELECT * FROM resources ORDER BY created_at DESC",
    );
    return res.rows;
  } catch (error) {
    console.error("Error in getAllResources:", error);
    throw new Error("Failed to fetch resources.");
  }
};

// 2. Add New Resource
export const addResource = async (data) => {
  const { name, type, capacity, location } = data;

  // Validation
  if (!name || !location) {
    throw new Error("Resource name and location are required.");
  }
  if (!VALID_RESOURCE_TYPES.includes(type)) {
    throw new Error(
      `Invalid resource type: ${type}. Allowed: ${VALID_RESOURCE_TYPES.join(", ")}`,
    );
  }
  if (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0) {
    throw new Error("Capacity must be a positive integer.");
  }

  try {
    const res = await pool.query(
      "INSERT INTO resources (name, type, capacity, location) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, type, capacity, location],
    );
    return res.rows[0];
  } catch (error) {
    console.error("Error in addResource:", error);
    throw new Error("Failed to add resource.");
  }
};

// 3. Update Resource
export const updateResource = async (id, data) => {
  const { name, type, capacity, location } = data;

  if (!name) {
    throw new Error("Resource name is required.");
  }

  // Make type validation case-insensitive
  if (type && !VALID_RESOURCE_TYPES.includes(type.toLowerCase())) {
    throw new Error(
        `Invalid resource type: ${type}. Allowed: ${VALID_RESOURCE_TYPES.join(", ")}`,
    );
  }

  // Handle capacity safely
  const parsedCapacity = capacity ? Number(capacity) : 1;
  if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
    throw new Error("Capacity must be a positive number.");
  }

  try {
    const res = await pool.query(
        `UPDATE resources 
       SET name = $1, type = $2, capacity = $3, location = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
        [name, type, parsedCapacity, location, id],
    );
    if (res.rows.length === 0) {
      throw new Error("Resource not found to update.");
    }
    return res.rows[0];
  } catch (error) {
    console.error(`Error in updateResource (${id}):`, error);
    throw new Error("Failed to update resource.");
  }
};

// 4. Delete Resource
export const deleteResource = async (id) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      "DELETE FROM project_resources WHERE resource_id = $1",
      [id],
    );

    const res = await client.query(
      "DELETE FROM resources WHERE id = $1 RETURNING id",
      [id],
    );
    if (res.rows.length === 0) {
      throw new Error("Resource not found to delete.");
    }

    await client.query("COMMIT");
    return { success: true, id };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`Error in deleteResource (${id}):`, error);
    throw new Error("Failed to delete resource.");
  } finally {
    client.release();
  }
};

// 4. Get Pending Bookings
export const getPendingBookings = async () => {
  try {
    const res = await pool.query(`
      SELECT b.*, r.name as resource_name, r.type 
      FROM resource_bookings b
      JOIN resources r ON b.resource_id = r.id
      WHERE b.status = 'pending'
      ORDER BY b.created_at ASC
    `);
    return res.rows;
  } catch (error) {
    console.error("Error in getPendingBookings:", error);
    throw new Error("Failed to fetch pending bookings.");
  }
};

// 5. Update Booking Status
export const updateBookingStatus = async (id, status) => {
  // Validation
  if (!VALID_BOOKING_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  try {
    const res = await pool.query(
      "UPDATE resource_bookings SET status = $1 WHERE id = $2 RETURNING *",
      [status, id],
    );

    if (res.rows.length === 0) {
      throw new Error("Booking not found.");
    }
    return res.rows[0];
  } catch (error) {
    console.error(`Error in updateBookingStatus (${id}, ${status}):`, error);
    throw new Error("Failed to update booking status.");
  }
};

// 6. Get Resource Stats
export const getResourceStats = async () => {
  try {
    const res = await pool.query(`
      SELECT project_name, COUNT(*) as bookings_count 
      FROM resource_bookings 
      WHERE status = 'approved' 
      GROUP BY project_name
    `);

    return res.rows.map((row) => ({
      project_name: row.project_name,
      bookings_count: parseInt(row.bookings_count) || 0,
    }));
  } catch (error) {
    console.error("Error in getResourceStats:", error);
    throw new Error("Failed to fetch resource stats.");
  }
};

