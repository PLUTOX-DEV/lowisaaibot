import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_BOT_USERNAME: z.string().min(1).default('LoWisaBot'),
  MONGODB_URI: z.string().min(1),

  // Gemini has a free tier. OpenRouter remains available as an optional provider.
  AI_PROVIDER: z.enum(['mock', 'gemini', 'openrouter']).default('gemini'),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),

  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default('openrouter/auto'),
  OPENROUTER_SITE_URL: z.preprocess(
    (value: unknown) => value === '' ? undefined : value,
    z.string().url().optional()
  ),
  OPENROUTER_SITE_NAME: z.string().optional(),

  // Reserved for a future embedding/vector-search implementation.
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),

  AI_MAX_TOKENS: z.coerce.number().int().positive().default(1000),
  MEMORY_MESSAGES: z.coerce.number().int().positive().default(8),
  RAG_TOP_K: z.coerce.number().int().positive().default(5)
});

export const env = schema.parse(process.env);
