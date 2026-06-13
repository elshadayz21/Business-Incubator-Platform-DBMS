import eventBus from "./utils/eventBus.js";
import pool from "./config/db.js";
import "./subscribers/subscribers.js"; // Import to register listeners

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log("=== STARTING SAAS FEATURE VERIFICATION TESTS ===");
  let failed = false;

  // Track initial values of metrics for precise asserts
  let initialTotalProjects = 0;
  let initialTotalFundingRequested = 0;
  let initialTotalFundingApproved = 0;

  try {
    const metricRes = await pool.query("SELECT * FROM analytics_metrics");
    const getMetric = (key) => {
      const metric = metricRes.rows.find(r => r.metric_key === key);
      return metric ? metric.metric_value : 0;
    };
    initialTotalProjects = getMetric("total_projects");
    initialTotalFundingRequested = getMetric("total_funding_requested");
    initialTotalFundingApproved = getMetric("total_funding_approved");
    console.log(`Initial Metrics - Projects: ${initialTotalProjects}, Requested: ${initialTotalFundingRequested}, Approved: ${initialTotalFundingApproved}`);
  } catch (err) {
    console.error("Failed to query initial metrics:", err);
    process.exit(1);
  }

  // 1. Test Auth Login Event
  try {
    console.log("\n[Test 1] Simulating user login event...");
    eventBus.emit("auth.login", {
      user: { id: 1, name: "Ahmed Hassan", role: "entrepreneur" }
    });
    await sleep(200);

    const logRes = await pool.query(
      `SELECT * FROM activity_logs 
       WHERE user_id = 1 AND action_type = 'auth.login' AND details LIKE '%Ahmed Hassan%'
       ORDER BY created_at DESC LIMIT 1`
    );

    if (logRes.rows.length === 1) {
      console.log("✅ SUCCESS: Activity log found for login!");
    } else {
      console.error("❌ FAILURE: No activity log found for login!");
      failed = true;
    }
  } catch (err) {
    console.error("❌ Test 1 Error:", err);
    failed = true;
  }

  // 2. Test Project Created Event
  try {
    console.log("\n[Test 2] Simulating project created event...");
    eventBus.emit("project.created", {
      project: { id: 9999, name: "Test SaaS Project" },
      userId: 1
    });
    await sleep(200);

    // Assert Activity Log
    const logRes = await pool.query(
      `SELECT * FROM activity_logs 
       WHERE user_id = 1 AND action_type = 'project.created' AND details LIKE '%Test SaaS Project%'
       ORDER BY created_at DESC LIMIT 1`
    );
    if (logRes.rows.length === 1) {
      console.log("✅ SUCCESS: Activity log found for project creation!");
    } else {
      console.error("❌ FAILURE: No activity log found for project creation!");
      failed = true;
    }

    // Assert Notification
    const notifRes = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = 1 AND type = 'project' AND message LIKE '%Test SaaS Project%'
       ORDER BY created_at DESC LIMIT 1`
    );
    if (notifRes.rows.length === 1) {
      console.log("✅ SUCCESS: Notification found for project creation!");
    } else {
      console.error("❌ FAILURE: No notification found for project creation!");
      failed = true;
    }

    // Assert Metrics
    const metricRes = await pool.query("SELECT metric_value FROM analytics_metrics WHERE metric_key = 'total_projects'");
    const newMetric = metricRes.rows[0]?.metric_value || 0;
    if (newMetric === initialTotalProjects + 1) {
      console.log(`✅ SUCCESS: metric 'total_projects' incremented to ${newMetric}!`);
    } else {
      console.error(`❌ FAILURE: metric 'total_projects' was not incremented! Expected ${initialTotalProjects + 1}, got ${newMetric}`);
      failed = true;
    }
  } catch (err) {
    console.error("❌ Test 2 Error:", err);
    failed = true;
  }

  // 3. Test Funding Requested Event
  try {
    console.log("\n[Test 3] Simulating funding requested event...");
    // Assume project_id = 1 (exists in db)
    eventBus.emit("funding.requested", {
      request: { id: 9999, project_id: 1, investor_id: 14, amount: 75000 },
      userId: 1
    });
    await sleep(200);

    // Assert Activity Log
    const logRes = await pool.query(
      `SELECT * FROM activity_logs 
       WHERE user_id = 1 AND action_type = 'funding.requested' AND details LIKE '%75,000%'
       ORDER BY created_at DESC LIMIT 1`
    );
    if (logRes.rows.length === 1) {
      console.log("✅ SUCCESS: Activity log found for funding request!");
    } else {
      console.error("❌ FAILURE: No activity log found for funding request!");
      failed = true;
    }

    // Assert Entrepreneur Notification
    const entNotif = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = 1 AND type = 'funding' AND message LIKE '%75,000%'
       ORDER BY created_at DESC LIMIT 1`
    );
    if (entNotif.rows.length === 1) {
      console.log("✅ SUCCESS: Notification found for entrepreneur!");
    } else {
      console.error("❌ FAILURE: No notification found for entrepreneur!");
      failed = true;
    }

    // Assert Investor Notification
    const invNotif = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = 14 AND type = 'funding' AND message LIKE '%75,000%'
       ORDER BY created_at DESC LIMIT 1`
    );
    if (invNotif.rows.length === 1) {
      console.log("✅ SUCCESS: Notification found for investor!");
    } else {
      console.error("❌ FAILURE: No notification found for investor!");
      failed = true;
    }

    // Assert Metrics
    const metricRes = await pool.query("SELECT metric_value FROM analytics_metrics WHERE metric_key = 'total_funding_requested'");
    const newMetric = metricRes.rows[0]?.metric_value || 0;
    if (newMetric === initialTotalFundingRequested + 1) {
      console.log(`✅ SUCCESS: metric 'total_funding_requested' incremented to ${newMetric}!`);
    } else {
      console.error(`❌ FAILURE: metric 'total_funding_requested' was not incremented! Expected ${initialTotalFundingRequested + 1}, got ${newMetric}`);
      failed = true;
    }
  } catch (err) {
    console.error("❌ Test 3 Error:", err);
    failed = true;
  }

  // 4. Test Funding Reviewed Event
  try {
    console.log("\n[Test 4] Simulating funding reviewed (Approved) event...");
    // Assume project_id = 1, investor_id = 14
    eventBus.emit("funding.reviewed", {
      request: { id: 9999, project_id: 1, investor_id: 14, amount: 75000, status: "Approved" },
      reviewer: { id: 14, name: "Sherif Investments" }
    });
    await sleep(200);

    // Assert Activity Log
    const logRes = await pool.query(
      `SELECT * FROM activity_logs 
       WHERE user_id = 14 AND action_type = 'funding.reviewed' AND details LIKE '%Approved%'
       ORDER BY created_at DESC LIMIT 1`
    );
    if (logRes.rows.length === 1) {
      console.log("✅ SUCCESS: Activity log found for funding review!");
    } else {
      console.error("❌ FAILURE: No activity log found for funding review!");
      failed = true;
    }

    // Assert Metrics
    const metricRes = await pool.query("SELECT metric_value FROM analytics_metrics WHERE metric_key = 'total_funding_approved'");
    const newMetric = metricRes.rows[0]?.metric_value || 0;
    if (newMetric === initialTotalFundingApproved + 1) {
      console.log(`✅ SUCCESS: metric 'total_funding_approved' incremented to ${newMetric}!`);
    } else {
      console.error(`❌ FAILURE: metric 'total_funding_approved' was not incremented! Expected ${initialTotalFundingApproved + 1}, got ${newMetric}`);
      failed = true;
    }
  } catch (err) {
    console.error("❌ Test 4 Error:", err);
    failed = true;
  }

  // 5. Test Workshop Enrolled Event
  try {
    console.log("\n[Test 5] Simulating workshop enrolled event...");
    // Assume workshop_id = 1, user_id = 1
    eventBus.emit("workshop.enrolled", {
      enrollment: { workshop_id: 1, user_id: 1 }
    });
    await sleep(200);

    // Assert Activity Log
    const logRes = await pool.query(
      `SELECT * FROM activity_logs 
       WHERE user_id = 1 AND action_type = 'workshop.enrolled' AND details LIKE '%MVP Development Workshop%'
       ORDER BY created_at DESC LIMIT 1`
    );
    if (logRes.rows.length === 1) {
      console.log("✅ SUCCESS: Activity log found for workshop enrollment!");
    } else {
      console.error("❌ FAILURE: No activity log found for workshop enrollment!");
      failed = true;
    }
  } catch (err) {
    console.error("❌ Test 5 Error:", err);
    failed = true;
  }

  // 6. Test Workshop Cancelled Event
  try {
    console.log("\n[Test 6] Simulating workshop cancelled event...");
    eventBus.emit("workshop.cancelled", {
      enrollment: { workshop_id: 1, user_id: 1 }
    });
    await sleep(200);

    // Assert Activity Log
    const logRes = await pool.query(
      `SELECT * FROM activity_logs 
       WHERE user_id = 1 AND action_type = 'workshop.cancelled' AND details LIKE '%MVP Development Workshop%'
       ORDER BY created_at DESC LIMIT 1`
    );
    if (logRes.rows.length === 1) {
      console.log("✅ SUCCESS: Activity log found for workshop cancellation!");
    } else {
      console.error("❌ FAILURE: No activity log found for workshop cancellation!");
      failed = true;
    }
  } catch (err) {
    console.error("❌ Test 6 Error:", err);
    failed = true;
  }

  // 8. Test Mentor Session Booked Event
  try {
    console.log("\n[Test 8] Simulating mentor session booking event...");
    eventBus.emit("mentor.session_booked", {
      mentorId: 11,
      date: "2026-06-20",
      time: "10:30 AM - 11:30 AM",
      notes: "Test MVP Scaling notes",
      userId: 1
    });
    await sleep(200);

    const logRes = await pool.query(
      `SELECT * FROM activity_logs 
       WHERE user_id = 1 AND action_type = 'mentor.session_booked' AND details LIKE '%Dr. Amr Mostafa%'
       ORDER BY created_at DESC LIMIT 1`
    );
    if (logRes.rows.length === 1) {
      console.log("✅ SUCCESS: Activity log found for mentor booking!");
    } else {
      console.error("❌ FAILURE: No activity log found for mentor booking!");
      failed = true;
    }

    const mentorNotif = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = 11 AND type = 'mentor' AND message LIKE '%Test MVP Scaling notes%'
       ORDER BY created_at DESC LIMIT 1`
    );
    if (mentorNotif.rows.length === 1) {
      console.log("✅ SUCCESS: Notification found for mentor!");
    } else {
      console.error("❌ FAILURE: No notification found for mentor!");
      failed = true;
    }
  } catch (err) {
    console.error("❌ Test 8 Error:", err);
    failed = true;
  }

  // 7. Test Global Search Capabilities
  try {
    console.log("\n[Test 7] Testing global search DB query capabilities...");
    // Search workshop by pattern
    const termWorkshop = "MVP";
    const resWorkshop = await pool.query(
      `SELECT title FROM workshops WHERE title ILIKE $1`,
      [`%${termWorkshop}%`]
    );
    if (resWorkshop.rows.length > 0) {
      console.log(`✅ SUCCESS: Search for "${termWorkshop}" matched workshop "${resWorkshop.rows[0].title}"!`);
    } else {
      console.error(`❌ FAILURE: Search for "${termWorkshop}" returned no workshops!`);
      failed = true;
    }

    // Search user/mentor by pattern
    const termMentor = "Amr";
    const resMentor = await pool.query(
      `SELECT name FROM users WHERE role = 'mentor' AND name ILIKE $1`,
      [`%${termMentor}%`]
    );
    if (resMentor.rows.length > 0) {
      console.log(`✅ SUCCESS: Search for "${termMentor}" matched mentor "${resMentor.rows[0].name}"!`);
    } else {
      console.error(`❌ FAILURE: Search for "${termMentor}" returned no mentors!`);
      failed = true;
    }
  } catch (err) {
    console.error("❌ Test 7 Error:", err);
    failed = true;
  }

  // Database Cleanup
  console.log("\nCleaning up test database rows...");
  try {
    // Delete activity logs generated by test
    await pool.query("DELETE FROM activity_logs WHERE details LIKE '%Test SaaS%' OR details LIKE '%Ahmed Hassan%' OR details LIKE '%MVP Development Workshop%' OR details LIKE '%Dr. Amr Mostafa%'");
    
    // Delete notifications generated by test
    await pool.query("DELETE FROM notifications WHERE message LIKE '%Test SaaS%' OR message LIKE '%75,000%' OR message LIKE '%MVP Development Workshop%' OR message LIKE '%mentoring session%' OR message LIKE '%Test MVP Scaling notes%'");

    // Reset metrics to their initial values
    await pool.query("UPDATE analytics_metrics SET metric_value = $1, updated_at = NOW() WHERE metric_key = 'total_projects'", [initialTotalProjects]);
    await pool.query("UPDATE analytics_metrics SET metric_value = $1, updated_at = NOW() WHERE metric_key = 'total_funding_requested'", [initialTotalFundingRequested]);
    await pool.query("UPDATE analytics_metrics SET metric_value = $1, updated_at = NOW() WHERE metric_key = 'total_funding_approved'", [initialTotalFundingApproved]);

    console.log("✅ Cleanup finished successfully!");
  } catch (cleanupErr) {
    console.error("❌ Cleanup failed:", cleanupErr);
  }

  console.log("\n=== FEATURE VERIFICATION RESULTS ===");
  if (failed) {
    console.error("❌ SOME TESTS FAILED. PLEASE CHECK THE ERRORS ABOVE.");
    process.exit(1);
  } else {
    console.log("🎉 ALL TESTS PASSED! Decoupled event bus, analytics engine, subscribers, timeline, and global search are fully functional and verified.");
    process.exit(0);
  }
}

runTests();
