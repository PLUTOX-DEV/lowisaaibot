import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_BOT_USERNAME: z.string().min(1).default('LoWisaBot'),
  MONGODB_URI: z.string().min(1),

  // AI provider for the bot. OpenRouter uses a direct HTTP call, so no OpenAI SDK is required.
  AI_PROVIDER: z.enum(['mock', 'openrouter']).default('mock'),

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

if (env.AI_PROVIDER === 'openrouter' && !env.OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY is required when AI_PROVIDER=openrouter');
}
