import { z } from 'zod';

export const registrationSchema = z.object({
  username: z
    .string()
    .nonempty('Username is required')
    .min(3, 'Username must be between 3 and 50 characters')
    .max(50, 'Username must be between 3 and 50 characters'),

  email: z.string().nonempty('Email is required').email('Email must be valid'),

  password: z
    .string()
    .nonempty('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be at most 100 characters'),

  firstName: z
    .string()
    .nonempty('First name is required')
    .max(30, 'First name must be at most 30 characters'),

  lastName: z
    .string()
    .nonempty('Last name is required')
    .max(30, 'Last name must be at most 30 characters'),

  phone: z
    .string()
    .regex(
      /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/,
      'Phone number must be in format xxx-xxx-xxxx',
    ),

  role: z.enum(['OWNER', 'TENANT']),
});

export type RegistrationData = z.infer<typeof registrationSchema>;
