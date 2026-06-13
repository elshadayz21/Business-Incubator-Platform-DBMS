import eventBus from "../utils/eventBus.js";
import pool from "../config/db.js";

// Helper to write to activity_logs
async function logActivity(userId, actionType, details) {
  try {
    await pool.query(
      `INSERT INTO activity_logs (user_id, action_type, details, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [userId, actionType, details]
    );
  } catch (err) {
    console.error("[Subscribers] Error logging activity:", err);
  }
}

// Helper to write notifications
async function sendNotification(userId, type, message) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, type, message, read, created_at)
       VALUES ($1, $2, $3, false, NOW())`,
      [userId, type, message]
    );
  } catch (err) {
    console.error("[Subscribers] Error sending notification:", err);
  }
}

// Helper to adjust metrics in analytics_metrics
async function adjustMetric(metricKey, amount) {
  try {
    await pool.query(
      `INSERT INTO analytics_metrics (metric_key, metric_value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (metric_key) DO UPDATE
       SET metric_value = analytics_metrics.metric_value + $2, updated_at = NOW()`,
      [metricKey, amount]
    );
  } catch (err) {
    console.error("[Subscribers] Error adjusting metric:", err);
  }
}

// 1. Auth Login
eventBus.on("auth.login", async ({ user }) => {
  if (!user) return;
  await logActivity(user.id, "auth.login", `User ${user.name} (${user.role}) logged in successfully.`);
});

// 2. Project Created
eventBus.on("project.created", async ({ project, userId }) => {
  if (!project || !userId) return;
  await logActivity(userId, "project.created", `Project '${project.name}' was created.`);
  await adjustMetric("total_projects", 1);
  await sendNotification(userId, "project", `Your project '${project.name}' has been successfully submitted and is pending review.`);
});

// 3. Funding Requested
eventBus.on("funding.requested", async ({ request, userId }) => {
  if (!request) return;

  let projectName = "unknown project";
  try {
    const res = await pool.query("SELECT name FROM projects WHERE id = $1", [request.project_id]);
    if (res.rows[0]) projectName = res.rows[0].name;
  } catch (e) {
    console.error(e);
  }

  let investorName = "unknown investor";
  if (request.investor_id) {
    try {
      const res = await pool.query("SELECT name FROM users WHERE id = $1", [request.investor_id]);
      if (res.rows[0]) investorName = res.rows[0].name;
    } catch (e) {
      console.error(e);
    }
  }

  const amountStr = Number(request.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  
  await logActivity(userId, "funding.requested", `Requested funding of ${amountStr} for project '${projectName}' from investor ${investorName}.`);
  await adjustMetric("total_funding_requested", 1);
  await sendNotification(userId, "funding", `You requested funding of ${amountStr} for project '${projectName}' from ${investorName}.`);
  if (request.investor_id) {
    await sendNotification(request.investor_id, "funding", `You have a new funding request of ${amountStr} for project '${projectName}'.`);
  }
});

// 4. Funding Reviewed
eventBus.on("funding.reviewed", async ({ request, reviewer }) => {
  if (!request) return;

  let projectName = "unknown project";
  try {
    const res = await pool.query("SELECT name FROM projects WHERE id = $1", [request.project_id]);
    if (res.rows[0]) projectName = res.rows[0].name;
  } catch (e) {
    console.error(e);
  }

  const amountStr = Number(request.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const reviewerName = reviewer ? reviewer.name : "reviewer";

  await logActivity(reviewer.id, "funding.reviewed", `Marked funding request of ${amountStr} for project '${projectName}' as ${request.status}.`);

  if (request.status && request.status.toLowerCase() === "approved") {
    await adjustMetric("total_funding_approved", 1);
  }

  // Get project entrepreneurs to notify them
  try {
    const res = await pool.query(
      `SELECT user_id FROM project_entrepreneurs WHERE project_id = $1`,
      [request.project_id]
    );
    for (const row of res.rows) {
      await sendNotification(
        row.user_id,
        "funding",
        `Your funding request of ${amountStr} for project '${projectName}' has been ${request.status} by ${reviewerName}.`
      );
    }
  } catch (err) {
    console.error("[Subscribers] Error fetching project entrepreneurs:", err);
  }
  
  // Notify reviewer/investor
  await sendNotification(
    request.investor_id || reviewer.id,
    "funding",
    `You marked the funding request of ${amountStr} for project '${projectName}' as ${request.status}.`
  );
});

// 5. Workshop Enrolled
eventBus.on("workshop.enrolled", async ({ enrollment }) => {
  if (!enrollment) return;
  
  let workshopTitle = "workshop";
  try {
    const res = await pool.query("SELECT title FROM workshops WHERE id = $1", [enrollment.workshop_id]);
    if (res.rows[0]) workshopTitle = res.rows[0].title;
  } catch (e) {
    console.error(e);
  }

  let userName = "user";
  try {
    const res = await pool.query("SELECT name FROM users WHERE id = $1", [enrollment.user_id]);
    if (res.rows[0]) userName = res.rows[0].name;
  } catch (e) {
    console.error(e);
  }
  
  await logActivity(enrollment.user_id, "workshop.enrolled", `User '${userName}' enrolled in workshop '${workshopTitle}'.`);
  await sendNotification(enrollment.user_id, "workshop", `You have successfully enrolled in the workshop '${workshopTitle}'.`);
});

// 6. Workshop Cancelled
eventBus.on("workshop.cancelled", async ({ enrollment }) => {
  if (!enrollment) return;
  
  let workshopTitle = "workshop";
  try {
    const res = await pool.query("SELECT title FROM workshops WHERE id = $1", [enrollment.workshop_id]);
    if (res.rows[0]) workshopTitle = res.rows[0].title;
  } catch (e) {
    console.error(e);
  }

  let userName = "user";
  try {
    const res = await pool.query("SELECT name FROM users WHERE id = $1", [enrollment.user_id]);
    if (res.rows[0]) userName = res.rows[0].name;
  } catch (e) {
    console.error(e);
  }

  await logActivity(enrollment.user_id, "workshop.cancelled", `User '${userName}' cancelled enrollment in workshop '${workshopTitle}'.`);
  await sendNotification(enrollment.user_id, "workshop", `Your enrollment in the workshop '${workshopTitle}' has been cancelled.`);
});

// 7. Mentor Session Booked
eventBus.on("mentor.session_booked", async ({ mentorId, date, time, notes, userId }) => {
  let userName = "entrepreneur";
  try {
    const res = await pool.query("SELECT name FROM users WHERE id = $1", [userId]);
    if (res.rows[0]) userName = res.rows[0].name;
  } catch (e) {
    console.error(e);
  }

  let mentorName = "mentor";
  try {
    const res = await pool.query("SELECT name FROM users WHERE id = $1", [mentorId]);
    if (res.rows[0]) mentorName = res.rows[0].name;
  } catch (e) {
    console.error(e);
  }

  await logActivity(userId, "mentor.session_booked", `Booked session with mentor '${mentorName}' on ${date} at ${time}.`);
  await sendNotification(userId, "mentor", `You successfully booked a session with ${mentorName} on ${date} at ${time}.`);
  await sendNotification(mentorId, "mentor", `Entrepreneur '${userName}' booked a mentoring session with you on ${date} at ${time}. Notes: ${notes}`);
});

console.log("[Subscribers] Decoupled domain subscribers initialized and listening.");
