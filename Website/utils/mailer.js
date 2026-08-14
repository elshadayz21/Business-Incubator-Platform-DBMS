import dns from "dns";
// Force Node.js to use IPv4 to avoid ENETUNREACH errors on some networks
dns.setDefaultResultOrder("ipv4first");

import nodemailer from "nodemailer";

// Configure the email transporter using your .env variables
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    family: 4,
    auth: {
        user: process.env.SMTP_USER, // your email
        pass: process.env.SMTP_PASS, // your app password
    },
});

/**
 * Sends an invitation email to an accepted applicant.
 * @param {string} email - The applicant's email address.
 * @param {string} token - The unique invite token.
 */
export const sendInvitationEmail = async (email, token) => {
    try {
        // NOTE: Change this URL to your Vercel URL when you deploy!
        const baseUrl = process.env.BASE_URL || "http://localhost:3000";
        const signupLink = `${baseUrl}/v1/auth/signup?token=${token}`;

        const mailOptions = {
            from: `"DxValley Incubator" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "You're In! Welcome to DxValley 🚀",
            html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto;">
          <h2 style="color: #00ADEF;">Congratulations!</h2>
          <p>Your application to DxValley has been accepted.</p>
          <p>To complete your registration and access the Founder Dashboard, please click the button below to set up your account:</p>
          <a href="${signupLink}" style="display: inline-block; background-color: #E38524; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
            Complete Registration
          </a>
          <p style="font-size: 12px; color: #888;">If you did not apply to DxValley, please ignore this email.</p>
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