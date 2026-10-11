import { env } from '../config/env.js';
import { SYSTEM_PROMPT } from './prompt.js';
import { retrieveKnowledge } from '../knowledge/retrieve.js';
import { getMemory, appendMemory } from './memory.js';
import { classifyTopic } from './classify.js';

async function askOpenRouter(question: string, memory: Awaited<ReturnType<typeof getMemory>>, docs: Awaited<ReturnType<typeof retrieveKnowledge>>) {
  if (!env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is not configured');
  const context = buildContext(docs);
  const conversation = memory
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(15_000),
    headers: {
      'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      ...(env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': env.OPENROUTER_SITE_URL } : {}),
      ...(env.OPENROUTER_SITE_NAME ? { 'X-Title': env.OPENROUTER_SITE_NAME } : {})
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL,
      max_tokens: env.AI_MAX_TOKENS,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: `Retrieved LoWisa knowledge:\n${context}` },
        { role: 'system', content: `Recent conversation:\n${conversation || '(none)'}` },
        { role: 'user', content: question }
      ]
    })
  });

  const payload = await response.json() as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenRouter request failed (${response.status})`);
  }

  return payload.choices?.[0]?.message?.content?.trim()
    || 'I could not produce a response. Try the question again.';
}

export async function checkAiProvider() {
  if (env.AI_PROVIDER === 'mock') {
    return { ok: true, provider: 'mock', latencyMs: 0, detail: 'Mock mode is active; no live AI provider is configured.' };
  }
  if (!env.OPENROUTER_API_KEY) {
    return { ok: false, provider: 'openrouter', latencyMs: 0, detail: 'OPENROUTER_API_KEY is missing from deployment environment variables.' };
  }

  const startedAt = Date.now();
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(8_000),
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        ...(env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': env.OPENROUTER_SITE_URL } : {}),
        ...(env.OPENROUTER_SITE_NAME ? { 'X-Title': env.OPENROUTER_SITE_NAME } : {})
      },
      body: JSON.stringify({
        model: env.OPENROUTER_MODEL,
        max_tokens: 8,
        messages: [{ role: 'user', content: 'Reply with only OK.' }]
      })
    });
    if (!response.ok) {
      return { ok: false, provider: 'openrouter', latencyMs: Date.now() - startedAt, detail: `Provider returned HTTP ${response.status}.` };
    }
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    if (!payload.choices?.[0]?.message?.content) {
      return { ok: false, provider: 'openrouter', latencyMs: Date.now() - startedAt, detail: 'Provider returned no assistant response.' };
    }
    return { ok: true, provider: 'openrouter', latencyMs: Date.now() - startedAt, detail: 'Live response received.' };
  } catch (error) {
    console.error('OpenRouter health probe failed:', error);
    const detail = error instanceof Error && error.name === 'TimeoutError'
      ? 'Provider timed out after 8 seconds.'
      : 'Could not reach the provider. Check Vercel runtime logs.';
    return { ok: false, provider: 'openrouter', latencyMs: Date.now() - startedAt, detail };
  }
}


function buildContext(docs: Awaited<ReturnType<typeof retrieveKnowledge>>) {
  if (!docs.length) return 'No retrieved LoWisa knowledge matched this question.';
  return docs
    .map((d, i) => `SOURCE ${i + 1}: ${d.title}\n${d.content}\nURL: ${d.sourceUrl ?? 'n/a'}`)
    .join('\n\n');
}

function mockAnswer(question: string, docs: Awaited<ReturnType<typeof retrieveKnowledge>>) {
  const context = docs[0];
  const q = question.toLowerCase();

  if (/what is lowisa|what does lowisa do|about lowisa/.test(q)) {
    return '🧠 LoWisa is an IDE with an AI tutor designed to help developers understand and own the code they ship. Its learning approach combines project understanding, guided explanation, practical work, and ownership checks.';
  }

  if (/system immersion/.test(q)) {
    return '🗺️ System Immersion starts with the whole project: what it does, how it is organised, its entry points, data flow, and how the pieces connect. The goal is to build a system map before diving into individual files.\n\n🎯 Check yourself: can you trace one request or record from entry point to output?';
  }

  if (/connection pool|pooling/.test(q)) {
    return 'A connection pool keeps a reusable set of database connections instead of opening a brand-new connection for every request. That reduces connection churn and helps avoid exhausting database connection limits under load.\n\n🎯 Challenge: what would you expect to happen if 10,000 requests each created a fresh database connection?';
  }

  if (context) {
    return `🧠 LoWisa knowledge match: ${context.title}\n\n${context.content}\n\nAsk me to turn this into a lesson or challenge.`;
  }

  return `I can help you learn that. Start by explaining what you already understand about: “${question}”. I’ll build the lesson from there.`;
}

export async function askTutor(params: { userId: string; chatId: string; question: string }) {
  const topic = classifyTopic(params.question);
  const [docs, memory] = await Promise.all([
    retrieveKnowledge(params.question),
    getMemory(params.userId, params.chatId)
  ]);

  const answer = env.AI_PROVIDER === 'openrouter'
    ? await askOpenRouter(params.question, memory, docs)
    : mockAnswer(params.question, docs);

  await appendMemory(params.userId, params.chatId, 'user', params.question);
  await appendMemory(params.userId, params.chatId, 'assistant', answer);

  return {
    answer,
    topic,
    sources: docs.map((d) => ({ title: d.title, url: d.sourceUrl }))
  };
}

export async function generateLearningLesson(topic: string, userId: string, chatId: string) {
  return askTutor({
    userId,
    chatId,
    question: `Teach me ${topic} like a LoWisa tutor. Explain it clearly, give an example, then give me a small challenge that tests whether I understood it.`
  });
}
