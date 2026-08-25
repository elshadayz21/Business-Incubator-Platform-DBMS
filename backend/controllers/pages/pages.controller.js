import { getAllMentors } from "../../models/mentors/mentors.model.js";
import {
  getAllWorkshopsQuery,
  getWorkshopByIdQuery,
  checkEnrollmentQuery,
} from "../../models/workshop/Workshop.js";
import eventBus from "../../utils/eventBus.js";
import pool from "../../config/db.js";
import fs from "fs";
import path from "path";
import { getStaticPageBySlug } from "../../admin-backend/content/staticPages.js";
import { parseStaticPageBody } from "../../utils/parseStaticPageBody.js";

export const getStaticPage = async (req, res, next) => {
  try {
    const page = await getStaticPageBySlug(req.params.slug);
    if (!page) {
      return res.status(404).render("error/error", {
        title: "Not Found", statusCode: "404",
        message: "This page doesn't exist.",
        color: "#FFDE59", icon: "fa-solid fa-file",
        redirectLink: "/", buttonText: "Back to Home",
      });
    }
    const sections = parseStaticPageBody(page.body);
    res.render("pages/static-page", {
      title: `${page.title} | DxValley`,
      page,
      sections,
    });
  } catch (err) {
    next(err);
  }
};

// --- Mentors Page ---
export const getMentorsPage = async (req, res, next) => {
  try {
    const dbMentors = await getAllMentors();

    const mentors = dbMentors.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.expertise || "Expert Mentor",
      company: m.company || "Incubator",
      image: m.profile_image || "/assets/images/default-avatar.svg",
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

// --- Gallery Page ---
export const getGalleryPage = async (req, res) => {
  const { category, q } = req.query;
  let photos = [];
  try {
    const params = [];
    const where = ["is_published = true"];

    if (category && category !== 'all') {
      params.push(category);
      where.push(`category = $${params.length}`);
    }

    if (q) {
      params.push(`%${q}%`);
      where.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const sql = `SELECT id, title, description, image_url, category, display_order, created_at, updated_at
                 FROM gallery_items
                 ${whereSQL}
                 ORDER BY display_order ASC, created_at DESC`;

    const result = await pool.query(sql, params);

    const dbPhotos = result.rows.map((item) => ({
      id: item.id,
      url: item.image_url,
      title: item.title,
      description: item.description || "",
      category: item.category || "General",
      created_at: item.created_at,
      updated_at: item.updated_at,
      display_order: item.display_order,
    }));

    photos = dbPhotos;

    // derive categories from DB photos (unique)
    const categoriesSet = new Set(dbPhotos.map((p) => p.category || 'General'));
    const categories = ['All', ...Array.from(categoriesSet)];

    res.render('pages/gallery', {
      title: 'Gallery | DxValley Incubation Center',
      photos,
      categories,
      selectedCategory: category || 'all',
      q: q || '',
    });
  } catch (err) {
    console.error('Gallery Page Error:', err);
    res.render('pages/gallery', {
      title: 'Gallery | DxValley Incubation Center',
      photos: [],
      categories: ['All'],
      selectedCategory: 'all',
      q: '',
    });
  }
};

// --- About Page ---
export const getAboutPage = async (req, res, next) => {
  try {
    const page = await getStaticPageBySlug("about");
    if (page && page.body) {
      const sections = parseStaticPageBody(page.body);
      return res.render("pages/static-page", {
        title: `${page.title} | DxValley`,
        page,
        sections,
      });
    }
    res.render("pages/about", { title: "About DxValley | Incubation Center" });
  } catch (err) {
    next(err);
  }
};

// --- Terms & Conditions Page ---
export const getTermsPage = async (req, res, next) => {
  try {
    const page = await getStaticPageBySlug("terms");
    if (page && page.body) {
      const sections = parseStaticPageBody(page.body);
      return res.render("pages/static-page", {
        title: `${page.title} | DxValley`,
        page,
        sections,
      });
    }
    res.render("pages/terms", {
      title: "Terms & Conditions | DxValley Incubation Center",
    });
  } catch (err) {
    next(err);
  }
};
