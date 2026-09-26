import { connectDatabase, disconnectDatabase } from '../src/services/db.js';
import { Knowledge } from '../src/models/Knowledge.js';
import { lowisaSeedKnowledge } from '../src/knowledge/seedData.js';

await connectDatabase();

for (const item of lowisaSeedKnowledge) {
  await Knowledge.updateOne(
    { title: item.title },
    {
      $set: {
        ...item,
        status: 'approved',
        updatedAt: new Date()
      },
      $setOnInsert: { createdAt: new Date() }
    },
    { upsert: true }
  );
}

console.log(`Seeded ${lowisaSeedKnowledge.length} LoWisa knowledge records.`);
await disconnectDatabase();
