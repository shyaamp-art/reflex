import { Router } from 'express';
import { store } from '../db/store.js';

export const skillGapsRouter = Router();

// GET /api/skill-gaps
skillGapsRouter.get('/', (req, res) => {
  try {
    const list = [...store.skillGaps].sort(
      (a, b) => a.suggested_hiring_priority - b.suggested_hiring_priority || b.times_failed - a.times_failed
    );
    res.json({
      items: list,
      total: list.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/skill-gaps/:skill/review
skillGapsRouter.post('/:skill/review', (req, res) => {
  try {
    const skillName = req.params.skill.toLowerCase();
    const gap = store.skillGaps.find((g) => g.skill_name.toLowerCase() === skillName);
    if (!gap) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Skill gap not found' } });
    }

    gap.reviewed_at = new Date().toISOString();
    gap.reviewed_by = 'Alex Rivera (Manager)';

    res.json({ item: gap });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});
