import crypto from "crypto";

// Double-Submit Cookie CSRF protection.
//
// - A per-session token is generated on first request and stored both in the
//   session and in a readable (non-httpOnly) cookie.
// - Safe methods (GET/HEAD/OPTIONS) always pass.
// - State-changing requests to protected routes must echo the token back in the
//   `x-csrf-token` header (or `_csrf` form field). The echoed value must match
//   both the session token and the cookie value.

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

const isProtectedRoute = (pathname) => {
  const isProtected =
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/portal") ||
    pathname.startsWith("/v1");

  const isAuthRoute =
    pathname.includes("/auth/login") ||
    pathname.includes("/auth/register") ||
    pathname.includes("/auth/signup") ||
    pathname.includes("/auth/setup") ||
    pathname.includes("/auth/logout");

  return isProtected && !isAuthRoute;
};

const isJsonRequest = (req) =>
  req.path.startsWith("/api/") ||
  (req.headers["x-requested-with"] === "XMLHttpRequest") ||
  (req.headers.accept && req.headers.accept.includes("application/json"));

export const csrfProtection = (req, res, next) => {
  // 1. Issue / refresh the CSRF token tied to the session.
  if (req.session) {
    if (!req.session.csrfToken) {
      req.session.csrfToken = crypto.randomBytes(32).toString("hex");
    }
    res.cookie("csrfToken", req.session.csrfToken, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  // Safe methods carry no state change — allow.
  if (SAFE_METHODS.includes(req.method)) {
    return next();
  }

  // Only enforce on the API + /v1 auth/profile surfaces.
  if (!isProtectedRoute(req.path)) {
    return next();
  }

  const sessionToken = req.session ? req.session.csrfToken : null;
  const cookieToken = req.cookies && req.cookies.csrfToken;
  const clientToken =
    req.headers["x-csrf-token"] ||
    (req.body && req.body._csrf) ||
    (req.query && req.query._csrf) ||
    null;

  const matchesSession =
    clientToken && sessionToken && clientToken === sessionToken;
  const matchesCookie = !cookieToken || clientToken === cookieToken;

  if (matchesSession && matchesCookie) {
    return next();
  }

  const message = "Security token mismatch. Please refresh the page and try again.";

  if (isJsonRequest(req)) {
    return res.status(403).json({ error: message });
  }

  if (req.flash) {
    req.flash("error", message);
  }
  return res.redirect(req.get("Referer") || "/");
};