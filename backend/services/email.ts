import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

class EmailService {
  public readonly transporter: Transporter;
  public readonly from: string;

  constructor(transporter: Transporter, from?: string) {
    this.transporter = transporter;
    this.from = from || process.env.EMAIL_FROM || 'noreply@example.com';
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<any> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/login?token=${resetToken}`;

    const mailOptions = {
      from: this.from,
      to: email,
      subject: 'Reset Your Password',
      text: `Click this link to reset your password: ${resetUrl}`,
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }

  async sendWelcomeEmail(email: string, username: string): Promise<any> {
    const mailOptions = {
      from: this.from,
      to: email,
      subject: 'Welcome to MyApp',
      text: `Hi ${username}, your account has been created successfully!`,
      html: `
        <h2>Welcome to MyApp</h2>
        <p>Hi ${username},</p>
        <p>Your account has been created successfully!</p>
        <p>Enjoy using our service.</p>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }

  async sendMail(mailOptions: MailOptions): Promise<any> {
    return this.transporter.sendMail({
      ...mailOptions,
      from: this.from
    });
  }
}

export default EmailService;

