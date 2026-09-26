import { Conversation } from '../models/Conversation.js';
import { env } from '../config/env.js';

function conversationKey(userId: string, chatId: string) {
  return `${userId}:${chatId}`;
}

export async function getMemory(userId: string, chatId: string) {
  const doc = await Conversation.findOne({ key: conversationKey(userId, chatId) }).lean();
  return (doc?.messages ?? []).slice(-env.MEMORY_MESSAGES);
}

export async function appendMemory(userId: string, chatId: string, role: 'user' | 'assistant', content: string) {
  const key = conversationKey(userId, chatId);
  const doc = await Conversation.findOneAndUpdate(
    { key },
    {
      $setOnInsert: { key, telegramUserId: userId, chatId },
      $push: { messages: { $each: [{ role, content, createdAt: new Date() }], $slice: -30 } },
      $set: { updatedAt: new Date() }
    },
    { upsert: true, new: true }
  );
  return doc;
}
