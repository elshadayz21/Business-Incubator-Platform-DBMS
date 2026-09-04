import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import session from "express-session";
import flash from "connect-flash";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import connectPgSimpleImport from "connect-pg-simple";
import pool from "./config/db.js";
import { GlobalRouter } from "./routes/index.js";
import { csrfProtection } from "./middleware/csrf.middleware.js";
import { corsOptions } from "./config/corsOptions.js";
import logger from "./utils/logger.js";
import adminApiRoutes from "./routes/admin-api.js";
import portalApiRoutes from "./routes/portal-api.js";
import path from "path";
import { publicRoutes } from "./routes/public.routes.js";
import {
    get404,
    get500,
    get429,
} from "./controllers/error/error.controller.js";
import { initWorkshopJobs } from "./utils/jobs.js";
import { scheduleApplicationReminderJob } from "./utils/applicationReminders.js";
import { getImpactStats } from "./utils/impactStats.js";
import "./subscribers/subscribers.js";

const app = express();
const pgSession = connectPgSimpleImport(session);

// Render/Cloudflare terminate TLS in front of Express, so the app sees HTTP on
// its internal network. Without this, `req.secure` is false and the
// `secure: true` session cookie is never issued -> logins can't persist.
app.set("trust proxy", 1);

app.set("view engine", "ejs");

// CSP is scoped to the external resources this app actually loads (Google
// Fonts, Font Awesome via cdnjs, Alpine.js via jsdelivr). `unsafe-inline` is
// kept for script/style because the EJS views still use inline onclick
// handlers and <style> blocks in several places; tightening that further
// requires migrating those to external listeners/nonces as a follow-up.
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
                scriptSrcAttr: ["'unsafe-inline'"],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://fonts.googleapis.com",
                    "https://cdnjs.cloudflare.com",
                ],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                frameAncestors: ["'self'"],
                formAction: ["'self'"],
                upgradeInsecureRequests: [],
            },
        },
    }),
);

app.use(morgan("dev"));

// Structured HTTP access logs via Winston (used in non-development environments).
if (process.env.NODE_ENV !== "development") {
  app.use(
    morgan("combined", {
      stream: {
        write: (message) =>
          logger.http(message.trim(), { route: "http-access" }),
      },
    }),
  );
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));

app.use(express.static("public"));
app.use("/admin", express.static(path.resolve("public/admin"), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
    }
}));

import { setupMiddleware } from "./middleware/setup.middleware.js";
app.use(setupMiddleware);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    handler: (req, res, next, options) => {
        if (req.originalUrl.startsWith("/api/")) {
            return res.status(429).json({ error: "Too many requests. Please wait a moment before trying again." });
        }
        get429(req, res);
    },

    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

app.use(
    session({
        store: new pgSession({
            pool: pool,
            tableName: "session",
        }),
        secret: process.env.SESSION_SECRET || "default-secret",
        resave: false,
        saveUninitialized: false,
        name: "repodoctor.sid",
        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 30 * 60 * 1000,
            sameSite: "lax",
        },
        rolling: true,
    }),
);

app.use(flash());

app.use(csrfProtection);

// CRITICAL: This middleware MUST be before the routes. It provides the 'routes' variable to header.ejs
app.use((req, res, next) => {
    res.locals.csrfToken = req.session?.csrfToken || "";
    res.locals.routes = {
        signupRoute: "/v1/auth/signup",
        loginRoute: "/admin",
        mentors: "/v1/mentors",
        about: "/v1/about",
        workshops: "/v1/workshop",
        gallery: "/v1/gallery",
        projects: "/v1/projects",
        funding: "/v1/funding",
    };

    res.locals.user = req.session?.userId ? { role: req.session.userRole } : null;
    res.locals.signedIn = Boolean(req.session?.userId);
    next();
});


// Restrict logged-in users ONLY from accessing the home page ("/")
app.use((req, res, next) => {
    if (req.method === 'GET' && req.session?.userId && req.path === '/') {
        return res.redirect('/admin');
    }
    next();
});

