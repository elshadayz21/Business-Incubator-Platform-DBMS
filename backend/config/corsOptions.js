// Known-good origins for this app. Extend via the ALLOWED_ORIGINS env var
// (comma-separated) instead of widening this list or reflecting `true`,
// which would let any website make credentialed requests to the API and
// defeat the CSRF protections in csrf.middleware.js.
const defaultAllowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173", // Vite dev server for the React admin/portal UI
    "https://dxvalley-icms.onrender.com",
];

const envAllowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

export const corsOptions = {
    origin: (origin, callback) => {
        // Same-origin requests (curl, server-to-server, same-origin fetch)
        // don't send an Origin header at all, so `!origin` is safe here.
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token", "X-Requested-With"],
    credentials: true,
};
