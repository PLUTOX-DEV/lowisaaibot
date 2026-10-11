import mongoose from 'mongoose';
import { env } from '../config/env.js';

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5_000,
    connectTimeoutMS: 5_000,
    socketTimeoutMS: 15_000,
    maxPoolSize: 5
  });
  console.log('MongoDB connected');
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}

export async function checkDatabase() {
  const startedAt = Date.now();
  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      return { ok: false, latencyMs: Date.now() - startedAt, detail: 'Database is not connected.' };
    }
    await mongoose.connection.db.admin().ping({ maxTimeMS: 3_000 });
    return { ok: true, latencyMs: Date.now() - startedAt, detail: 'Database responded to ping.' };
  } catch (error) {
    console.error('MongoDB health check failed:', error);
    return { ok: false, latencyMs: Date.now() - startedAt, detail: 'Database ping failed. Check Vercel runtime logs.' };
  }
}
