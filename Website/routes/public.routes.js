import { Router } from "express";
import pool from "../config/db.js";

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
        const result = await pool.query("SELECT * FROM announcements WHERE is_published = true ORDER BY created_at DESC LIMIT 5");
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

        const sql = `SELECT id, title, description, image_url, category, display_order, created_at, updated_at
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

export { router as publicRoutes };