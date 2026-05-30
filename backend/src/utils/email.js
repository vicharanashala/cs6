import nodemailer from 'nodemailer';

/**
 * Create a reusable Nodemailer SMTP transporter from env vars.
 * Lazily initialized on first call for efficiency.
 */
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false, // true for 465, false for other ports (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter;
};

/**
 * Send a password-reset OTP email
 * @param {string} toEmail - Recipient email address
 * @param {string} otpCode - 6-digit OTP code (plain text)
 * @returns {Promise<boolean>} true if sent successfully
 */
export const sendOTPEmail = async (toEmail, otpCode) => {
  try {
    const transport = getTransporter();

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
            🔐 Password Reset
          </h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">
            Vicharanashala FAQ Portal
          </p>
        </div>

        <!-- Body -->
        <div style="padding: 32px 24px;">
          <p style="color: #e2e8f0; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            We received a request to reset your password. Use the verification code below to proceed:
          </p>

          <!-- OTP Box -->
          <div style="background: rgba(99, 102, 241, 0.1); border: 2px dashed #6366f1; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
            <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #a5b4fc;">
              ${otpCode}
            </span>
          </div>

          <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0 0 8px;">
            ⏱ This code expires in <strong style="color: #e2e8f0;">10 minutes</strong>.
          </p>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding: 16px 24px; background: rgba(0,0,0,0.2); text-align: center;">
          <p style="margin: 0; color: #64748b; font-size: 11px;">
            © ${new Date().getFullYear()} Vicharanashala · Do not share this code with anyone
          </p>
        </div>
      </div>
    `;

    const info = await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: '🔐 Your Password Reset Code — Vicharanashala',
      html: htmlBody
    });

    console.log(`[Email] OTP sent to ${toEmail} (messageId: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send OTP to ${toEmail}:`, error.message);
    return false;
  }
};
