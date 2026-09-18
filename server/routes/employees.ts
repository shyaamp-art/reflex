import { Router } from 'express';
import { store } from '../db/store.js';
import { EmployeeSkill } from '../../src/types/index.js';

export const employeesRouter = Router();

// GET /api/employees
employeesRouter.get('/', (req, res) => {
  try {
    const { search, team, status, workload, skill } = req.query;
    let list = [...store.employees];

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.role_title.toLowerCase().includes(q)
      );
    }

    if (team && typeof team === 'string' && team !== 'ALL') {
      list = list.filter((e) => e.team === team);
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      list = list.filter((e) => e.status === status);
    }

    if (workload === 'high') {
      list = list.filter((e) => e.current_workload_percent >= 80);
    } else if (workload === 'normal') {
      list = list.filter((e) => e.current_workload_percent < 80);
    }

    if (skill && typeof skill === 'string' && skill !== 'ALL') {
      const s = skill.toLowerCase();
      list = list.filter((e) =>
        e.skills.some((sk) => sk.skill_name.toLowerCase() === s)
      );
    }

    // Attach activeAllocationsCount
    const enriched = list.map((e) => {
      const activeCount = store.allocations.filter(
        (a) => a.employee_id === e.id && a.status === 'ACTIVE'
      ).length;
      return {
        ...e,
        activeAllocationsCount: activeCount,
      };
    });

    res.json({
      items: enriched,
      total: enriched.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/employees/:id
employeesRouter.get('/:id', (req, res) => {
  try {
    const emp = store.employees.find((e) => e.id === req.params.id);
    if (!emp) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Employee not found' } });
    }

    const activeAllocations = store.allocations
      .filter((a) => a.employee_id === emp.id && a.status === 'ACTIVE')
      .map((a) => {
        const t = store.tasks.find((task) => task.id === a.task_id);
        return {
          ...a,
          task: t,
        };
      });

    res.json({
      employee: emp,
      skills: emp.skills,
      availability: emp.availability || [],
      active_allocations: activeAllocations,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// PATCH /api/employees/:id
employeesRouter.patch('/:id', (req, res) => {
  try {
    const emp = store.employees.find((e) => e.id === req.params.id);
    if (!emp) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Employee not found' } });
    }

    const { team, location, timezone, work_mode, role_title, seniority, status } = req.body;
    if (team !== undefined) emp.team = team;
    if (location !== undefined) emp.location = location;
    if (timezone !== undefined) emp.timezone = timezone;
    if (work_mode !== undefined) emp.work_mode = work_mode;
    if (role_title !== undefined) emp.role_title = role_title;
    if (seniority !== undefined) emp.seniority = seniority;
    if (status !== undefined) emp.status = status;

    store.recalculateAllWorkloads();
    res.json({ employee: emp });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// PUT /api/employees/:id/skills
employeesRouter.put('/:id/skills', (req, res) => {
  try {
    const emp = store.employees.find((e) => e.id === req.params.id);
    if (!emp) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Employee not found' } });
    }

    const { skills } = req.body;
    if (!Array.isArray(skills)) {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'skills array is required' } });
    }
    if (skills.some((s: any) => !s || typeof s.skill_name !== 'string' || !s.skill_name.trim() ||
      !['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].includes(s.proficiency || 'INTERMEDIATE'))) {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Each skill needs a name and valid proficiency.' } });
    }

    emp.skills = skills.map((s: any, idx: number) => ({
      id: s.id || `es-${emp.id}-${idx}`,
      employee_id: emp.id,
      skill_name: s.skill_name.trim().toLowerCase(),
      proficiency: s.proficiency || 'INTERMEDIATE',
      verified: s.verified !== undefined ? s.verified : true,
    }));

    res.json({ skills: emp.skills });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// =======================================================
// Employee Personal Portal Routes
// =======================================================

// GET /api/employee/me/tasks
employeesRouter.get('/me/tasks', (req, res) => {
  try {
    const empId = (req.query.employee_id as string) || 'emp-1';
    const emp = store.employees.find((e) => e.id === empId);

    const activeAllocs = store.allocations.filter(
      (a) => a.employee_id === empId && a.status === 'ACTIVE'
    );

    const assignedTasks = activeAllocs
      .map((a) => {
        const task = store.getHydratedTask(a.task_id);
        return {
          allocation: a,
          task,
        };
      })
      .filter((item) => item.task !== null);

    res.json({
      employee: emp,
      items: assignedTasks,
      total: assignedTasks.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// PATCH /api/employee/me/tasks/:taskId/status
employeesRouter.patch('/me/tasks/:taskId/status', (req, res) => {
  try {
    const task = store.tasks.find((t) => t.id === req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }

    const { status, employee_name } = req.body;
    const oldStatus = task.status;
    task.status = status;
    task.updated_at = new Date().toISOString();

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
            triggered_by: 'AI',
            actor_name: employee_name || 'Assigned Engineer',
            before_state: { status: 'ACTIVE', task_status: oldStatus },
            after_state: { status: 'RELEASED', task_status: 'COMPLETED' },
            reason: `Task "${task.title}" completed by engineer. Capacity released.`,
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

// GET /api/employee/me/availability
employeesRouter.get('/me/availability', (req, res) => {
  try {
    const empId = (req.query.employee_id as string) || 'emp-1';
    const emp = store.employees.find((e) => e.id === empId);
    res.json({
      items: emp?.availability || [],
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/employee/me/availability
// When employee submits unavailability, this triggers dynamic reallocation!
employeesRouter.post('/me/availability', (req, res) => {
  try {
    const { employee_id = 'emp-1', start_date, end_date, is_available = false, reason = 'Personal leave' } = req.body;

    if (!start_date || !end_date) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'start_date and end_date are required' },
      });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date) || !/^\d{4}-\d{2}-\d{2}$/.test(end_date) || end_date < start_date) {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Dates must be YYYY-MM-DD and end_date cannot precede start_date.' } });
    }

    const result = store.setEmployeeAvailability({
      employeeId: employee_id,
      startDate: start_date,
      endDate: end_date,
      isAvailable: is_available,
      reason,
    });

    res.status(201).json({
      availability: result.availability,
      affected_tasks_count: result.affectedTasksCount,
      created_proposals_count: result.createdProposalsCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// DELETE /api/employee/me/availability/:id
employeesRouter.delete('/me/availability/:id', (req, res) => {
  try {
    const empId = (req.query.employee_id as string) || 'emp-1';
    const emp = store.employees.find((e) => e.id === empId);
    if (emp && emp.availability) {
      emp.availability = emp.availability.filter((a) => a.id !== req.params.id);
    }
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});
