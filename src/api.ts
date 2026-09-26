import express from 'express';
import { getCommunityStats } from './analytics/report.js';
import { Knowledge } from './models/Knowledge.js';

const knowledgeStatuses = ['approved', 'pending', 'rejected'] as const;

export function createApi() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'lowisa-telegram-ai' }));

  app.get('/api/admin/stats', async (req, res) => {
    try {
      const chatId = typeof req.query.chatId === 'string' ? req.query.chatId : undefined;
      res.json(await getCommunityStats(chatId));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to load stats' });
    }
  });

  app.get('/api/admin/knowledge', async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : 'pending';
    if (!knowledgeStatuses.includes(status as typeof knowledgeStatuses[number])) {
      return res.status(400).json({ error: 'status must be approved, pending, or rejected' });
    }
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    res.json(await Knowledge.find({ status }).sort({ updatedAt: -1 }).limit(limit).lean());
  });

  app.get('/api/admin/knowledge/pending', async (_req, res) => {
    res.json(await Knowledge.find({ status: 'pending' }).sort({ updatedAt: -1 }).limit(50).lean());
  });

  app.post('/api/admin/knowledge', async (req, res) => {
    const { title, content, category, tags = [], sourceUrl, sourceName, status = 'pending' } = req.body ?? {};
    if (!title || !content || !category) return res.status(400).json({ error: 'title, content and category are required' });
    if (!knowledgeStatuses.includes(status)) return res.status(400).json({ error: 'status must be approved, pending, or rejected' });
    if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string')) {
      return res.status(400).json({ error: 'tags must be an array of strings' });
    }
    const doc = await Knowledge.create({ title, content, category, tags, sourceUrl, sourceName, status, createdAt: new Date(), updatedAt: new Date() });
    res.status(201).json(doc);
  });

  app.post('/api/admin/knowledge/:id/approve', async (req, res) => {
    const doc = await Knowledge.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'approved', approvedBy: req.header('x-admin-user') ?? 'admin', updatedAt: new Date() } },
      { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ error: 'Knowledge not found' });
    res.json(doc);
  });

  app.post('/api/admin/knowledge/:id/reject', async (req, res) => {
    const doc = await Knowledge.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'rejected', updatedAt: new Date() }, $unset: { approvedBy: 1 } },
      { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ error: 'Knowledge not found' });
    res.json(doc);
  });

  app.patch('/api/admin/knowledge/:id', async (req, res) => {
    const allowedFields = ['title', 'content', 'category', 'tags', 'sourceUrl', 'sourceName'] as const;
    const updates: Partial<Record<typeof allowedFields[number], unknown>> = {};
    for (const field of allowedFields) {
      if (field in (req.body ?? {})) updates[field] = req.body[field];
    }
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'At least one editable field is required' });
    if ('tags' in updates && (!Array.isArray(updates.tags) || updates.tags.some((tag) => typeof tag !== 'string'))) {
      return res.status(400).json({ error: 'tags must be an array of strings' });
    }
    const doc = await Knowledge.findByIdAndUpdate(
      req.params.id,
      { $set: { ...updates, updatedAt: new Date() } },
      { new: true, runValidators: true }
    ).lean();
    if (!doc) return res.status(404).json({ error: 'Knowledge not found' });
    res.json(doc);
  });

  return app;
}
