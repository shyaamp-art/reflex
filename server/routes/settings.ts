import { Router } from 'express';
import { store } from '../db/store.js';
import { fail } from '../http.js';

export const settingsRouter = Router();

// GET /api/settings/agent
settingsRouter.get('/agent', (req, res) => {
  res.json({ settings: store.agentSettings });
});

// PATCH /api/settings/agent
settingsRouter.patch('/agent', (req, res) => {
  try {
    const { sla_lookahead_hours, sla_scan_interval_minutes, workload_soft_limit, workload_hard_limit } = req.body;

    const next = {
      sla_lookahead_hours: sla_lookahead_hours === undefined ? store.agentSettings.sla_lookahead_hours : Number(sla_lookahead_hours),
      sla_scan_interval_minutes: sla_scan_interval_minutes === undefined ? store.agentSettings.sla_scan_interval_minutes : Number(sla_scan_interval_minutes),
      workload_soft_limit: workload_soft_limit === undefined ? store.agentSettings.workload_soft_limit : Number(workload_soft_limit),
      workload_hard_limit: workload_hard_limit === undefined ? store.agentSettings.workload_hard_limit : Number(workload_hard_limit),
    };
    if (!Number.isInteger(next.sla_lookahead_hours) || next.sla_lookahead_hours < 1 || next.sla_lookahead_hours > 48) fail(422, 'VALIDATION_ERROR', 'sla_lookahead_hours must be between 1 and 48');
    if (!Number.isInteger(next.sla_scan_interval_minutes) || next.sla_scan_interval_minutes < 5 || next.sla_scan_interval_minutes > 60) fail(422, 'VALIDATION_ERROR', 'sla_scan_interval_minutes must be between 5 and 60');
    if (next.workload_soft_limit < 1 || next.workload_soft_limit > 100 || next.workload_hard_limit < 1 || next.workload_hard_limit > 100 || next.workload_soft_limit > next.workload_hard_limit) {
      fail(422, 'VALIDATION_ERROR', 'Workload limits must be between 1 and 100, with soft <= hard');
    }
    Object.assign(store.agentSettings, next);

    store.agentSettings.updated_at = new Date().toISOString();
    res.json({ settings: store.agentSettings });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/skills
settingsRouter.get('/skills', (req, res) => {
  res.json({ skills: store.skills.sort() });
});

// POST /api/skills
settingsRouter.post('/skills', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Skill name is required' } });
    }

    const norm = name.trim().toLowerCase();
    if (store.skills.includes(norm)) {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'Skill already exists in catalog' } });
    }

    store.skills.push(norm);
    res.status(201).json({ skill: norm, skills: store.skills.sort() });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});
