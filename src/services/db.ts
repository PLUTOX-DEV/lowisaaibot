import mongoose from 'mongoose';
import { env } from '../config/env.js';

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(env.MONGODB_URI);
  console.log('MongoDB connected');
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
