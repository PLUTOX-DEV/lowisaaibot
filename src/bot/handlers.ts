import { Telegraf } from 'telegraf';
import type { Context } from 'telegraf';
import { env } from '../config/env.js';
import { askTutor, generateLearningLesson } from '../ai/engine.js';
import { getCommunityStats, formatStats } from '../analytics/report.js';
import { trackContext } from './context.js';
import { requireAdmin, isAdmin } from './auth.js';
import { Challenge } from '../models/Challenge.js';
import { Raid } from '../models/Raid.js';
import { User } from '../models/User.js';
import { Knowledge } from '../models/Knowledge.js';
import { getCryptoPrices, resolveCoins } from '../services/crypto.js';

function chatId(ctx: Context) { return String(ctx.chat?.id ?? 'unknown'); }
function userId(ctx: Context) { return String(ctx.from?.id ?? 'unknown'); }

function cleanCommand(text: string, command: string) {
  return text.replace(new RegExp(`^/${command}(?:@\\w+)?\\s*`, 'i'), '').trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function richReply(ctx: Context, message: string) {
  return ctx.reply(message, { parse_mode: 'HTML' });
}

function formatAssistantText(value: string) {
  return escapeHtml(value)
    .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/(^|\n)###?\s+(.+)/g, '$1<b>$2</b>');
}

async function replyWithCryptoPrices(ctx: Context, input: string) {
  const coins = resolveCoins(input);
  if (!coins.length) {
    return richReply(ctx, '💹 Try <code>/price BTC SOL ETH</code>. Supported coins include BTC, ETH, SOL, BNB, ADA, DOGE, XRP, and LINK.');
  }
  const prices = await getCryptoPrices(coins);
  if (!prices.length) return richReply(ctx, '⚠️ I could not retrieve prices right now. Please try again shortly.');
  const rows = prices.map((coin) => {
    const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: coin.price < 1 ? 6 : 2 }).format(coin.price);
    const change = coin.change24h === undefined ? 'n/a' : `${coin.change24h >= 0 ? '▲' : '▼'} ${Math.abs(coin.change24h).toFixed(2)}%`;
    return `• <b>${coin.symbol}</b> (${coin.name}): <b>${price}</b> · 24h ${change}`;
  });
  return richReply(ctx, ['💹 <b>Crypto prices</b>', '', ...rows, '', `<i>Live market data from CoinGecko · ${new Date().toISOString()}</i>`].join('\n'));
}

