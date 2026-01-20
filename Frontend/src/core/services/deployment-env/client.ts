import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const clientEnv = createEnv({
  client: {
    NEXT_PUBLIC_API_BASE_URL: z.string().trim().url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
  skipValidation: process.env.CI ? true : false,
});

export default clientEnv;
