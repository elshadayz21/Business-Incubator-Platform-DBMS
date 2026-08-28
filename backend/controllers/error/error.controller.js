import logger from "../../utils/logger.js";

// 1. 404 Not Found

const getCommonData = (req) => ({
  user: req.session?.userId ? { role: req.session.userRole } : null,
  routes: {
    signupRoute: "/v1/auth/signup",
    loginRoute: "/admin",
  },
});

export const get404 = (req, res) => {
  res.status(404).render("error/error", {
    ...getCommonData(req),
    title: "Page Not Found",
    statusCode: "404",
    message:
      "Oops! It seems you've wandered into uncharted territory. The page you're looking for doesn't exist.",
    color: "#FFDE59",
    icon: "fa-solid fa-map-location-dot",
    redirectLink: "/",
    buttonText: "Back to Home",
  });
};

// 2. 401 Unauthorized
export const get401 = (req, res) => {
  res.status(401).render("error/error", {
    ...getCommonData(req),
    title: "Unauthorized Access",
    statusCode: "401",
    message:
      "Hold up! You need to log in to access this area. Let's get you authenticated first.",
    color: "#FF90E8",
    icon: "fa-solid fa-user-lock",
    redirectLink: "/admin",
    buttonText: "Login Now",
  });
};

// 3. 403 Forbidden
export const get403 = (req, res) => {
  res.status(403).render("error/error", {
    ...getCommonData(req),
    title: "Access Forbidden",
    statusCode: "403",
    message:
      "Sorry, but this area is restricted. You don't have the necessary permissions to view this resource.",
    color: "#2563EB",
    icon: "fa-solid fa-shield-halved",
    redirectLink: "/",
    buttonText: "Go Back Home",
  });
};

// 4. 429 Rate Limiter
export const get429 = (req, res) => {
  res.status(429).render("error/error", {
    ...getCommonData(req), 
    title: "Slow Down!",
    statusCode: "429",
    message:
      "Too many requests. You're clicking too fast! Please take a breather and try again later.",
    color: "#FFA500",
    icon: "fa-solid fa-hourglass-half",
    redirectLink: "/",
    buttonText: "Go Home",
  });
};

// 5. 500 Internal Server Error
export const get500 = (err, req, res, next) => {
  logger.error("SERVER ERROR:", err);
  res.status(500).render("error/error", {
    ...getCommonData(req),
    title: "Server Error",
    statusCode: "500",
    message:
      "Ouch! Something went wrong on our end. We're working on fixing it. Please try again later.",
    color: "#FF5F5F",
    icon: "fa-solid fa-server",
    redirectLink: "/",
    buttonText: "Refresh Page",
  });
};
