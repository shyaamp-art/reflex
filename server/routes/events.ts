import { Router } from 'express';
import { store } from '../db/store.js';

export const eventsRouter = Router();

// GET /api/events
eventsRouter.get('/', (req, res) => {
  try {
    const { type, limit } = req.query;
    let list = [...store.events];

    if (type && typeof type === 'string' && type !== 'ALL') {
      list = list.filter((e) => e.type === type);
    }

    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (limit) {
      list = list.slice(0, Number(limit));
    }

    res.json({
      items: list,
      total: list.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});