export function registerHandlers(bot: Telegraf<Context>) {
  bot.start(async (ctx) => {
    await trackContext(ctx, '/start', false, false);
    await richReply(ctx, [
      '🧠 <b>Welcome to LoWisa AI</b>',
      '',
      'I am a LoWisa-focused Telegram tutor and community assistant.',
      '',
      '<b>I can help you:</b>',
      '📚 Explain programming concepts',
      '🗺️ Build system and architecture thinking',
      '🎯 Run learning challenges',
      '🐛 Debug with evidence-based reasoning',
      '📖 Answer LoWisa product questions',
      '📊 Provide community analytics to admins',
      '',
      'Try <code>/learn Node.js</code> or <code>/challenge databases</code>.'
    ].join('\n'));
  });

  bot.help(async (ctx) => {
    await richReply(ctx, [
      '🤖 <b>LoWisa AI commands</b>',
      '',
      '<b>Learn</b>',
      '<code>/about</code> — what LoWisa is',
      '<code>/ask &lt;question&gt;</code> — ask the tutor',
      '<code>/learn &lt;topic&gt;</code> — start a lesson',
      '<code>/challenge [topic]</code> — get a challenge',
      '<code>/price BTC SOL ETH</code> — current crypto prices',
      '<code>/progress</code> — view your learning progress',
      '<code>/level &lt;level&gt;</code> — set your experience level',
      '<code>/docs</code> — official resource links',
      '',
      '<b>Group mode</b>',
      `<code>@${escapeHtml(env.TELEGRAM_BOT_USERNAME)} explain connection pooling</code>`,
      '',
      '<b>Admins</b>',
      '<code>/stats</code> · <code>/report</code>',
      '<code>/raid start &lt;name&gt;</code> · <code>/raid join</code> · <code>/raid status</code>',
      '<code>/knowledge pending</code>'
    ].join('\n'));
  });

  bot.command('about', async (ctx) => {
    await trackContext(ctx, '/about', false, false);
    await richReply(ctx, [
      '🧠 <b>About LoWisa AI</b>',
      '',
      'LoWisa is a learning-focused coding assistant that helps developers understand systems, reason about code, and build with confidence.',
      '',
      '🎓 <b>How I teach</b>',
      '1. Explain the idea in plain language.',
      '2. Connect it to your system or code.',
      '3. Ask you to reason through an example.',
      '4. Give you a small challenge to check understanding.',
      '',
      '🛠️ <b>I can help with</b>',
      '• Node.js, APIs, MongoDB, Docker, and testing',
      '• Debugging, architecture, authentication, and security',
      '• System Immersion and project-level understanding',
      '• LoWisa product and learning resources',
      '',
      '🚀 Try <code>/learn databases</code>, <code>/challenge security</code>, or <code>/ask why use connection pooling</code>.',
      '',
      '📚 <a href="https://lowisa.dev/">Learn more at lowisa.dev</a>'
    ].join('\n'));
  });

  bot.command('docs', async (ctx) => {
    await trackContext(ctx, '/docs', false, false);
    await richReply(ctx, [
      '📚 <b>Official LoWisa resources</b>',
      '',
      '🌐 <a href="https://lowisa.dev/">Website</a>',
      '🎓 <a href="https://lowisa.dev/learn/">Learning hub</a>',
      '🗺️ <a href="https://lowisa.dev/learn/system-immersion/">System Immersion</a>',
      '🤖 <a href="https://lowisa.dev/learn/ai-coding-tutor/">AI coding tutor</a>',
      'ℹ️ <a href="https://lowisa.dev/about/">About LoWisa</a>'
    ].join('\n'));
  });

  bot.command('price', async (ctx) => {
    const raw = 'text' in ctx.message && typeof ctx.message.text === 'string' ? ctx.message.text : '';
    await replyWithCryptoPrices(ctx, cleanCommand(raw, 'price') || 'BTC SOL');
  });

  bot.command('ask', async (ctx) => {
    const raw = 'text' in ctx.message && typeof ctx.message.text === 'string' ? ctx.message.text : '';
    const question = cleanCommand(raw, 'ask');
    if (!question) return ctx.reply('Try `/ask explain database connection pooling`.');
    await trackContext(ctx, question, true, false);
    await ctx.sendChatAction('typing');
    const result = await askTutor({ userId: userId(ctx), chatId: chatId(ctx), question });
    await richReply(ctx, formatAssistantText(result.answer));
  });

  bot.command('learn', async (ctx) => {
    const raw = 'text' in ctx.message && typeof ctx.message.text === 'string' ? ctx.message.text : '';
    const topic = cleanCommand(raw, 'learn') || 'software engineering fundamentals';
    await trackContext(ctx, topic, true, false);
    await ctx.sendChatAction('typing');
    const result = await generateLearningLesson(topic, userId(ctx), chatId(ctx));
    await User.updateOne({ telegramId: userId(ctx) }, { $addToSet: { learningTopics: topic } });
    await richReply(ctx, formatAssistantText(result.answer));
  });

  bot.command('challenge', async (ctx) => {
    const raw = 'text' in ctx.message && typeof ctx.message.text === 'string' ? ctx.message.text : '';
    const topic = cleanCommand(raw, 'challenge') || 'general';
    await trackContext(ctx, topic, true, false);
    const query = topic === 'general' ? { active: true } : { active: true, topic: new RegExp(escapeRegExp(topic), 'i') };
    const challenge = await Challenge.findOne(query).lean() ?? await Challenge.findOne({ active: true }).lean();
    if (!challenge) return ctx.reply('No challenge is seeded yet. Run `npm run seed` and try again.');
    await User.updateOne({ telegramId: userId(ctx) }, { $inc: { challengeCount: 1 } });
    await ctx.reply([`🎯 ${challenge.title}`, `Topic: ${challenge.topic}`, `Difficulty: ${challenge.difficulty}`, '', challenge.prompt, '', 'Reply with your reasoning and I will help you work through it.'].join('\n'));
  });

  bot.command('progress', async (ctx) => {
    const user = await User.findOne({ telegramId: userId(ctx) }).lean();
    if (!user) return ctx.reply('Start learning with `/learn <topic>` and I will track your progress here.');
    const topics = user.learningTopics.length ? user.learningTopics.join(', ') : 'No topics yet';
    await richReply(ctx, [
      '📈 <b>Your LoWisa progress</b>',
      '',
      `🎓 <b>Level:</b> ${escapeHtml(user.experienceLevel ?? 'not set')}`,
      `📚 <b>Topics:</b> ${escapeHtml(topics)}`,
      `💬 <b>Messages:</b> ${user.messageCount}`,
      `❓ <b>Questions:</b> ${user.questionCount}`,
      `🎯 <b>Challenges started:</b> ${user.challengeCount}`,
      `🕒 <b>Last active:</b> ${escapeHtml(user.lastActiveAt.toISOString())}`
    ].join('\n'));
  });

  bot.command('level', async (ctx) => {
    const raw = 'text' in ctx.message && typeof ctx.message.text === 'string' ? ctx.message.text : '';
    const level = cleanCommand(raw, 'level').toLowerCase();
    const validLevels = ['beginner', 'junior', 'intermediate', 'advanced'] as const;
    if (!validLevels.includes(level as typeof validLevels[number])) {
      return ctx.reply('Choose a level: beginner, junior, intermediate, or advanced.');
    }
    await User.updateOne(
      { telegramId: userId(ctx) },
      { $set: { experienceLevel: level }, $setOnInsert: { learningTopics: [], createdAt: new Date(), role: 'user' } },
      { upsert: true }
    );
    await ctx.reply(`✅ Learning level set to ${level}.`);
  });

  bot.command('stats', requireAdmin(async (ctx) => {
    const stats = await getCommunityStats(chatId(ctx));
    await ctx.reply(formatStats(stats));
  }));

  bot.command('report', requireAdmin(async (ctx) => {
    const stats = await getCommunityStats(chatId(ctx));
    await ctx.reply(formatStats(stats));
  }));

  bot.command('raid', async (ctx) => {
    if (!(await isAdmin(ctx))) return ctx.reply('🔒 Admin access only for raid controls.');
    const raw = 'text' in ctx.message && typeof ctx.message.text === 'string' ? ctx.message.text : '';
    const args = cleanCommand(raw, 'raid');
    if (args.startsWith('start ')) {
      const name = args.slice(6).trim() || 'LoWisa Community Raid';
      await Raid.updateMany({ chatId: chatId(ctx), status: 'active' }, { $set: { status: 'ended', endedAt: new Date() } });
      const raid = await Raid.create({ chatId: chatId(ctx), name, status: 'active', participants: [userId(ctx)], startedAt: new Date() });
      return ctx.reply(`🚀 Raid started: ${raid.name}\nJoin with /raid join`);
    }
    if (args === 'join') {
      const raid = await Raid.findOneAndUpdate({ chatId: chatId(ctx), status: 'active' }, { $addToSet: { participants: userId(ctx) } }, { new: true });
      return ctx.reply(raid ? `✅ You joined ${raid.name}. Participants: ${raid.participants.length}` : 'No active raid.');
    }
    if (args === 'status') {
      const raid = await Raid.findOne({ chatId: chatId(ctx), status: 'active' }).lean();
      return ctx.reply(raid ? `🚀 ${raid.name}\nParticipants: ${raid.participants.length}\nStarted: ${raid.startedAt.toISOString()}` : 'No active raid.');
    }
    return ctx.reply('Use `/raid start <name>`, `/raid join`, or `/raid status`.');
  });

  bot.command('knowledge', requireAdmin(async (ctx) => {
    const message = ctx.message;
    const raw = message && 'text' in message && typeof message.text === 'string' ? message.text : '';
    const args = cleanCommand(raw, 'knowledge');
    if (args === 'pending' || args === 'approved' || args === 'rejected') {
      const entries = await Knowledge.find({ status: args }).sort({ updatedAt: -1 }).limit(10).lean();
      if (!entries.length) return ctx.reply(`✅ No ${args} knowledge entries.`);
      return ctx.reply(entries.map((x, i) => `${i + 1}. ${x.title}\n${x.category}\nID: ${x._id}`).join('\n\n'));
    }
    return ctx.reply('Use `/knowledge pending`, `/knowledge approved`, or `/knowledge rejected`.');
  }));

  bot.on('text', async (ctx, next) => {
    const text = ctx.message.text.trim();
    if (text.startsWith('/')) return next();

    const botUsername = bot.botInfo?.username || env.TELEGRAM_BOT_USERNAME;
    const mention = new RegExp(`@${botUsername}\\b`, 'i');
    const inPrivate = ctx.chat.type === 'private';
    const mentioned = mention.test(text);
    const repliedMessage = 'reply_to_message' in ctx.message ? ctx.message.reply_to_message : undefined;
    const repliedToBot = Boolean(repliedMessage?.from?.is_bot);
    if (!inPrivate && !mentioned && !repliedToBot) return next();

    const question = text.replace(mention, '').trim() || 'Tell me what LoWisa can help with.';
    if (/\b(?:current|latest|live|today)\b.*\b(?:price|value|worth)\b|\b(?:price|value|worth)\b.*\b(?:btc|bitcoin|eth|ethereum|sol|solana|bnb|ada|doge|xrp|link)\b/i.test(question)) {
      await replyWithCryptoPrices(ctx, question);
      return;
    }
    await trackContext(ctx, question, true, mentioned || repliedToBot);
    await ctx.sendChatAction('typing');
    try {
      const result = await askTutor({ userId: userId(ctx), chatId: chatId(ctx), question });
      await richReply(ctx, formatAssistantText(result.answer));
    } catch (error) {
      console.error(error);
      await ctx.reply('I hit an internal error while thinking. Try again in a moment.');
    }
  });
}
