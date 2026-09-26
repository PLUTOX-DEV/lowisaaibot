import { model, Schema } from 'mongoose';

export interface KnowledgeDoc {
  title: string;
  content: string;
  category: string;
  tags: string[];
  sourceUrl?: string;
  sourceName?: string;
  status: 'approved' | 'pending' | 'rejected';
  createdBy?: string;
  approvedBy?: string;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<KnowledgeDoc>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true, index: true },
  tags: { type: [String], default: [] },
  sourceUrl: String,
  sourceName: String,
  status: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'pending', index: true },
  createdBy: String,
  approvedBy: String,
  embedding: { type: [Number], select: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

schema.index({ title: 'text', content: 'text', tags: 'text' });

export const Knowledge = model<KnowledgeDoc>('Knowledge', schema);
