import { Knowledge } from '../models/Knowledge.js';
import { env } from '../config/env.js';

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');
}

function score(query: string, doc: { title: string; content: string; category: string; tags: string[] }) {
  const q = normalize(query).split(/\s+/).filter(Boolean);
  const haystack = normalize(`${doc.title} ${doc.category} ${doc.tags.join(' ')} ${doc.content}`);
  let points = 0;
  for (const token of q) {
    if (haystack.includes(token)) points += 1;
    if (normalize(doc.title).includes(token)) points += 3;
    if (doc.tags.some((tag) => normalize(tag).includes(token))) points += 2;
  }
  return points;
}

export async function retrieveKnowledge(query: string) {
  const docs = await Knowledge.find({ status: 'approved' }).lean();
  return docs
    .map((doc) => ({ doc, score: score(query, doc) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, env.RAG_TOP_K)
    .map(({ doc }) => doc);
}
