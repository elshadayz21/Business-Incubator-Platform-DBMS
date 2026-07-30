import db from "../../config/db.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import os from "os";

// Get all workshops
export const getAllWorkshops = async () => {
  try {
    const query = `
      SELECT w.id,
             w.title,
             w.description,
             w.mentor_name as mentor,
             w.location,
             w.start_date as "startDate",
             w.end_date as "endDate",
             w.start_time as "startTime",
             w.end_time as "endTime",
             w.capacity,
             w.status,
             w.created_at as "createdAt",
             COUNT(we.id)::integer as "enrolledCount"
      FROM workshops w
      LEFT JOIN workshop_enrollments we ON w.id = we.workshop_id
      GROUP BY w.id, w.title, w.description, w.mentor_name, w.location, w.start_date, w.end_date, w.start_time, w.end_time, w.capacity, w.status, w.created_at
      ORDER BY w.created_at DESC
    `;

    console.log("Executing getAllWorkshops query...");
    const result = await db.query(query);
    console.log("Database returned workshops:", result.rows);
    console.log(`Total workshops found: ${result.rows.length}`);

    if (result.rows.length === 0) {
      console.warn("⚠️ No workshops found in database");
    }

    return result.rows;
  } catch (error) {
    console.error("❌ Error fetching workshops:", error.message);
    console.error("Full error:", error);
    throw error;
  }
};

// Get single workshop
export const getWorkshop = async (id) => {
  try {
    const workshopQuery = `
      SELECT w.id,
             w.title,
             w.description,
             w.mentor_name as mentor,
             w.location,
             w.start_date as "startDate",
             w.end_date as "endDate",
             w.start_time as "startTime",
             w.end_time as "endTime",
             w.capacity,
             w.status,
             w.created_at as "createdAt",
             COUNT(we.id)::integer as "enrolledCount"
      FROM workshops w
      LEFT JOIN workshop_enrollments we ON w.id = we.workshop_id
      WHERE w.id = $1
      GROUP BY w.id, w.title, w.description, w.mentor_name, w.location, w.start_date, w.end_date, w.start_time, w.end_time, w.capacity, w.status, w.created_at
    `;

    const workshop = await db.query(workshopQuery, [id]);

    if (workshop.rows.length === 0) {
      throw new Error("Workshop not found");
    }

    console.log(`Workshop ${id} data:`, workshop.rows[0]);

    // Diagnostic: Check raw data in workshop_enrollments
    const diagnosticQuery = `
      SELECT * FROM workshop_enrollments WHERE workshop_id = $1
    `;
    const diagnosticResult = await db.query(diagnosticQuery, [id]);
    console.log(
      `Diagnostic - Raw enrollments for workshop ${id}:`,
      diagnosticResult.rows,
    );

    // Log column names
    if (diagnosticResult.rows.length > 0) {
      console.log(
        `Column names in enrollments:`,
        Object.keys(diagnosticResult.rows[0]),
      );
    }

    // Get enrollments details
    const enrollmentsQuery = `
      SELECT we.id, 
             we.entrepreneur_name as "entrepreneurName", 
             we.entrepreneur_email as "entrepreneurEmail", 
             we.enrollment_date as "enrollmentDate", 
             we.attended,
             we.feedback_rating as "feedbackRating",
             we.feedback_comment as "feedbackComment"
      FROM workshop_enrollments we
      WHERE we.workshop_id = $1
      ORDER BY we.enrollment_date DESC
    `;

    console.log(`Querying enrollments for workshop ${id}`);
    const enrollments = await db.query(enrollmentsQuery, [id]);

    console.log(`Workshop ${id} enrollments count:`, enrollments.rows.length);
    console.log(
      `Workshop ${id} enrollments JSON:`,
      JSON.stringify(enrollments.rows, null, 2),
    );

    return {
      ...workshop.rows[0],
      enrollments: enrollments.rows || [],
    };
  } catch (error) {
    console.error("Error fetching workshop:", error);
    throw error;
  }
};

