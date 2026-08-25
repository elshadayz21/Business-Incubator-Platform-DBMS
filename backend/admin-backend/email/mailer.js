// ============================================================================
// mailer.js — SMTP transport for Mass Email (UR-B4)
// ----------------------------------------------------------------------------
// Thin wrapper around Nodemailer used by admin-backend/email/email.js.
// SMTP credentials come from .env (SMTP_HOST, SMTP_USER, SMTP_PASS, ...).
// When SMTP is not configured (local dev), sends are simulated by logging to
// the console so the feature remains testable end-to-end without a mail server.
// ============================================================================
import nodemailer from "nodemailer";
import "dotenv/config";

const isConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

let transport = null;

const getTransport = () => {
  if (transport) return transport;
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: (process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transport;
};

export const getFromAddress = () =>
  process.env.SMTP_FROM || `DxValley Incubation Center <${process.env.SMTP_USER}>`;

// Send a single email. If SMTP is not configured (dev), we simulate the
// delivery by logging it so the feature stays testable end-to-end.
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!isConfigured()) {
    console.log(`[mailer:simulated] To: ${to} | Subject: ${subject}`);
    return { simulated: true, messageId: `sim-${Date.now()}` };
  }

  const info = await getTransport().sendMail({
    from: getFromAddress(),
    to,
    subject,
    html,
    text: text || html,
  });
  return info;
};

export { isConfigured };
