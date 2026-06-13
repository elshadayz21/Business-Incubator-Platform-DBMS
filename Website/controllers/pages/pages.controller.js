import { getAllMentors } from "../../models/mentors/mentors.model.js";
import {
  getAllWorkshopsQuery,
  getWorkshopByIdQuery,
  checkEnrollmentQuery,
} from "../../models/workshop/Workshop.js";
import eventBus from "../../utils/eventBus.js";
import pool from "../../config/db.js";

// --- Mentors Page ---
export const getMentorsPage = async (req, res, next) => {
  try {
    const dbMentors = await getAllMentors();

    const mentors = dbMentors.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.expertise || "Expert Mentor",
      company: m.company || "Incubator",
      image: m.profile_image || "/assets/images/default-avatar.png",
      bio: m.bio || "No bio available.",
      color: ["#FFDE59", "#FF90E8", "#5465FF", "#0d9488"][
        Math.floor(Math.random() * 4)
      ],
    }));

    res.render("pages/mentors", {
      title: "Meet Our Mentors",
      mentors: mentors,
    });
  } catch (error) {
    console.error("Mentors Page Error:", error);
    res.status(500).send("Error loading mentors: " + error.message);
  }
};

// --- Book Mentor Session ---
export const bookMentorSession = async (req, res, next) => {
  try {
    const { mentorId, date, time, notes } = req.body;
    if (!mentorId || !date || !time) {
      return res.status(400).json({ success: false, message: "Mentor ID, Date, and Time are required." });
    }

    const mentorRes = await pool.query("SELECT id, name FROM users WHERE id = $1 AND role = 'mentor'", [mentorId]);
    if (mentorRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Mentor not found." });
    }

    eventBus.emit("mentor.session_booked", {
      mentorId: parseInt(mentorId),
      date,
      time,
      notes: notes || "No notes provided.",
      userId: req.user.id
    });

    res.status(200).json({
      success: true,
      message: `Session booked successfully with ${mentorRes.rows[0].name}!`
    });
  } catch (err) {
    console.error("Error booking mentor session:", err);
    next(err);
  }
};

// --- Workshops Page ---
export const getWorkshopsPage = async (req, res, next) => {
  try {
    const workshops = await getAllWorkshopsQuery();
    res.render("pages/workshops", {
      title: "Workshops & Training",
      workshops: workshops,
    });
  } catch (err) {
    console.error("Workshops Page Error:", err);
    res.status(500).send("Error loading workshops: " + err.message);
  }
};

// --- Workshop Detail Page ---
export const getWorkshopDetailPage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workshop = await getWorkshopByIdQuery(id);

    if (!workshop) {
      return res
        .status(404)
        .render("error/error", { message: "Workshop not found", status: 404 });
    }

    let isEnrolled = false;
    let user = null;
    if (req.session && req.session.userId) {
      user = {
        id: req.session.userId,
        name: req.session.userName,
        email: req.session.userEmail,
      };
      const enrollment = await checkEnrollmentQuery(id, req.session.userId);
      isEnrolled = !!enrollment;
    }

    res.render("pages/workshop-detail", {
      title: workshop.title,
      workshop: workshop,
      user: user,
      isEnrolled: isEnrolled,
    });
  } catch (err) {
    next(err);
  }
};

// --- About Page ---
export const getAboutPage = (req, res) => {
  res.render("pages/about", { title: "Who We Are" });
};
