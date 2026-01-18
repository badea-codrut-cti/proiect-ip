import { z } from 'zod';

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, { message: 'Display name must be at least 1 character' })
  .max(255, { message: 'Display name must be at most 255 characters' });

export const userProfileUpdateSchema = z.object({
  displayName: displayNameSchema.optional(),
  email: z
    .string()
    .email({ message: 'Invalid email format' })
    .max(255)
    .optional(),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' })
    .max(30, { message: 'Password must be at most 30 characters' })
    .regex(/\d/, 'Password must contain at least one digit')
    .regex(/[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`-]/, 'Password must contain at least one symbol')
    .optional(),
  currentPassword: z.string().min(1, { message: 'Current password is required' })
});