app.get("/", async (req, res) => {
    try {
        const limit = 3;
        const [galleryRes, impactStats] = await Promise.all([
            pool.query(
                `SELECT id, title, description, image_url, video_url, category, display_order, created_at
                 FROM gallery_items
                 WHERE is_published = true
                 ORDER BY display_order ASC, created_at DESC
                 LIMIT $1`,
                [limit]
            ),
            getImpactStats(),
        ]);

        const homePhotos = galleryRes.rows.map((item) => ({
            id: item.id,
            url: item.image_url,
            video_url: item.video_url || "",
            title: item.title,
            description: item.description || "",
            category: item.category || "General",
            created_at: item.created_at,
        }));

        res.render("index", { homePhotos, impactStats });
    } catch (err) {
        console.error('Error loading homepage gallery:', err);
        res.render("index", { homePhotos: [], impactStats: { startupsSupported: 0, mentorConnections: 0, cohortsPerYear: 2 } });
    }
});

// Dedicated Apply Page
// Looked up by slug ("/apply/summer-2026-founder-cohort"), the readable
// public URL. Falls back to a bare numeric id ("/apply/7") so any old
// links generated before slugs existed still work. Also pulls in any
// documents the admin attached when creating the announcement, so
// apply.ejs has something to render its "Please review the attached
// document(s)" link list from.
app.get("/apply/:idOrSlug", async (req, res) => {
    try {
        const { idOrSlug } = req.params;
        const asId = /^\d+$/.test(idOrSlug) ? parseInt(idOrSlug, 10) : null;

        const result = await pool.query(
            `SELECT a.*,
                    COALESCE(
                      (SELECT json_agg(json_build_object('id', d.id, 'url', d.url, 'filename', d.filename, 'slug', d.slug) ORDER BY d.id)
                       FROM announcement_documents d WHERE d.announcement_id = a.id),
                      '[]'
                    ) AS documents
             FROM announcements a
             WHERE (a.slug = $1 OR a.id = $2) AND a.is_open_call = true`,
            [idOrSlug, asId]
        );

        if (result.rows.length === 0) {
            return res.status(404).send("Open call not found.");
        }

        const announcement = result.rows[0];
        if ((!announcement.documents || announcement.documents.length === 0) && announcement.document_url) {
            announcement.documents = [{ id: null, url: announcement.document_url, filename: null, slug: null }];
        }

        res.render("apply", { announcement });
    } catch (error) {
        console.error("Error fetching apply page:", error);
        res.status(500).send("Server Error");
    }
});

// Document Viewer Page
// Public page for a single document attached to a published announcement,
// at a descriptive URL derived from the file's own name (e.g.
// /documents/business-plan-pdf) rather than its raw storage path. Only
// documents belonging to a published announcement are reachable here.
app.get("/documents/:slug", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT d.id, d.url, d.filename, d.slug,
                    a.title AS announcement_title, a.slug AS announcement_slug,
                    a.is_open_call
             FROM announcement_documents d
             JOIN announcements a ON a.id = d.announcement_id
             WHERE d.slug = $1 AND a.is_published = true`,
            [req.params.slug]
        );

        if (result.rows.length === 0) {
            return res.status(404).render("error/error", {
                title: "Document Not Found",
                statusCode: "404",
                message: "That document doesn't exist, or isn't attached to a published announcement anymore.",
                color: "#FFDE59",
                icon: "fa-solid fa-file-circle-question",
                redirectLink: "/",
                buttonText: "Back to Home",
            });
        }

        res.render("documents/document-view", { document: result.rows[0] });
    } catch (error) {
        console.error("Error fetching document page:", error);
        res.status(500).send("Server Error");
    }
});
// Partners info now lives in the "#partners" section on the homepage.

app.use("/v1", GlobalRouter);
app.use("/api/admin", adminApiRoutes);
app.use("/api/portal", portalApiRoutes);
app.use("/api/public", publicRoutes);

app.get(/^\/admin(\/.*)?$/, (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.resolve("public/admin/index.html"));
});

app.get("/contact", (req, res) => {
    res.render("contact");
});

app.use(get404);
app.use(get500);

initWorkshopJobs();
scheduleApplicationReminderJob();

export default app;