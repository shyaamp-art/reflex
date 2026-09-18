import express from 'express';
import { store } from './db/store.js';
import { tasksRouter } from './routes/tasks.js';
import { reallocationsRouter } from './routes/reallocations.js';
import { employeesRouter } from './routes/employees.js';
import { eventsRouter } from './routes/events.js';
import { auditRouter } from './routes/audit.js';
import { skillGapsRouter } from './routes/skill-gaps.js';
import { settingsRouter } from './routes/settings.js';
import { cronRouter } from './routes/cron.js';
import { supabase } from './db/supabase.js';

export function createApp() {
  const app = express();
  let currentSessionIndex = 0;

  app.use(express.json());
  // Hydrate before every request's route handler and flush mutations after the
  // response. Dummy mode returns immediately, so offline tests never contact
  // Supabase.
  app.use(async (_req, res, next) => {
    try {
      await store.ready();
      res.on('finish', () => {
        void store.persist().catch((error) => {
          console.error('Supabase persistence write failed:', error instanceof Error ? error.message : 'unknown error');
        });

        const currentUser = () => store.users[currentSessionIndex] || store.users[0];
        const deny = (res: express.Response, message: string) =>
          res.status(403).json({ error: { code: 'FORBIDDEN', message } });
        const requireManager = (req: express.Request, res: express.Response, next: express.NextFunction) => {
          if (currentUser()?.role !== 'MANAGER') return deny(res, 'Manager role is required for this operation.');
          next();
        };

        // The prototype session is still demo-backed, but every protected mutation
        // is role-gated here so the UI cannot be used as the authorization boundary.
        app.use('/api/tasks', requireManager);
        app.use('/api/reallocations', requireManager);
        app.use('/api/settings', (req, res, next) => {
          if (req.method === 'GET' || currentUser()?.role === 'MANAGER') return next();
          return deny(res, 'Manager role is required for this operation.');
        });
        app.use('/api/employees', (req, res, next) => {
          const user = currentUser();
          if (user?.role === 'MANAGER') return next();
          if (req.method === 'GET' && req.path === `/${user?.employeeId}`) return next();
          return deny(res, 'Only managers may access workforce records.');
        });
        app.use('/api/employee', (req, res, next) => {
          const user = currentUser();
          if (user?.role !== 'EMPLOYEE') return deny(res, 'Employee role is required for this operation.');
          const requestedId = typeof req.query.employee_id === 'string'
            ? req.query.employee_id
            : req.body?.employee_id;
          if (requestedId && requestedId !== user.employeeId) return deny(res, 'Employees may only access their own records.');
          if (req.body && user.employeeId) req.body.employee_id = user.employeeId;
          next();
        });
      });
      next();
    } catch (error) {
      res.status(503).json({
        error: { code: 'PERSISTENCE_UNAVAILABLE', message: error instanceof Error ? error.message : 'Supabase unavailable' },
      });
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Reflex Workforce Allocation Engine',
      persistence: supabase.health(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/me', (_req, res) => {
    const user = store.users[currentSessionIndex] || store.users[0];
    res.json({ user });
  });

  app.post('/api/me/switch-user', (req, res) => {
    const { userId } = req.body;
    const foundIdx = store.users.findIndex((u) => u.authUserId === userId || u.employeeId === userId);
    if (foundIdx >= 0) currentSessionIndex = foundIdx;
    res.json({ user: store.users[currentSessionIndex] });
  });

  app.get('/api/users', (_req, res) => res.json({ users: store.users }));

  app.use('/api/tasks', tasksRouter);
  app.use('/api/reallocations', reallocationsRouter);
  app.use('/api/employees', employeesRouter);
  app.use('/api/employee', employeesRouter);
  app.use('/api/events', eventsRouter);
  app.use('/api/audit', auditRouter);
  app.use('/api/skill-gaps', skillGapsRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/internal/cron', cronRouter);

  return app;
}
