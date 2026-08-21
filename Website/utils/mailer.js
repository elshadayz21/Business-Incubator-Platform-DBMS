import dns from "dns";
// Force Node.js to use IPv4 to avoid ENETUNREACH errors on some networks
dns.setDefaultResultOrder("ipv4first");

import nodemailer from "nodemailer";

// `family: 4` on the transport isn't always enough — nodemailer can still
// attempt an IPv6 address on retry/fallback and fail with ENETUNREACH on
// networks without IPv6 connectivity. A custom `lookup` forces every DNS
// resolution used by the SMTP connection to IPv4 only, no exceptions.
const lookupIPv4 = (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4 }, callback);
};

// Configure the email transporter using your .env variables
const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
// Respect SMTP_SECURE if set; otherwise default based on port (465 = implicit TLS, everything else = STARTTLS)
const smtpSecure =
  process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === "true"
    : smtpPort === 465;

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: smtpPort,
    secure: smtpSecure, // true for 465 (implicit TLS), false for 587/others (STARTTLS)
    family: 4,
    lookup: lookupIPv4,
    auth: {
        user: process.env.SMTP_USER, // your email
        pass: process.env.SMTP_PASS, // your app password
    },
});

// Fail fast and loud in the logs if SMTP isn't configured, instead of silently no-op'ing.
if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(
        "⚠️  SMTP is not fully configured (SMTP_HOST/SMTP_USER/SMTP_PASS). " +
        "Password reset and invitation emails will fail to send until these are set in .env."
    );
}

/**
 * Sends a single email through the configured SMTP transporter.
 * Returns true when accepted by the SMTP server, false on any error.
 */
export const sendEmail = async ({ to, subject, html }) => {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || `"DxValley Incubator" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });
        return true;
    } catch (error) {
        console.error("❌ Error sending email:", error);
        return false;
    }
};

/**
 * Sends an invitation email to an accepted applicant.
 * @param {string} email - The applicant's email address.
 * @param {string} token - The unique invite token.
 */
export const sendInvitationEmail = async (email, token, subject, body) => {
    try {
        const baseUrl = process.env.BASE_URL || "http://localhost:3000";
        const signupLink = `${baseUrl}/v1/auth/signup?token=${token}`;

        // The button that will replace {link}
        const linkButton = `<a href="${signupLink}" style="display: inline-block; background-color: #E38524; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Complete Registration</a>`;

        // Replace the placeholder with the button, and convert line breaks to HTML
        const finalHtml = body.replace(/{link}/g, linkButton).replace(/\n/g, '<br>');

        const mailOptions = {
            from: `"DxValley Incubator" <${process.env.SMTP_USER}>`,
            to: email,
            subject: subject || "You're In! Welcome to DxValley 🚀",
            html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
          ${finalHtml}
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">© ${new Date().getFullYear()} DxValley Incubation Center. Cooperative Bank of Oromia.</p>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Invitation email sent to ${email}`);
        return true;
    } catch (error) {
        console.error("❌ Error sending invitation email:", error);
        return false;
    }
};