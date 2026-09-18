import { Router } from 'express';
import { store } from '../db/store.js';
import { sendError } from '../http.js';

export const reallocationsRouter = Router();

// GET /api/reallocations
reallocationsRouter.get('/', (req, res) => {
  try {
    const { status } = req.query;
    const items = store.getHydratedProposals(typeof status === 'string' && status !== 'ALL' ? status : undefined);
    res.json({
      items,
      total: items.length,
    });
  } catch (err: unknown) {
    sendError(res, err);
  }
});

// GET /api/reallocations/:proposalId
reallocationsRouter.get('/:proposalId', (req, res) => {
  try {
    const items = store.getHydratedProposals();
    const proposal = items.find((p) => p.id === req.params.proposalId);
    if (!proposal) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Proposal not found' } });
    }
    res.json({ proposal });
  } catch (err: unknown) {
    sendError(res, err);
  }
});

// POST /api/reallocations/:proposalId/approve
reallocationsRouter.post('/:proposalId/approve', (req, res) => {
  try {
    const { decision_note } = req.body;
    const result = store.approveProposal({
      proposalId: req.params.proposalId,
      actorUserId: 'user-manager-1',
      actorName: 'Alex Rivera',
      decisionNote: decision_note,
    });

    res.json({
      proposal: result.proposal,
      allocations: result.allocations,
      audit_log_ids: result.auditLogIds,
    });
  } catch (err: unknown) {
    sendError(res, err);
  }
});

// POST /api/reallocations/:proposalId/override
reallocationsRouter.post('/:proposalId/override', (req, res) => {
  try {
    const { employee_ids, reason } = req.body;
    if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'employee_ids array is required for manual override.' },
      });
    }

    const result = store.overrideProposal({
      proposalId: req.params.proposalId,
      employeeIds: employee_ids,
      actorUserId: 'user-manager-1',
      actorName: 'Alex Rivera',
      reason: reason || 'Manager manual override with chosen replacement engineer.',
    });

    res.json({
      proposal: result.proposal,
      allocations: result.allocations,
      audit_log_ids: result.auditLogIds,
    });
  } catch (err: unknown) {
    sendError(res, err);
  }
});
