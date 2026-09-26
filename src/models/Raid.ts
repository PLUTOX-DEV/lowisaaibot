import { model, Schema } from 'mongoose';

export interface RaidDoc {
  chatId: string;
  name: string;
  status: 'active' | 'ended';
  participants: string[];
  startedAt: Date;
  endedAt?: Date;
}

const schema = new Schema<RaidDoc>({
  chatId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['active', 'ended'], default: 'active', index: true },
  participants: { type: [String], default: [] },
  startedAt: { type: Date, default: Date.now },
  endedAt: Date
});

schema.index({ chatId: 1, status: 1 });

export const Raid = model<RaidDoc>('Raid', schema);
