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
import "./subscribers/subscribers.js";

const app = express();
const pgSession = connectPgSimpleImport(session);

app.set("view engine", "ejs");

app.use(helmet({ contentSecurityPolicy: false }));

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
app.use(cors({ origin: true, credentials: true }));

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
        const galleryRes = await pool.query(
            `SELECT id, title, description, image_url, video_url, category, display_order, created_at
             FROM gallery_items
             WHERE is_published = true
             ORDER BY display_order ASC, created_at DESC
             LIMIT $1`,
            [limit]
        );

        const homePhotos = galleryRes.rows.map((item) => ({
            id: item.id,
            url: item.image_url,
            video_url: item.video_url || "",
            title: item.title,
            description: item.description || "",
            category: item.category || "General",
            created_at: item.created_at,
        }));

        res.render("index", { homePhotos });
    } catch (err) {
        console.error('Error loading homepage gallery:', err);
        res.render("index", { homePhotos: [] });
    }
});

// Dedicated Apply Page
app.get("/apply/:id", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM announcements WHERE id = $1 AND is_open_call = true", [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).send("Open call not found.");
        }

        res.render("apply", { announcement: result.rows[0] });
    } catch (error) {
        console.error("Error fetching apply page:", error);
        res.status(500).send("Server Error");
    }
});
// Partners Page
app.get("/partners", (req, res) => {
    res.render("partners");
});

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

export default app;