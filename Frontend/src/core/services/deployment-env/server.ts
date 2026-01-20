import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const serverEnv = createEnv({
  server: {
    API_BASE_URL: z.string().trim().url(),
    AUTH_TRUST_HOST: z.enum(['true', 'false']),
    AUTH_SECRET: z.string().trim().min(48),
  },
  experimental__runtimeEnv: process.env,
  skipValidation: process.env.CI ? true : false,
});

export default serverEnv;
