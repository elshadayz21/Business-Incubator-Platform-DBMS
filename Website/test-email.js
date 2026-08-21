// One-off test script — NOT part of the app, just for debugging SMTP.
// Run with: node test-email.js
import "dotenv/config";
import nodemailer from "nodemailer";
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

const port = parseInt(process.env.SMTP_PORT || "587", 10);
const secure = process.env.SMTP_SECURE === "true";

console.log("Testing SMTP with:");
console.log("  HOST:  ", process.env.SMTP_HOST);
console.log("  PORT:  ", port);
console.log("  SECURE:", secure);
console.log("  USER:  ", process.env.SMTP_USER);
console.log("  PASS length:", process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0);
console.log("");

const lookupIPv4 = (hostname, options, callback) => {
  dns.lookup(hostname, { family: 4 }, callback);
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure,
  family: 4,
  lookup: lookupIPv4,
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
  logger: true,   // verbose SMTP protocol logging
  debug: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

try {
  console.log("Verifying connection...");
  await transporter.verify();
  console.log("✅ Connection + auth OK. Sending a real test email now...");

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.SMTP_USER, // send to yourself for the test
    subject: "SMTP test",
    text: "If you got this, SMTP is working.",
  });

  console.log("✅ Sent:", info.messageId);
} catch (err) {
  console.error("❌ FAILED:", err);
}