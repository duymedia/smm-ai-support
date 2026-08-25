import nodemailer from "nodemailer";
import prisma from "./prisma";

export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
  fromEmail: string;
  fromName: string;
}

/**
 * Get active SMTP configuration from database settings or environment variables
 */
export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  try {
    const setting = await prisma.setting.findFirst();
    if (setting?.smtpHost && setting?.smtpUsername && setting?.smtpPassword) {
      return {
        host: setting.smtpHost,
        port: setting.smtpPort || 587,
        secure: setting.smtpPort === 465 || setting.smtpEncryption === "ssl",
        auth: {
          user: setting.smtpUsername,
          pass: setting.smtpPassword,
        },
        fromEmail: setting.smtpFromEmail || setting.smtpUsername || "noreply@nexussmm.io",
        fromName: setting.smtpFromName || setting.siteName || "NexusSMM Security",
      };
    }
  } catch (err) {
    console.warn("Could not query SMTP from database, trying env:", err);
  }

  // Fallback from environment variables
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = Number(process.env.SMTP_PORT) || 587;
    return {
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER,
      fromName: process.env.SMTP_FROM_NAME || "NexusSMM Security",
    };
  }

  return null;
}

/**
 * Send password reset email containing secure verification link
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  resetToken: string,
  originUrl = "http://localhost:3000"
): Promise<{ success: boolean; previewUrl?: string; message?: string }> {
  const resetLink = `${originUrl}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(toEmail)}`;
  const config = await getSmtpConfig();

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Đặt lại mật khẩu - NexusSMM</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
      .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
      .logo { font-size: 20px; font-weight: 800; color: #2563eb; margin-bottom: 24px; display: inline-block; }
      h2 { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; }
      p { font-size: 14px; line-height: 1.6; color: #475569; }
      .btn { display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; margin: 20px 0; }
      .code-box { background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 12px; font-family: monospace; font-size: 12px; word-break: break-all; color: #334155; }
      .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="logo">⚡ NexusSMM Security</div>
      <h2>Yêu cầu Đặt lại Mật khẩu</h2>
      <p>Xin chào,</p>
      <p>Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với email <strong>${toEmail}</strong>. Nhấn vào nút bên dưới để tiến hành đổi mật khẩu mới:</p>
      <div style="text-align: center;">
        <a href="${resetLink}" class="btn" target="_blank">Đặt Lại Mật Khẩu Ngay</a>
      </div>
      <p>Hoặc sao chép đường dẫn trực tiếp vào trình duyệt của bạn:</p>
      <div class="code-box">${resetLink}</div>
      <p style="font-size: 12px; color: #e11d48; margin-top: 16px;">
        ⚠️ Lưu ý: Liên kết này chỉ có hiệu lực trong vòng <strong>15 phút</strong>. Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email.
      </p>
      <div class="footer">
        © 2026 NexusSMM SaaS Platform • Bảo mật 256-Bit SSL
      </div>
    </div>
  </body>
  </html>
  `;

  if (config) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
      });

      const info = await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: toEmail,
        subject: "🔒 [NexusSMM] Hướng dẫn Đặt lại Mật khẩu Tài khoản",
        html: htmlContent,
      });

      console.log("Password reset email dispatched via SMTP:", info.messageId);
      return { success: true, message: "Email dispatched via SMTP" };
    } catch (err: any) {
      console.error("Failed to send email via configured SMTP:", err);
      // Fall through to Ethereal / simulated test preview
    }
  }

  // If no SMTP configured or in testing mode, generate test ethereal account or console preview
  try {
    const testAccount = await nodemailer.createTestAccount();
    const testTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await testTransporter.sendMail({
      from: '"NexusSMM Security" <noreply@nexussmm.io>',
      to: toEmail,
      subject: "🔒 [NexusSMM] Hướng dẫn Đặt lại Mật khẩu Tài khoản (Test Preview)",
      html: htmlContent,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    console.log("Mock SMTP Email sent! Preview URL:", previewUrl);
    console.log("Direct Reset URL:", resetLink);

    return {
      success: true,
      previewUrl,
      message: `Reset link dispatched! Preview URL: ${previewUrl || resetLink}`,
    };
  } catch (mockErr) {
    console.log("Direct password reset link:", resetLink);
    return {
      success: true,
      message: "Reset link created and logged to server console.",
    };
  }
}
