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

  const currentUser = () => store.users[currentSessionIndex] || store.users[0];
  const deny = (res: express.Response, message: string) =>
    res.status(403).json({ error: { code: 'FORBIDDEN', message } });
  const requireManager = (_req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (currentUser()?.role !== 'MANAGER') return deny(res, 'Manager role is required for this operation.');
    next();
  };

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
      });
      next();
    } catch (error) {
      res.status(503).json({
        error: { code: 'PERSISTENCE_UNAVAILABLE', message: error instanceof Error ? error.message : 'Supabase unavailable' },
      });
    }
  });

  // RBAC guards — registered at startup, evaluated per request before routers.
  // Temporary compatibility guard until Supabase JWT middleware is enabled.
  // NOTE: /api/employee/me/* uses query/body employee_id; the guard below
  // forces it to the session employee so callers cannot impersonate others.
  app.use('/api/tasks', requireManager);
  app.use('/api/reallocations', requireManager);
  app.use('/api/settings', (req, res, next) => {
    if (req.method === 'GET' || currentUser()?.role === 'MANAGER') return next();
    return deny(res, 'Manager role is required for this operation.');
  });
  // Mounted twice (/api/employees and /api/employee share a router). Guard by
  // full original URL so /api/employee/me/* is treated as the employee portal.
  app.use('/api/employees', (req, res, next) => {
    const user = currentUser();
    if (user?.role === 'MANAGER') return next();
    if (req.method === 'GET' && req.path === `/${user?.employeeId}`) return next();
    return deny(res, 'Only managers may access workforce records.');
  });
  app.use('/api/employee', (req, res, next) => {
    const user = currentUser();
    // Managers may act through the portal in dummy/test mode; employees are
    // restricted to their own records.
    if (user?.role === 'MANAGER') {
      (req as any).sessionUser = user;
      return next();
    }
    if (user?.role !== 'EMPLOYEE') return deny(res, 'Employee role is required for this operation.');
    const requestedId = typeof req.query.employee_id === 'string' ? req.query.employee_id : req.body?.employee_id;
    if (requestedId && requestedId !== user.employeeId) return deny(res, 'Employees may only access their own records.');
    if (req.body && user.employeeId) req.body.employee_id = user.employeeId;
    if (req.query && user.employeeId && !req.query.employee_id) req.query.employee_id = user.employeeId;
    (req as any).sessionUser = user;
    next();
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

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body || {};
      if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
        return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Username and password are required.' } });
      }

      const user = store.users.find((candidate) =>
        candidate.email.toLowerCase() === username.trim().toLowerCase() ||
        candidate.name.toLowerCase() === username.trim().toLowerCase()
      );
      if (!user) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' } });

      if (supabase.mode === 'supabase' && supabase.client) {
        const { error } = await supabase.client.auth.signInWithPassword({
          email: user.email,
          password,
        });
        if (error) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' } });
      } else {
        return res.status(503).json({ error: { code: 'AUTH_UNAVAILABLE', message: 'Password authentication requires Supabase persistence.' } });
      }

      currentSessionIndex = store.users.findIndex((candidate) => candidate.authUserId === user.authUserId);
      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: { code: 'AUTH_ERROR', message: error instanceof Error ? error.message : 'Unable to sign in.' } });
    }
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