// Create workshop
export const createWorkshop = async (workshopData) => {
  try {
    const {
      title,
      description,
      mentor,
      startDate,
      endDate,
      startTime,
      endTime,
      capacity,
      location,
      status = "scheduled",
    } = workshopData;

    if (!title || !description || !mentor || !capacity || !location) {
      throw new Error("All required fields must be provided");
    }

    const query = `
      INSERT INTO workshops 
      (title, description, mentor_name, start_date, end_date, start_time, end_time, capacity, location, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;

    const result = await db.query(query, [
      title,
      description,
      mentor,
      startDate,
      endDate,
      startTime,
      endTime,
      capacity,
      location,
      status,
    ]);

    return result.rows[0];
  } catch (error) {
    console.error("Error creating workshop:", error);
    throw error;
  }
};

// Update workshop
export const updateWorkshop = async (id, workshopData) => {
  try {
    const {
      title,
      description,
      mentor,
      startDate,
      endDate,
      startTime,
      endTime,
      capacity,
      location,
      status,
    } = workshopData;

    const query = `
      UPDATE workshops
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        mentor_name = COALESCE($3, mentor_name),
        start_date = COALESCE($4, start_date),
        end_date = COALESCE($5, end_date),
        start_time = COALESCE($6, start_time),
        end_time = COALESCE($7, end_time),
        capacity = COALESCE($8, capacity),
        location = COALESCE($9, location),
        status = COALESCE($10, status),
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `;

    const result = await db.query(query, [
      title,
      description,
      mentor,
      startDate,
      endDate,
      startTime,
      endTime,
      capacity,
      location,
      status,
      id,
    ]);

    return result.rows[0];
  } catch (error) {
    console.error("Error updating workshop:", error);
    throw error;
  }
};

// Delete workshop
export const deleteWorkshop = async (id) => {
  try {
    const query = `DELETE FROM workshops WHERE id = $1 RETURNING *`;
    await db.query(query, [id]);
    return { success: true, message: "Workshop deleted successfully" };
  } catch (error) {
    console.error("Error deleting workshop:", error);
    throw error;
  }
};

// Track attendance
export const trackAttendance = async (enrollmentId, attended) => {
  try {
    const query = `
      UPDATE workshop_enrollments
      SET attended = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    await db.query(query, [attended, enrollmentId]);
    return { success: true, message: "Attendance recorded" };
  } catch (error) {
    console.error("Error tracking attendance:", error);
    throw error;
  }
};

// Submit feedback
export const submitFeedback = async (enrollmentId, feedbackData) => {
  try {
    const { workshopId, entrepreneurId, rating, comment } = feedbackData;

    // Check if feedback already exists
    const existingQuery = `
      SELECT * FROM workshop_feedback
      WHERE enrollment_id = $1
    `;

    const existing = await db.query(existingQuery, [enrollmentId]);

    if (existing.rows.length > 0) {
      // Update existing feedback
      const updateQuery = `
        UPDATE workshop_feedback
        SET rating = $1, comment = $2, updated_at = NOW()
        WHERE enrollment_id = $3
        RETURNING *
      `;

      const result = await db.query(updateQuery, [
        rating,
        comment,
        enrollmentId,
      ]);

      return {
        success: true,
        message: "Feedback updated",
        data: result.rows[0],
      };
    }

    // Insert new feedback
    const insertQuery = `
      INSERT INTO workshop_feedback 
      (enrollment_id, workshop_id, entrepreneur_id, rating, comment, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      enrollmentId,
      workshopId,
      entrepreneurId,
      rating,
      comment,
    ]);

    return {
      success: true,
      message: "Feedback submitted",
      data: result.rows[0],
    };
  } catch (error) {
    console.error("Error submitting feedback:", error);
    throw error;
  }
};

// Get workshop enrollments
export const getWorkshopEnrollments = async (workshopId) => {
  try {
    const query = `
      SELECT we.id, 
             we.entrepreneur_name, 
             we.entrepreneur_email, 
             we.enrollment_date, 
             we.attended,
             wf.rating as "feedbackRating",
             wf.comment as "feedbackComment"
      FROM workshop_enrollments we
      LEFT JOIN workshop_feedback wf ON we.id = wf.enrollment_id
      WHERE we.workshop_id = $1
      ORDER BY we.enrollment_date DESC
    `;

    const result = await db.query(query, [workshopId]);

    return result.rows;
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    throw error;
  }
};

// Get attendance report
export const getAttendanceReport = async () => {
  try {
    const query = `
      SELECT w.title, w.capacity,
             COUNT(we.id) as "totalEnrolled",
             COUNT(CASE WHEN we.attended = true THEN 1 END) as "totalAttended",
             COUNT(CASE WHEN we.attended = false THEN 1 END) as "totalAbsent",
             ROUND(CAST(COUNT(CASE WHEN we.attended = true THEN 1 END) AS NUMERIC) / 
                   COUNT(we.id) * 100, 2) as "attendanceRate"
      FROM workshops w
      LEFT JOIN workshop_enrollments we ON w.id = we.workshop_id
      GROUP BY w.id, w.title, w.capacity
      ORDER BY w.created_at DESC
    `;

    const result = await db.query(query);

    return result.rows;
  } catch (error) {
    console.error("Error fetching attendance report:", error);
    throw error;
  }
};

// Get feedback report
export const getFeedbackReport = async () => {
  try {
    const query = `
      SELECT w.title,
             COUNT(wf.id) as "totalFeedback",
             ROUND(AVG(wf.rating)::NUMERIC, 2) as "averageRating",
             w.capacity,
             COUNT(we.id) as "totalEnrolled"
      FROM workshops w
      LEFT JOIN workshop_enrollments we ON w.id = we.workshop_id
      LEFT JOIN workshop_feedback wf ON we.id = wf.enrollment_id
      GROUP BY w.id, w.title, w.capacity
      HAVING COUNT(wf.id) > 0
      ORDER BY "averageRating" DESC
    `;

    const result = await db.query(query);

    return result.rows;
  } catch (error) {
    console.error("Error fetching feedback report:", error);
    throw error;
  }
};

// Export attendance report as PDF
export const exportAttendanceReportPDF = async () => {
  try {
    const query = `
      SELECT w.id, w.title, w.mentor_name, w.start_date, w.end_date,
             COUNT(we.id) as "totalEnrolled",
             COUNT(CASE WHEN we.attended = true THEN 1 END) as "totalAttended",
             ROUND(CAST(COUNT(CASE WHEN we.attended = true THEN 1 END) AS NUMERIC) / 
                   NULLIF(COUNT(we.id), 0) * 100, 2) as "attendanceRate"
      FROM workshops w
      LEFT JOIN workshop_enrollments we ON w.id = we.workshop_id
      GROUP BY w.id, w.title, w.mentor_name, w.start_date, w.end_date
      ORDER BY w.created_at DESC
    `;

    const data = await db.query(query);

    // Create PDF
    const doc = new PDFDocument();

    const downloadsPath = path.join(os.homedir(), "Downloads");
    const fileName = `attendance-report-${new Date().toISOString().split("T")[0]}.pdf`;
    const filePath = path.join(downloadsPath, fileName);

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Title
    doc.fontSize(24).font("Helvetica-Bold").text("Workshop Attendance Report", {
      align: "center",
    });

    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Generated: ${new Date().toLocaleDateString()}`, {
        align: "center",
      });

    doc.moveDown(1);

    // Table Headers
    const tableTop = doc.y;
    const col1X = 50;
    const col2X = 150;
    const col3X = 250;
    const col4X = 350;
    const col5X = 450;

    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Workshop", col1X, tableTop);
    doc.text("Mentor", col2X, tableTop);
    doc.text("Enrolled", col3X, tableTop);
    doc.text("Attended", col4X, tableTop);
    doc.text("Rate %", col5X, tableTop);

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    doc.font("Helvetica").fontSize(9);
    let currentY = tableTop + 20;

    data.rows.forEach((row) => {
      if (currentY > 750) {
        doc.addPage();
        currentY = 50;
      }

      doc.text((row.title || "").substring(0, 15), col1X, currentY);
      doc.text((row.mentor_name || "-").substring(0, 12), col2X, currentY);
      doc.text(row.totalEnrolled.toString(), col3X, currentY);
      doc.text(row.totalAttended.toString(), col4X, currentY);
      doc.text((row.attendanceRate || 0).toString() + "%", col5X, currentY);

      currentY += 15;
    });

    // Wait for PDF to finish writing
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
      doc.end();
    });

    return filePath;
  } catch (error) {
    console.error("Error exporting attendance report:", error);
    throw error;
  }
};

