import { model, Schema } from 'mongoose';

export interface UserDoc {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: 'user' | 'contributor' | 'admin';
  experienceLevel?: 'beginner' | 'junior' | 'intermediate' | 'advanced';
  learningTopics: string[];
  messageCount: number;
  questionCount: number;
  challengeCount: number;
  challengeCompleted: number;
  lastActiveAt: Date;
  createdAt: Date;
}

const schema = new Schema<UserDoc>({
  telegramId: { type: String, unique: true, required: true, index: true },
  username: String,
  firstName: String,
  lastName: String,
  role: { type: String, enum: ['user', 'contributor', 'admin'], default: 'user' },
  experienceLevel: { type: String, enum: ['beginner', 'junior', 'intermediate', 'advanced'] },
  learningTopics: { type: [String], default: [] },
  messageCount: { type: Number, default: 0 },
  questionCount: { type: Number, default: 0 },
  challengeCount: { type: Number, default: 0 },
  challengeCompleted: { type: Number, default: 0 },
  lastActiveAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

export const User = model<UserDoc>('User', schema);
