import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp } from '../server/app.js';

const server = createServer(createApp());
await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
assert(address && typeof address !== 'string');
const baseUrl = `http://127.0.0.1:${address.port}`;

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const body = await response.json();
  assert(response.ok, `${options.method || 'GET'} ${path} failed: ${response.status} ${JSON.stringify(body)}`);
  return body;
}

try {
  const health = await request('/api/health');
  assert.equal(health.status, 'ok');
  assert.deepEqual(health.persistence, { connected: false, mode: 'dummy' });

  const employees = await request('/api/employees');
  assert.equal(employees.total, 6);
  assert(employees.items.every((employee: any) => employee.skills.length >= 4));
  assert(employees.items.every((employee: any) => employee.availability.length >= 1));

  const seededTasks = await request('/api/tasks');
  assert(seededTasks.total >= 4);
  assert(seededTasks.items.some((task: any) => task.id === 'task-2' && task.priority === 'HIGH'));
  assert(seededTasks.items.some((task: any) => task.allocations.some((allocation: any) => allocation.status === 'ACTIVE')));

  const suggestions = await request('/api/tasks/allocation-suggestions', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Kafka consumer recovery',
      sla_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      estimated_effort: 8,
      required_location: 'HYBRID',
      skill_requirements: [{ skill_name: 'kafka', proficiency: 'ADVANCED', requirement_type: 'MUST_HAVE' }],
    }),
  });
  assert(suggestions.suggestions.length >= 1);
  assert(suggestions.eligible_count >= 1);
  assert.equal(suggestions.status, 'READY');

  const created = await request('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Seed-independent allocation test',
      sla_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      estimated_effort: 8,
      required_location: 'HYBRID',
      skill_requirements: [{ skill_name: 'kafka', proficiency: 'ADVANCED', requirement_type: 'MUST_HAVE' }],
      selected_employee_ids: ['emp-5'],
    }),
  });
  assert.equal(created.task.status, 'ASSIGNED');
  assert.equal(created.allocations.length, 1);
  assert.equal(created.allocations[0].employee_id, 'emp-5');

  const unavailable = await request('/api/employee/me/availability', {
    method: 'POST',
    body: JSON.stringify({
      employee_id: 'emp-1',
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      is_available: false,
      reason: 'Integration test leave',
    }),
  });
  assert(unavailable.affected_tasks_count >= 1);
  assert(unavailable.created_proposals_count >= 1);

  const pending = await request('/api/reallocations?status=PENDING');
  const replacement = pending.items.find((proposal: any) => proposal.task_id === 'task-1');
  assert(replacement, 'expected a pending replacement proposal for task-1');
  assert(replacement.items.some((item: any) => item.selected && item.employee_id !== 'emp-1'));

  const approved = await request(`/api/reallocations/${replacement.id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ decision_note: 'Approved by integration test' }),
  });
  assert.equal(approved.proposal.status, 'APPROVED');
  assert(approved.allocations.some((allocation: any) => allocation.employee_id !== 'emp-1'));

  const scan = await request('/api/internal/cron/sla', { method: 'POST' });
  assert(scan.processed >= 1);
  assert(scan.escalated_count >= 1);
  const atRisk = await request('/api/tasks?sla=at-risk');
  assert(atRisk.items.some((task: any) => task.id === 'task-2'));

  const audit = await request('/api/audit');
  assert(audit.total >= 4);
  assert(audit.items.some((entry: any) => entry.action === 'REALLOCATED'));
  const gaps = await request('/api/skill-gaps');
  assert(gaps.total >= 1);
  console.log('Backend integration tests passed');
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
