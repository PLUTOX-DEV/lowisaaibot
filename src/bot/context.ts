import { Context } from 'telegraf';
import { recordUserActivity } from '../analytics/record.js';
import { classifyTopic } from '../ai/classify.js';

export async function trackContext(ctx: Context, text: string, isQuestion: boolean, botMentioned: boolean) {
  if (!ctx.from || !ctx.chat || !('message' in ctx.update) || !ctx.message || !('message_id' in ctx.message)) return;
  await recordUserActivity({
    telegramId: String(ctx.from.id),
    username: ctx.from.username,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name,
    text,
    chatId: String(ctx.chat.id),
    messageId: ctx.message.message_id,
    isQuestion,
    botMentioned,
  });

  if (isQuestion) {
    const { Message } = await import('../models/Message.js');
    await Message.updateOne(
      { telegramMessageId: ctx.message.message_id, chatId: String(ctx.chat.id) },
      { $set: { topic: classifyTopic(text) } }
    );
  }
}
