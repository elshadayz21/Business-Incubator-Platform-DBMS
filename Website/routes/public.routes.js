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

export { router as publicRoutes };