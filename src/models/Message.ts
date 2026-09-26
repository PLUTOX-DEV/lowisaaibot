import { model, Schema } from 'mongoose';

export interface MessageDoc {
  telegramMessageId: number;
  chatId: string;
  userId: string;
  text: string;
  isQuestion: boolean;
  botMentioned: boolean;
  topic?: string;
  createdAt: Date;
}

const schema = new Schema<MessageDoc>({
  telegramMessageId: { type: Number, required: true },
  chatId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  text: { type: String, default: '' },
  isQuestion: { type: Boolean, default: false },
  botMentioned: { type: Boolean, default: false },
  topic: String,
  createdAt: { type: Date, default: Date.now, index: true }
});

schema.index({ chatId: 1, createdAt: -1 });

export const Message = model<MessageDoc>('Message', schema);
