import { model, Schema } from 'mongoose';

export interface ChallengeDoc {
  topic: string;
  title: string;
  prompt: string;
  answer: string;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  active: boolean;
}

const schema = new Schema<ChallengeDoc>({
  topic: { type: String, required: true, index: true },
  title: { type: String, required: true },
  prompt: { type: String, required: true },
  answer: { type: String, required: true },
  explanation: { type: String, required: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  active: { type: Boolean, default: true }
});

export const Challenge = model<ChallengeDoc>('Challenge', schema);
