import { Router } from "express";
import pool from "../config/db.js";
import { founderRespondToFunding } from "../admin-backend/funding/funding.js";

const router = Router();

// POST: Contact Us Form
router.post("/contact", async (req, res) => {
    try {
        const { name, email, message } = req.body;
        await pool.query(
            "INSERT INTO public_submissions (type, name, email, message) VALUES ('contact', $1, $2, $3)",
            [name, email, message]
        );
        res.status(201).json({ success: true, message: "Message sent successfully!" });
    } catch (error) {
        console.error("Contact form error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// POST: Newsletter Subscribe Form
router.post("/subscribe", async (req, res) => {
    try {
        const { email } = req.body;
        await pool.query(
            "INSERT INTO public_submissions (type, email) VALUES ('newsletter', $1)",
            [email]
        );
        res.status(201).json({ success: true, message: "Subscribed successfully!" });
    } catch (error) {
        console.error("Subscribe form error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


// GET ALL ANNOUNCEMENTS (Public)
router.get("/announcements", async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT a.*, 
             (SELECT COUNT(*) FROM applications app WHERE app.announcement_id = a.id) as application_count 
      FROM announcements a 
      WHERE a.is_published = true 
      ORDER BY a.created_at DESC 
      LIMIT 5
    `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching announcements:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// GET PUBLISHED GALLERY ITEMS (Public)
router.get("/gallery", async (req, res) => {
    try {
        const { category, q } = req.query;
        // Build parameterized query
        const params = [];
        const whereClauses = ["is_published = true"];

        if (category) {
            params.push(category);
            whereClauses.push(`category = $${params.length}`);
        }

        if (q) {
            // search in title and description, case-insensitive
            params.push(`%${q}%`);
            whereClauses.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`);
        }

        const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

        const sql = `SELECT id, title, description, image_url, video_url, category, display_order, created_at, updated_at
                     FROM gallery_items
                     ${whereSQL}
                     ORDER BY display_order ASC, created_at DESC`;

        const result = await pool.query(sql, params);
        // Return rows directly in the same format as other public routes
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching gallery:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// POST: Application Form
router.post("/apply", async (req, res) => {
    try {
        let { announcement_id, full_name, email, phone, background, startup_idea, answers } = req.body;

        // 1. Check if capacity is reached
        const annRes = await pool.query("SELECT is_open_call, capacity, deadline FROM announcements WHERE id = $1", [announcement_id]);
        if (annRes.rows.length === 0) return res.status(404).json({ message: "Announcement not found." });

        const ann = annRes.rows[0];
        if (!ann.is_open_call) return res.status(403).json({ message: "Applications are not enabled for this post." });
        if (ann.deadline && new Date(ann.deadline) < new Date()) return res.status(403).json({ message: "The application deadline has passed." });

        if (ann.capacity) {
            const countRes = await pool.query("SELECT COUNT(*) FROM applications WHERE announcement_id = $1", [announcement_id]);
            if (parseInt(countRes.rows[0].count) >= ann.capacity) {
                return res.status(403).json({ message: "Maximum application capacity reached. Applications are now closed." });
            }
        }

        // 2. SCAN DYNAMIC ANSWERS FOR EMAIL AND NAME!
        const fieldsRes = await pool.query("SELECT id, field_type FROM form_fields WHERE announcement_id = $1", [announcement_id]);
        const fields = fieldsRes.rows;

        let parsedAnswers = answers || {};

        for (const field of fields) {
            const answerKey = `custom_${field.id}`;
            const userAnswer = parsedAnswers[answerKey];

            if (userAnswer) {
                if (field.field_type === 'email') {
                    email = userAnswer;
                } else if (field.field_type === 'name') {
                    full_name = userAnswer;
                } else if (field.field_type === 'idea') {
                    startup_idea = userAnswer;
                }
            }
        }

        // 3. Save the application
        await pool.query(
            `INSERT INTO applications (announcement_id, full_name, email, phone, background, startup_idea, answers) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [announcement_id, full_name || null, email || null, phone || null, background || null, startup_idea || null, JSON.stringify(parsedAnswers)]
        );

        res.status(201).json({ success: true, message: "Application submitted successfully!" });
    } catch (error) {
        console.error("Application form error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


// Entrepreneur Accept/Reject Funding Route
router.put("/funding/:id/respond", async (req, res) => {
    try {
        const { action } = req.body;
        const userId = req.session.userId; // The logged-in entrepreneur

        if (!userId) return res.status(401).json({ message: "Please log in." });
        if (!['Founder Accepted', 'Founder Declined'].includes(action)) {
            return res.status(400).json({ message: "Invalid action." });
        }

        const result = await founderRespondToFunding(req.params.id, userId, action);
        res.json(result);
    } catch (error) {
        console.error("Error responding to funding:", error.message);
        res.status(403).json({ message: error.message });
    }
});


// GET: Active Open Calls (Announcements with a future deadline)
router.get("/open-calls", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, title, content, deadline FROM announcements WHERE deadline IS NOT NULL AND deadline > now() ORDER BY deadline ASC"
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching open calls:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
// GET: Apply Page (Dedicated landing page for an Open Call)
router.get("/apply/:id", async (req, res) => {
    try {
        // 1. Fetch the specific announcement
        const result = await pool.query("SELECT * FROM announcements WHERE id = $1 AND is_open_call = true", [req.params.id]);

        // 2. If it doesn't exist, or isn't an open call, return 404
        if (result.rows.length === 0) {
            return res.status(404).send("Open call not found.");
        }

        // 3. Render the new apply.ejs page!
        res.render("apply", { announcement: result.rows[0] });
    } catch (error) {
        console.error("Error fetching apply page:", error);
        res.status(500).send("Server Error");
    }
});

// GET: Fetch Custom Form Fields for an Announcement
router.get("/form-fields/:announcementId", async (req, res) => {
    try {
        const result = await pool.query("SELECT id, label, field_type, options, required FROM form_fields WHERE announcement_id = $1 ORDER BY created_at ASC", [req.params.announcementId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching form fields:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
//


export { router as publicRoutes };