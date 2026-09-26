import { connectDatabase, disconnectDatabase } from '../src/services/db.js';
import { User } from '../src/models/User.js';

const telegramId = process.argv[2];
if (!telegramId) throw new Error('Usage: npx tsx scripts/promote-admin.ts <telegramUserId>');

await connectDatabase();
await User.updateOne(
  { telegramId },
  { $set: { role: 'admin', lastActiveAt: new Date() }, $setOnInsert: { learningTopics: [], createdAt: new Date() } },
  { upsert: true }
);
console.log(`Promoted Telegram user ${telegramId} to admin.`);
await disconnectDatabase();
