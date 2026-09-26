import { model, Schema } from 'mongoose';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface ConversationDoc {
  key: string;
  telegramUserId: string;
  chatId: string;
  messages: ConversationMessage[];
  updatedAt: Date;
}

const messageSchema = new Schema<ConversationMessage>({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const schema = new Schema<ConversationDoc>({
  key: { type: String, unique: true, required: true },
  telegramUserId: { type: String, required: true, index: true },
  chatId: { type: String, required: true, index: true },
  messages: { type: [messageSchema], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

export const Conversation = model<ConversationDoc>('Conversation', schema);
