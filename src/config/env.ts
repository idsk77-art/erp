import 'dotenv/config';

import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 'production';
      const clean = val.trim().toLowerCase();
      if (clean === 'development' || clean === 'test' || clean === 'production') {
        return clean as 'development' | 'test' | 'production';
      }
      return 'production';
    })
    .default('production'),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  DATABASE_URL: z.string().min(1).default('./data/nano-erp.sqlite'),
  UPLOAD_DIR: z.string().min(1).default('./uploads'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().default('http://localhost:3000/auth/google/callback'),
  GEMINI_API_KEY: z.string().optional(),
  OCR_PROVIDER: z.string().optional(),
  SPEECH_TO_TEXT_PROVIDER: z.string().optional(),
});

export type AppConfig = {
  env: 'development' | 'test' | 'production';
  host: string;
  port: number;
  databaseUrl: string;
  uploadDir: string;
  appUrl: string;
  googleClientId?: string | undefined;
  googleClientSecret?: string | undefined;
  googleCallbackUrl: string;
  geminiApiKey?: string | undefined;
  ocrProvider?: string | undefined;
  speechToTextProvider?: string | undefined;
};

export function loadConfig(): AppConfig {
  const env = EnvSchema.parse(process.env);

  return {
    env: env.NODE_ENV,
    host: env.HOST,
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    uploadDir: env.UPLOAD_DIR,
    appUrl: env.APP_URL,
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    googleCallbackUrl: env.GOOGLE_CALLBACK_URL,
    geminiApiKey: env.GEMINI_API_KEY,
    ocrProvider: env.OCR_PROVIDER,
    speechToTextProvider: env.SPEECH_TO_TEXT_PROVIDER,
  };
}

