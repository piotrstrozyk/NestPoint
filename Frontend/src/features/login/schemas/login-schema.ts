import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, { message: 'Username must be at least 2 characters' })
    .max(50, { message: 'Username must be at most 50 characters' }),
  password: z
    .string()
    .trim()
    .nonempty('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be at most 100 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
