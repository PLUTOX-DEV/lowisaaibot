import type { IncomingMessage, ServerResponse } from 'node:http';
import { Telegraf } from 'telegraf';
import type { Update } from 'telegraf/types';
import { env } from '../src/config/env.js';
import { connectDatabase } from '../src/services/db.js';
import { registerHandlers } from '../src/bot/handlers.js';
import { Challenge } from '../src/models/Challenge.js';

type WebhookRequest = IncomingMessage & { body?: Update };

const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);
registerHandlers(bot);
bot.catch((error, ctx) => {
  console.error(`Telegram webhook failed for ${ctx.update.update_id}:`, error);
});

const challengeSeeds = [
  {
    topic: 'databases',
    title: 'Database Connection Pooling',
    prompt: 'Your API creates a new Postgres connection for every request. At high traffic, what failure could appear and why?',
    answer: 'Connection exhaustion / too many active connections; a pool reuses a bounded set of connections.',
    explanation: 'Opening a connection per request creates connection churn and can exhaust the database connection limit.',
    difficulty: 'beginner' as const,
    active: true
  },
  {
    topic: 'security',
    title: 'Broken Access Control',
    prompt: 'An endpoint GET /users/:id lets any authenticated user fetch any other user’s record. What class of problem should you investigate first?',
    answer: 'Authorization / broken access control.',
    explanation: 'Authentication proves identity; authorization decides whether that identity may access the resource.',
    difficulty: 'beginner' as const,
    active: true
  },
  {
    topic: 'testing-debugging',
    title: 'Find the Evidence',
    prompt: 'A request is timing out. Before changing code, name three pieces of evidence you would collect.',
    answer: 'Examples include logs, timing/metrics, traces, query duration, dependency latency, or reproducible test output.',
    explanation: 'LoWisa-style debugging starts with evidence and narrows the root cause before applying a fix.',
    difficulty: 'intermediate' as const,
    active: true
  }
];

let initialization: Promise<void> | undefined;
const initialize = () => initialization ??= (async () => {
  await connectDatabase();
  for (const challenge of challengeSeeds) {
    await Challenge.updateOne({ title: challenge.title }, { $set: challenge }, { upsert: true });
  }
  bot.botInfo = await bot.telegram.getMe();
  await bot.telegram.setMyCommands([
    { command: 'start', description: 'Start using LoWisa AI' },
    { command: 'help', description: 'Show all available commands' },
    { command: 'about', description: 'Learn what LoWisa AI does' },
    { command: 'ask', description: 'Ask the tutor a question' },
    { command: 'learn', description: 'Start a guided lesson' },
    { command: 'challenge', description: 'Get a learning challenge' },
    { command: 'price', description: 'Get live crypto prices' },
    { command: 'progress', description: 'View your learning progress' },
    { command: 'level', description: 'Set your experience level' },
    { command: 'docs', description: 'Open LoWisa resources' }
  ]);
})();

const webhook = bot.webhookCallback('/api/telegram', {
  secretToken: process.env.TELEGRAM_WEBHOOK_SECRET
});

export default async function handler(req: WebhookRequest, res: ServerResponse<IncomingMessage>) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.end('Method Not Allowed');
    return;
  }
  await initialize();
  await webhook(req, res);
}
