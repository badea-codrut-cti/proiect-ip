import EmailService from '../email.js';

// Mock nodemailer transporter
const mockTransporter = {
  sendMail: jest.fn()
};

const mockFrom = 'test@example.com';

describe('EmailService', () => {
  let emailService: EmailService;
  let mockTransporter: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock process.env
    process.env.FRONTEND_URL = 'http://localhost:5173';
    process.env.EMAIL_FROM = mockFrom;

    mockTransporter = {
      sendMail: jest.fn()
    };

    emailService = new EmailService(mockTransporter as any, mockFrom);
  });

  describe('constructor', () => {
    it('should initialize with provided transporter and from address', () => {
      expect(emailService.transporter).toBe(mockTransporter);
      expect(emailService.from).toBe(mockFrom);
    });

    it('should use default from address when not provided', () => {
      const service = new EmailService(mockTransporter);
      expect(service.from).toBe(mockFrom);
    });

    it('should use hardcoded default when env var not set', () => {
      delete process.env.EMAIL_FROM;
      const service = new EmailService(mockTransporter);
      expect(service.from).toBe('noreply@example.com');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct parameters', async () => {
      const email = 'user@example.com';
      const resetToken = 'resetToken123';
      const frontendUrl = process.env.FRONTEND_URL;
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test123' });

      const result = await emailService.sendPasswordResetEmail(email, resetToken);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: mockFrom,
        to: email,
        subject: 'Reset Your Password',
        text: `Click this link to reset your password: ${resetUrl}`,
        html: expect.stringContaining(resetUrl)
      });
      expect(result).toEqual({ messageId: 'test123' });
    });

    it('should handle email sending errors', async () => {
      const email = 'user@example.com';
      const resetToken = 'resetToken123';
      const error = new Error('Email sending failed');

      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(
        emailService.sendPasswordResetEmail(email, resetToken)
      ).rejects.toThrow('Email sending failed');
    });

    it('should use correct reset URL format', async () => {
      const email = 'user@example.com';
      const resetToken = 'resetToken123';

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test123' });

      await emailService.sendPasswordResetEmail(email, resetToken);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.text).toContain('/reset-password?token=resetToken123');
      expect(callArgs.html).toContain('/reset-password?token=resetToken123');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct parameters', async () => {
      const email = 'user@example.com';
      const username = 'John Doe';

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test456' });

      const result = await emailService.sendWelcomeEmail(email, username);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: mockFrom,
        to: email,
        subject: 'Welcome to MyApp',
        text: `Hi ${username}, your account has been created successfully!`,
        html: expect.stringContaining(username)
      });
      expect(result).toEqual({ messageId: 'test456' });
    });

    it('should handle email sending errors', async () => {
      const email = 'user@example.com';
      const username = 'John Doe';
      const error = new Error('Email sending failed');

      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(
        emailService.sendWelcomeEmail(email, username)
      ).rejects.toThrow('Email sending failed');
    });

    it('should include username in email content', async () => {
      const email = 'user@example.com';
      const username = 'John Doe';

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test456' });

      await emailService.sendWelcomeEmail(email, username);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.text).toContain('Hi John Doe');
      expect(callArgs.html).toContain('Hi John Doe');
    });
  });

  describe('sendMail', () => {
    it('should send custom email with correct parameters', async () => {
      const customMailOptions = {
        to: 'recipient@example.com',
        subject: 'Custom Subject',
        text: 'Custom email content'
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test789' });

      const result = await emailService.sendMail(customMailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: mockFrom,
        ...customMailOptions
      });
      expect(result).toEqual({ messageId: 'test789' });
    });

    it('should handle email sending errors', async () => {
      const customMailOptions = {
        to: 'recipient@example.com',
        subject: 'Custom Subject'
      };
      const error = new Error('Email sending failed');

      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(
        emailService.sendMail(customMailOptions)
      ).rejects.toThrow('Email sending failed');
    });

    it('should merge from address with custom options', async () => {
      const customMailOptions = {
        to: 'recipient@example.com',
        from: 'override@example.com', // This should be overridden
        subject: 'Test Subject'
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test789' });

      await emailService.sendMail(customMailOptions);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.from).toBe(mockFrom); // Should use service's from, not custom
      expect(callArgs.to).toBe('recipient@example.com');
    });
  });

  describe('integration scenarios', () => {
    it('should maintain consistent from address across all email types', async () => {
      const email = 'user@example.com';
      const resetToken = 'token123';
      const username = 'Test User';

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test123' });

      // Send different types of emails
      await emailService.sendPasswordResetEmail(email, resetToken);
      await emailService.sendWelcomeEmail(email, username);
      await emailService.sendMail({ to: email, subject: 'Test' });

      // Verify all emails used the same from address
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(3);
      mockTransporter.sendMail.mock.calls.forEach(call => {
        expect(call[0].from).toBe(mockFrom);
      });
    });
  });
});

