import { Telegraf } from 'telegraf';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './services/db.js';
import { createApi } from './api.js';
import { registerHandlers } from './bot/handlers.js';
import { Challenge } from './models/Challenge.js';

await connectDatabase();

const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);
registerHandlers(bot);
bot.catch(async (error, ctx) => {
  console.error(`Telegram update failed for ${ctx.update.update_id}:`, error);
  try {
    await ctx.reply('I hit an internal error while processing that request. Please try again.');
  } catch (replyError) {
    console.error('Failed to send Telegram error response:', replyError);
  }
});

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
  { command: 'docs', description: 'Open LoWisa resources' },
  { command: 'stats', description: 'View community stats (admins)' },
  { command: 'report', description: 'View activity report (admins)' }
]);

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

for (const challenge of challengeSeeds) {
  await Challenge.updateOne({ title: challenge.title }, { $set: challenge }, { upsert: true });
}

const app = createApi();
const server = app.listen(env.PORT, () => console.log(`Admin API listening on :${env.PORT}`));

const shutdown = async () => {
  bot.stop('shutdown');
  server.close();
  await disconnectDatabase();
  process.exit(0);
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

try {
  await bot.launch();
  console.log(`LoWisa Telegram bot started as @${env.TELEGRAM_BOT_USERNAME}`);
} catch (error) {
  console.error('Failed to start Telegram bot:', error);
  server.close();
  await disconnectDatabase();
  process.exitCode = 1;
}
