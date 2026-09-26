import { Message } from '../models/Message.js';
import { User } from '../models/User.js';

export async function recordUserActivity(params: {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  text: string;
  chatId: string;
  messageId: number;
  isQuestion: boolean;
  botMentioned: boolean;
}) {
  const user = await User.findOneAndUpdate(
    { telegramId: params.telegramId },
    {
      $set: {
        username: params.username,
        firstName: params.firstName,
        lastName: params.lastName,
        lastActiveAt: new Date()
      },
      $inc: {
        messageCount: 1,
        questionCount: params.isQuestion ? 1 : 0
      },
      $setOnInsert: { createdAt: new Date(), learningTopics: [], role: 'user' }
    },
    { upsert: true, new: true }
  );

  await Message.create({
    telegramMessageId: params.messageId,
    chatId: params.chatId,
    userId: params.telegramId,
    text: params.text.slice(0, 8000),
    isQuestion: params.isQuestion,
    botMentioned: params.botMentioned,
    createdAt: new Date()
  });

  return user;
}
