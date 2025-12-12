import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const emailConfigSchema = z.object({
  host: z.string(),
  port: z.number(),
  from: z.string()
});

class EmailService {
  constructor(config) {
    const { host, port, from } = emailConfigSchema.parse(config);
    this.host = host;
    this.port = port;
    this.from = from;
    this.transporter = null;
  }

  async initTransporter() {
    if (!this.transporter) {
      const { default: nodemailer } = await import('nodemailer');
      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: false,
        auth: {
          user: 'mailhog',
          pass: 'mailhog'
        }
      });
    }
    return this.transporter;
  }

  async sendPasswordResetEmail(email, resetToken) {
    const transporter = await this.initTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    
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

    return transporter.sendMail(mailOptions);
  }

  async sendWelcomeEmail(email, username) {
    const transporter = await this.initTransporter();
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

    return transporter.sendMail(mailOptions);
  }

  async sendMail(mailOptions) {
    const transporter = await this.initTransporter();
    return transporter.sendMail({
      from: this.from,
      ...mailOptions
    });
  }
}

export default EmailService;