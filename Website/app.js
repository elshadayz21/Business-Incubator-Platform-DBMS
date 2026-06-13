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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

app.use(express.static("public"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res, next, options) => {
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
      maxAge: 60 * 60 * 1000,
      sameSite: "lax",
    },
    rolling: true,
  }),
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.routes = {
    signupRoute: "/v1/auth/signup",
    loginRoute: "/v1/auth/login",
    mentors: "/v1/mentors",
    about: "/v1/about",
    workshops: "/v1/workshop",
    projects: "/v1/projects",
    funding: "/v1/funding",
  };
  res.locals.user = req.session?.userId ? { role: req.session.userRole } : null;
  next();
});

app.get("/", (req, res) => {
  res.render("index");
});

app.use("/v1", GlobalRouter);

app.use(get404);
app.use(get500);

initWorkshopJobs();

export default app;