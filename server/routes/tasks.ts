import { Router } from 'express';
import { store } from '../db/store.js';
import { buildAllocationPlan } from '../domain/allocator.js';
import { generateExplanationWithGemini } from '../ai/explainer.js';
import { Task, TaskSkillRequirement } from '../../src/types/index.js';

export const tasksRouter = Router();

// GET /api/tasks
tasksRouter.get('/', (req, res) => {
  try {
    const { search, status, priority, sla, assigned_to } = req.query;
    let list = store.tasks.map((t) => store.getHydratedTask(t.id)!);

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      list = list.filter((t) => t.status === status);
    }

    if (priority && typeof priority === 'string' && priority !== 'ALL') {
      list = list.filter((t) => t.priority === priority);
    }

    if (sla === 'at-risk') {
      const fourHoursMs = 4 * 60 * 60 * 1000;
      const now = Date.now();
      list = list.filter((t) => {
        const diff = new Date(t.sla_deadline).getTime() - now;
        return t.status !== 'COMPLETED' && diff > 0 && diff <= fourHoursMs;
      });
    }

    if (assigned_to && typeof assigned_to === 'string') {
      list = list.filter((t) =>
        t.allocations?.some((a) => a.employee_id === assigned_to && a.status === 'ACTIVE')
      );
    }

    // Sort by created_at desc
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({
      items: list,
      total: list.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/tasks/allocation-suggestions
// Pre-commit draft simulation
tasksRouter.post('/allocation-suggestions', async (req, res) => {
  try {
    const {
      title,
      description,
      priority = 'HIGH',
      sla_deadline,
      estimated_effort = 10,
      tags = [],
      required_location = 'REMOTE',
      skill_requirements = [],
    } = req.body;

    if (!title || !sla_deadline) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Title and SLA deadline are required.' },
      });
    }
    if (typeof title !== 'string' || title.trim().length > 200 || Number.isNaN(Date.parse(sla_deadline))) {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'title must be <= 200 characters and sla_deadline must be a valid date.' } });
    }
    if (!Array.isArray(skill_requirements) || !Array.isArray(tags) || Number(estimated_effort) < 0) {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid task fields.' } });
    }

    const mockTask: Task = {
      id: 'draft-task',
      title,
      description: description || '',
      status: 'UNASSIGNED',
      priority,
      sla_deadline,
      estimated_effort: Number(estimated_effort),
      tags,
      required_location,
      skill_requirements: skill_requirements.map((r: any, idx: number) => ({
        id: `draft-req-${idx}`,
        task_id: 'draft-task',
        skill_name: r.skill_name,
        proficiency: r.proficiency || 'INTERMEDIATE',
        people_required: r.people_required || 1,
        requirement_type: r.requirement_type || 'MUST_HAVE',
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Calculate plan
    const plan = buildAllocationPlan(mockTask, store.employees, new Date());

    // Generate LLM explanation asynchronously
    const explanation = await generateExplanationWithGemini({
      task: mockTask,
      topCandidates: plan.rankedCandidates.slice(0, 5),
      selectedCandidates: plan.selected,
      contextType: 'INITIAL_ALLOCATION',
    });

    res.json({
      suggestions: plan.rankedCandidates,
      selected: plan.selected,
      eligible_count: plan.rankedCandidates.filter((c) => c.eligible).length,
      status: plan.status,
      uncovered_requirements: plan.uncoveredRequirements,
      explanation,
      generated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/tasks
tasksRouter.post('/', (req, res) => {
  try {
    const {
      title,
      description = '',
      priority = 'HIGH',
      sla_deadline,
      estimated_effort = 8,
      tags = [],
      required_location = 'REMOTE',
      skill_requirements = [],
      allocation_mode = 'AI',
      selected_employee_ids = [],
    } = req.body;

    if (!title || !sla_deadline) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Title and SLA deadline are required.' },
      });
    }

    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowStr = new Date().toISOString();

    const formattedRequirements: TaskSkillRequirement[] = skill_requirements.map((r: any, idx: number) => ({
      id: `req-${Date.now()}-${idx}`,
      task_id: taskId,
      skill_name: r.skill_name,
      proficiency: r.proficiency || 'INTERMEDIATE',
      people_required: r.people_required || 1,
      requirement_type: r.requirement_type || 'MUST_HAVE',
    }));

    const newTask: Task = {
      id: taskId,
      title,
      description,
      status: 'UNASSIGNED',
      priority,
      sla_deadline,
      estimated_effort: Number(estimated_effort),
      tags,
      required_location,
      skill_requirements: formattedRequirements,
      created_at: nowStr,
      updated_at: nowStr,
    };

    store.tasks.unshift(newTask);

    // Record Event
    const eventId = `evt-${Date.now()}`;
    store.events.unshift({
      id: eventId,
      type: 'NEW_TASK',
      payload: { task_id: taskId, title, priority, estimated_effort },
      created_at: nowStr,
    });

    // Execute allocation if employee IDs selected
    let allocationsList: any[] = [];
    let auditLogId: string | undefined;

    if (selected_employee_ids && selected_employee_ids.length > 0) {
      const allocResult = store.executeAllocation({
        taskId,
        employeeIds: selected_employee_ids,
        allocatedBy: allocation_mode === 'AI' ? 'AI' : 'MANUAL',
        actorUserId: 'user-manager-1',
        actorName: 'Alex Rivera',
        reason: allocation_mode === 'AI'
          ? 'AI Decision Engine candidate recommendation confirmed by manager.'
          : 'Direct manager allocation selection.',
      });
      allocationsList = allocResult.allocations;
      auditLogId = allocResult.auditLogId;
    }

    const hydrated = store.getHydratedTask(taskId);
    res.status(201).json({
      task: hydrated,
      allocations: allocationsList,
      audit_log_id: auditLogId,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/tasks/:id
tasksRouter.get('/:id', (req, res) => {
  try {
    const task = store.getHydratedTask(req.params.id);
    if (!task) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }

    const recentLogs = store.auditLogs.filter((l) => l.task_id === task.id);
    const recentEvents = store.events.filter((e) => e.payload?.task_id === task.id);

    res.json({
      task,
      requirements: task.skill_requirements,
      allocations: task.allocations || [],
      audit_logs: recentLogs,
      events: recentEvents,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// PATCH /api/tasks/:id
tasksRouter.patch('/:id', (req, res) => {
  try {
    const task = store.tasks.find((t) => t.id === req.params.id);
    if (!task) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }

    const { title, description, priority, sla_deadline, estimated_effort, tags, required_location } = req.body;
    const oldPriority = task.priority;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (sla_deadline !== undefined) task.sla_deadline = sla_deadline;
    if (estimated_effort !== undefined) task.estimated_effort = Number(estimated_effort);
    if (tags !== undefined) task.tags = tags;
    if (required_location !== undefined) task.required_location = required_location;

    task.updated_at = new Date().toISOString();

    // If priority changed, emit event & log
    if (priority && priority !== oldPriority) {
      const evtId = `evt-${Date.now()}`;
      store.events.unshift({
        id: evtId,
        type: 'PRIORITY_CHANGE',
        payload: { task_id: task.id, title: task.title, old_priority: oldPriority, new_priority: priority },
        created_at: task.updated_at,
      });

      store.auditLogs.unshift({
        id: `log-${Date.now()}`,
        task_id: task.id,
        employee_id: 'system',
        event_id: evtId,
        action: 'PRIORITY_ESCALATED',
        triggered_by: 'MANAGER',
        actor_name: 'Alex Rivera',
        before_state: { priority: oldPriority },
        after_state: { priority },
        reason: `Task priority manually updated from ${oldPriority} to ${priority}.`,
        created_at: task.updated_at,
        task_title: task.title,
      });
    }

    store.recalculateAllWorkloads();
    res.json({ task: store.getHydratedTask(task.id) });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// PATCH /api/tasks/:id/status
tasksRouter.patch('/:id/status', (req, res) => {
  try {
    const task = store.tasks.find((t) => t.id === req.params.id);
    if (!task) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }

    const { status, actor_name } = req.body;
    const oldStatus = task.status;
    const validStatuses = ['UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'];
    if (!validStatuses.includes(status)) {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid task status.' } });
    }
    const allowedTransitions: Record<string, string[]> = {
      UNASSIGNED: ['ASSIGNED', 'ON_HOLD'],
      ASSIGNED: ['IN_PROGRESS', 'COMPLETED', 'ON_HOLD'],
      IN_PROGRESS: ['COMPLETED', 'ON_HOLD'],
      ON_HOLD: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'],
      COMPLETED: [],
    };
    if (status !== oldStatus && !allowedTransitions[oldStatus]?.includes(status)) {
      return res.status(409).json({ error: { code: 'CONFLICT', message: `Invalid task status transition from ${oldStatus} to ${status}.` } });
    }
    task.status = status;
    task.updated_at = new Date().toISOString();

    // If task is completed, release all active allocations!
    if (status === 'COMPLETED') {
      for (const alloc of store.allocations) {
        if (alloc.task_id === task.id && alloc.status === 'ACTIVE') {
          alloc.status = 'RELEASED';
          alloc.released_at = task.updated_at;

          store.auditLogs.unshift({
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            task_id: task.id,
            employee_id: alloc.employee_id,
            action: 'RELEASED',
            triggered_by: 'MANAGER',
            actor_name: actor_name || 'System / Employee',
            before_state: { status: 'ACTIVE', task_status: oldStatus },
            after_state: { status: 'RELEASED', task_status: 'COMPLETED' },
            reason: `Task "${task.title}" was marked as completed. Capacity freed.`,
            created_at: task.updated_at,
            task_title: task.title,
            employee_name: store.employees.find((e) => e.id === alloc.employee_id)?.name,
          });
        }
      }
    }

    store.recalculateAllWorkloads();
    res.json({ task: store.getHydratedTask(task.id) });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/tasks/:id/allocations/release
tasksRouter.post('/:id/allocations/release', (req, res) => {
  try {
    const { allocation_id, reason } = req.body;
    const result = store.releaseAllocation({
      allocationId: allocation_id,
      actorUserId: 'user-manager-1',
      actorName: 'Alex Rivera',
      reason: reason || 'Manager reassignment release',
    });

    res.json({
      released_allocation: result.releasedAllocation,
      new_proposal: result.newProposal,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// DELETE /api/tasks/:id
tasksRouter.delete('/:id', (req, res) => {
  try {
    const idx = store.tasks.findIndex((t) => t.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }

    // Release any active allocations
    for (const alloc of store.allocations) {
      if (alloc.task_id === req.params.id) {
        alloc.status = 'RELEASED';
        alloc.released_at = new Date().toISOString();
      }
    }

    store.tasks.splice(idx, 1);
    store.recalculateAllWorkloads();
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});