// Export feedback report as PDF
export const exportFeedbackReportPDF = async () => {
  try {
    const query = `
      SELECT w.title, w.mentor_name,
             COUNT(wf.id) as "totalFeedback",
             ROUND(AVG(wf.rating)::NUMERIC, 2) as "averageRating",
             COUNT(CASE WHEN wf.rating >= 4 THEN 1 END) as "positiveFeedback",
             COUNT(CASE WHEN wf.rating <= 3 THEN 1 END) as "negativeFeedback"
      FROM workshops w
      LEFT JOIN workshop_enrollments we ON w.id = we.workshop_id
      LEFT JOIN workshop_feedback wf ON we.id = wf.enrollment_id
      GROUP BY w.id, w.title, w.mentor_name
      HAVING COUNT(wf.id) > 0
      ORDER BY "averageRating" DESC
    `;

    const data = await db.query(query);

    // Create PDF
    const doc = new PDFDocument();

    const downloadsPath = path.join(os.homedir(), "Downloads");
    const fileName = `feedback-report-${new Date().toISOString().split("T")[0]}.pdf`;
    const filePath = path.join(downloadsPath, fileName);

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Title
    doc.fontSize(24).font("Helvetica-Bold").text("Workshop Feedback Report", {
      align: "center",
    });

    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Generated: ${new Date().toLocaleDateString()}`, {
        align: "center",
      });

    doc.moveDown(1);

    // Table Headers
    const tableTop = doc.y;
    const col1X = 50;
    const col2X = 150;
    const col3X = 250;
    const col4X = 350;
    const col5X = 450;

    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Workshop", col1X, tableTop);
    doc.text("Mentor", col2X, tableTop);
    doc.text("Feedback Count", col3X, tableTop);
    doc.text("Avg Rating", col4X, tableTop);
    doc.text("Positive", col5X, tableTop);

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    doc.font("Helvetica").fontSize(9);
    let currentY = tableTop + 20;

    data.rows.forEach((row) => {
      if (currentY > 750) {
        doc.addPage();
        currentY = 50;
      }

      doc.text((row.title || "").substring(0, 15), col1X, currentY);
      doc.text((row.mentor_name || "-").substring(0, 12), col2X, currentY);
      doc.text(row.totalFeedback.toString(), col3X, currentY);
      doc.text(row.averageRating.toString() + "⭐", col4X, currentY);
      doc.text(row.positiveFeedback.toString(), col5X, currentY);

      currentY += 15;
    });

    // Wait for PDF to finish writing
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
      doc.end();
    });

    return filePath;
  } catch (error) {
    console.error("Error exporting feedback report:", error);
    throw error;
  }
};

