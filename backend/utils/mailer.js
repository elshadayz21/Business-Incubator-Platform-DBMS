import dns from "dns";
// Force Node.js to use IPv4 to avoid ENETUNREACH errors on some networks
dns.setDefaultResultOrder("ipv4first");

import nodemailer from "nodemailer";

// Configure the email transporter using your .env variables
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_SECURE === "true",
    family: 4,
    auth: {
        user: process.env.SMTP_USER, // your email
        pass: process.env.SMTP_PASS, // your app password
    },
});

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

        const linkButton = `<a href="${signupLink}" style="display: inline-block; background-color: #E38524; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Complete Registration</a>`;

        const finalHtml = body.replace(/\{link\}/g, linkButton).replace(/\n/g, '<br>');

        await transporter.sendMail({
            from: process.env.SMTP_FROM || `"DxValley Incubator" <${process.env.SMTP_USER}>`,
            to: email,
            subject: subject || "You're In! Welcome to DxValley",
            html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
          ${finalHtml}
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">© ${new Date().getFullYear()} DxValley Incubation Center. Cooperative Bank of Oromia.</p>
        </div>
      `,
        });
        console.log(`✅ Invitation email sent to ${email}`);
        return true;
    } catch (error) {
        console.error("❌ Error sending invitation email:", error);
        return false;
    }
};

// Maps a user's role to the portal URL they land on after logging in, so the
// "view message" button in the chat notification email takes them straight
// to their own dashboard (each role is a separate SPA entry point).
const ROLE_PORTAL_PATH = {
    admin: "/admin",
    superadmin: "/admin/superadmin",
    entrepreneur: "/admin/entrepreneur",
    mentor: "/admin/mentor",
};

/**
 * Sends a "you've got a new message" email, mirroring how LinkedIn nudges
 * people back into the app for chat activity. Fire-and-forget: failures are
 * logged but never thrown, so a bad SMTP config can't break in-app chat.
 *
 * @param {string} toEmail - Recipient's email address.
 * @param {object} options
 * @param {string} options.recipientName - First name/greeting for the recipient.
 * @param {string} options.senderName - Name of the person who sent the message.
 * @param {string} options.preview - Short preview/snippet of the message content.
 * @param {string} options.recipientRole - Recipient's role, used to link to the right portal.
 * @param {number|string} options.senderId - Id of the message sender, so the portal can open that conversation directly once the recipient is logged in.
 */
export const sendChatMessageEmail = async (toEmail, { recipientName, senderName, preview, recipientRole, senderId }) => {
    if (!toEmail) return false;

    try {
        const baseUrl = process.env.BASE_URL || "http://localhost:3000";
        const portalPath = ROLE_PORTAL_PATH[recipientRole] || "/admin/login";
        // openChat is read by the frontend once the recipient is authenticated
        // (the portal requires login first — see App.jsx's auth gate — and
        // only then deep-links straight into this conversation).
        const chatLink = senderId
            ? `${baseUrl}${portalPath}?openChat=${encodeURIComponent(senderId)}`
            : `${baseUrl}${portalPath}`;
        const firstName = recipientName ? recipientName.split(" ")[0] : "there";
        const safePreview = preview ? preview.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";

        await transporter.sendMail({
            from: process.env.SMTP_FROM || `"DxValley Incubator" <${process.env.SMTP_USER}>`,
            to: toEmail,
            subject: `New message from ${senderName} on DxValley`,
            html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 24px;">
          <p>Hi ${firstName},</p>
          <p><strong>${senderName}</strong> just sent you a message on DxValley:</p>
          <p style="background:#f6fafc; border-left: 3px solid #00ADEF; padding: 12px 16px; border-radius: 4px; color:#333; font-style: italic;">
            "${safePreview}"
          </p>
          <p style="text-align:center; margin: 28px 0;">
            <a href="${chatLink}" style="display: inline-block; background-color: #E38524; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Log in to reply</a>
          </p>
          <p style="font-size: 13px; color: #666;">You'll need to log in first — once you do, this will take you straight to your conversation with ${senderName}. You're receiving this because you have new unread messages waiting for you; once you open the chat, we won't email you again until a new conversation comes in.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">© ${new Date().getFullYear()} DxValley Incubation Center. Cooperative Bank of Oromia.</p>
        </div>
      `,
        });
        console.log(`✅ Chat notification email sent to ${toEmail}`);
        return true;
    } catch (error) {
        console.error("❌ Error sending chat notification email:", error);
        return false;
    }
};

/**
 * Sends the generic "here's an update on DxValley" email used for non-chat
 * notifications (project decisions, mentor assignments, funding offers,
 * etc.). Same login-gated deep-link pattern as chat: the button lands on
 * the recipient's portal with ?openTab=<tab>, which the portal reads once
 * the person is authenticated and jumps straight to that tab.
 *
 * @param {string} toEmail - Recipient's email address.
 * @param {object} options
 * @param {string} options.recipientName - Recipient's name, for the greeting.
 * @param {string} options.recipientRole - Recipient's role, used to link to the right portal.
 * @param {string} options.subject - Email subject line.
 * @param {string} options.message - The notification's own message text (already human-readable).
 * @param {string} [options.tab] - Portal tab to deep-link into (e.g. "Funding", "My Mentor").
 */
export const sendGenericNotificationEmail = async (toEmail, { recipientName, recipientRole, subject, message, tab }) => {
    if (!toEmail) return false;

    try {
        const baseUrl = process.env.BASE_URL || "http://localhost:3000";
        const portalPath = ROLE_PORTAL_PATH[recipientRole] || "/admin/login";
        const link = tab
            ? `${baseUrl}${portalPath}?openTab=${encodeURIComponent(tab)}`
            : `${baseUrl}${portalPath}`;
        const firstName = recipientName ? recipientName.split(" ")[0] : "there";

        await transporter.sendMail({
            from: process.env.SMTP_FROM || `"DxValley Incubator" <${process.env.SMTP_USER}>`,
            to: toEmail,
            subject,
            html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 24px;">
          <p>Hi ${firstName},</p>
          <p>${message}</p>
          <p style="text-align:center; margin: 28px 0;">
            <a href="${link}" style="display: inline-block; background-color: #E38524; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Log in to view</a>
          </p>
          <p style="font-size: 13px; color: #666;">You'll need to log in first — once you do, this will take you straight to the right place.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">© ${new Date().getFullYear()} DxValley Incubation Center. Cooperative Bank of Oromia.</p>
        </div>
      `,
        });
        console.log(`✅ Notification email sent to ${toEmail}`);
        return true;
    } catch (error) {
        console.error("❌ Error sending notification email:", error);
        return false;
    }
};