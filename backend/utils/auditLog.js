import pool from "../config/db.js";

// A real audit trail needs to answer "who did what, when" for every
// state-changing admin action — not just the actions we happened to wire an
// eventBus event for. So instead of instrumenting each controller one at a
// time (easy to miss new ones), this is written to by a single Express
// middleware (see middleware/audit.middleware.js) mounted in front of the
// whole /api/admin router. New admin endpoints get covered automatically.

let auditTableReady = false;
const ensureAuditTable = async () => {
  if (auditTableReady) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id SERIAL PRIMARY KEY,
        actor_id INT REFERENCES users(id) ON DELETE SET NULL,
        actor_name VARCHAR(255),
        actor_role VARCHAR(50),
        method VARCHAR(10) NOT NULL,
        path VARCHAR(500) NOT NULL,
        status_code INT,
        summary TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log (created_at DESC)`
    );
    auditTableReady = true;
  } catch (err) {
    console.error("[AuditLog] Failed to ensure admin_audit_log table:", err.message);
  }
};

// Fields that should never be persisted verbatim, even truncated.
const SENSITIVE_KEYS = new Set([
  "password",
  "newPassword",
  "confirmPassword",
  "currentPassword",
  "token",
  "smtpPass",
  "smtp_pass",
]);

const summarizeBody = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const safe = {};
  for (const [key, value] of Object.entries(body)) {
    if (SENSITIVE_KEYS.has(key)) continue;
    if (typeof value === "string" && value.length > 200) {
      safe[key] = `${value.slice(0, 200)}…`;
    } else {
      safe[key] = value;
    }
  }
  try {
    const json = JSON.stringify(safe);
    if (!json || json === "{}") return null;
    return json.length > 1000 ? `${json.slice(0, 1000)}…` : json;
  } catch {
    return null;
  }
};

// Fire-and-forget: an audit write must never break the request it's logging.
export const logAdminAudit = async ({ actorId, actorName, actorRole, method, path, statusCode, body }) => {
  await ensureAuditTable();
  try {
    await pool.query(
      `INSERT INTO admin_audit_log (actor_id, actor_name, actor_role, method, path, status_code, summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [actorId || null, actorName || null, actorRole || null, method, path, statusCode || null, summarizeBody(body)]
    );
  } catch (err) {
    console.error("[AuditLog] Error writing audit entry:", err.message);
  }
};

export const getAuditLog = async ({ limit = 50, offset = 0, actorRole, q } = {}) => {
  await ensureAuditTable();
  const params = [];
  const clauses = [];

  if (actorRole) {
    params.push(actorRole);
    clauses.push(`actor_role = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    const idx = params.length;
    clauses.push(`(path ILIKE $${idx} OR actor_name ILIKE $${idx} OR method ILIKE $${idx})`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const rowsRes = await pool.query(
    `SELECT * FROM admin_audit_log ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  const countRes = await pool.query(`SELECT COUNT(*)::int AS count FROM admin_audit_log ${where}`, params);

  return { rows: rowsRes.rows, total: countRes.rows[0]?.count || 0 };
};
