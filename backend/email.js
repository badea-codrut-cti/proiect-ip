import { z } from 'zod';

const emailConfigSchema = z.object({
  host: z.string(),
  port: z.number(),
  from: z.string()
});

export const createTransporter = async (config) => {
  const { host, port, from } = emailConfigSchema.parse(config);
  const { default: nodemailer } = await import('nodemailer');
  
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: {
      user: 'mailhog',
      pass: 'mailhog'
    }
  });

  transporter.from = from;
  return transporter;
};

export const sendPasswordResetEmail = async (transporter, email, resetToken) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: transporter.from,
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
};

export const sendWelcomeEmail = async (transporter, email, username) => {
  const mailOptions = {
    from: transporter.from,
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
};