import { Router } from 'express';
import { store } from '../db/store.js';

export const cronRouter = Router();

// GET or POST /api/internal/cron/sla or /scan-sla
const handleSlaScan = (req: any, res: any) => {
  try {
    const result = store.runSlaScan();
    res.json({
      success: true,
      processed: result.processedCount,
      escalated_count: result.escalatedCount,
      proposals_created: result.proposalsCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
};

cronRouter.get('/sla', handleSlaScan);
cronRouter.post('/sla', handleSlaScan);
cronRouter.get('/scan-sla', handleSlaScan);
cronRouter.post('/scan-sla', handleSlaScan);
