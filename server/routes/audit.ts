import { Router } from 'express';
import { store } from '../db/store.js';

export const auditRouter = Router();

// GET /api/audit
auditRouter.get('/', (req, res) => {
  try {
    const { task_id, employee_id, action } = req.query;
    let list = [...store.auditLogs];

    if (task_id && typeof task_id === 'string') {
      list = list.filter((l) => l.task_id === task_id);
    }

    if (employee_id && typeof employee_id === 'string') {
      list = list.filter((l) => l.employee_id === employee_id);
    }

    if (action && typeof action === 'string' && action !== 'ALL') {
      list = list.filter((l) => l.action === action);
    }

    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({
      items: list,
      total: list.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});
