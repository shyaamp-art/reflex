import {
  Employee,
  Task,
  Allocation,
  AppEvent,
  AllocationProposal,
  AllocationLog,
  SkillGapEvent,
  AgentSettings,
  UserSession,
  Role,
  WorkMode,
  Proficiency,
  Seniority
} from '../../src/types/index.js';
import { generateReallocationProposal } from '../domain/reallocator.js';
import { updateSkillGapsOnFailure } from '../domain/skill-gap.js';
import { buildAllocationPlan } from '../domain/allocator.js';
import { supabase } from './supabase.js';
import { SupabaseRepository } from './repository.js';
import { ApiError } from '../http.js';

export const MANAGER_AVATAR_URL = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
export const EMPLOYEE_AVATAR_URL = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';

function nowDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

let idCounter = 0;
export function uid(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}-${Math.random().toString(36).substring(2, 8)}`;
}

export function requiredHeadcountFor(task: Pick<Task, 'skill_requirements'>): number {
  const reqs = task.skill_requirements || [];
  if (!reqs.length) return 1;
  return Math.max(1, ...reqs.map((r) => r.people_required || 1));
}

export class ReflexStore {
  private readonly repository = new SupabaseRepository();
  private hydration?: Promise<void>;
  private persistence?: Promise<void>;
  public skills: string[] = [
    'stripe',
    'react',
    'typescript',
    'postgresql',
    'kubernetes',
    'aws',
    'graphql',
    'python',
    'node.js',
    'redis',
    'docker',
    'tailwindcss',
    'kafka',
    'system design',
    'go',
    'next.js',
    'ci/cd',
    'security audit'
  ];

  public agentSettings: AgentSettings = {
    sla_lookahead_hours: 4,
    sla_scan_interval_minutes: 15,
    workload_soft_limit: 85,
    workload_hard_limit: 100,
    updated_at: new Date().toISOString(),
  };

  public employees: Employee[] = [];
  public tasks: Task[] = [];
  public allocations: Allocation[] = [];
  public events: AppEvent[] = [];
  public proposals: AllocationProposal[] = [];
  public auditLogs: AllocationLog[] = [];
  public skillGaps: SkillGapEvent[] = [];
  public users: UserSession[] = [];

  constructor() {
    this.seedInitialData();
    this.recalculateAllWorkloads();
  }

  public async ready(): Promise<void> {
    if (supabase.mode !== 'supabase') return;
    if (!this.hydration) {
      this.hydration = this.repository.hydrate(this).catch((error) => {
        this.hydration = undefined;
        throw error;
      });
    }
    return this.hydration;
  }

  public async persist(): Promise<void> {
    if (supabase.mode !== 'supabase') return;
    // Queue mutations instead of dropping them while a flush is in flight.
    const run = (this.persistence || Promise.resolve())
      .catch(() => undefined)
      .then(() => this.repository.persist(this));
    this.persistence = run.finally(() => { if (this.persistence === run) this.persistence = undefined; });
    return this.persistence;
  }

  private seedInitialData() {
    // 1. Seed Users
    this.users = [
      {
        authUserId: 'user-manager-1',
        role: 'MANAGER',
        employeeId: null,
        name: 'Alex Rivera',
        email: 'alex.rivera@reflex.internal',
        avatar_url: MANAGER_AVATAR_URL,
      },
      {
        authUserId: 'user-emp-1',
        role: 'EMPLOYEE',
        employeeId: 'emp-1',
        name: 'Vikram Malhotra',
        email: 'vikram.m@reflex.internal',
        avatar_url: EMPLOYEE_AVATAR_URL,
      },
      {
        authUserId: 'user-emp-2',
        role: 'EMPLOYEE',
        employeeId: 'emp-2',
        name: 'Elena Rostova',
        email: 'elena.r@reflex.internal',
        avatar_url: EMPLOYEE_AVATAR_URL,
      },
      {
        authUserId: 'user-emp-3',
        role: 'EMPLOYEE',
        employeeId: 'emp-3',
        name: 'David Chen',
        email: 'david.c@reflex.internal',
        avatar_url: EMPLOYEE_AVATAR_URL,
      },
      {
        authUserId: 'user-emp-4',
        role: 'EMPLOYEE',
        employeeId: 'emp-4',
        name: 'Maya Lin',
        email: 'maya.l@reflex.internal',
        avatar_url: EMPLOYEE_AVATAR_URL,
      },
      {
        authUserId: 'user-emp-5',
        role: 'EMPLOYEE',
        employeeId: 'emp-5',
        name: 'Marcus Vance',
        email: 'marcus.v@reflex.internal',
        avatar_url: EMPLOYEE_AVATAR_URL,
      },
      {
        authUserId: 'user-emp-6',
        role: 'EMPLOYEE',
        employeeId: 'emp-6',
        name: 'Aisha Morales',
        email: 'aisha.m@reflex.internal',
        avatar_url: EMPLOYEE_AVATAR_URL,
      },
    ];

    // 2. Seed Employees
    this.employees = [
      {
        id: 'emp-1',
        name: 'Vikram Malhotra',
        email: 'vikram.m@reflex.internal',
        team: 'Backend',
        role_title: 'Staff Backend Engineer',
        seniority: 'LEAD',
        status: 'ACTIVE',
        work_mode: 'REMOTE',
        weekly_capacity_hours: 40,
        current_workload_percent: 65,
        performance_score: 4.8,
        location: 'Bengaluru, IN (IST)',
        timezone: 'Asia/Kolkata',
        avatar_url: EMPLOYEE_AVATAR_URL,
        skills: [
          { id: 'es-1', employee_id: 'emp-1', skill_name: 'stripe', proficiency: 'EXPERT', verified: true },
          { id: 'es-2', employee_id: 'emp-1', skill_name: 'postgresql', proficiency: 'ADVANCED', verified: true },
          { id: 'es-3', employee_id: 'emp-1', skill_name: 'node.js', proficiency: 'ADVANCED', verified: true },
          { id: 'es-4', employee_id: 'emp-1', skill_name: 'system design', proficiency: 'EXPERT', verified: true },
          { id: 'es-5', employee_id: 'emp-1', skill_name: 'redis', proficiency: 'ADVANCED', verified: true },
        ],
        availability: [],
      },
      {
        id: 'emp-2',
        name: 'Elena Rostova',
        email: 'elena.r@reflex.internal',
        team: 'Infrastructure',
        role_title: 'Principal DevOps Architect',
        seniority: 'LEAD',
        status: 'ACTIVE',
        work_mode: 'HYBRID',
        weekly_capacity_hours: 40,
        current_workload_percent: 50,
        performance_score: 4.9,
        location: 'London, UK (GMT)',
        timezone: 'Europe/London',
        avatar_url: EMPLOYEE_AVATAR_URL,
        skills: [
          { id: 'es-6', employee_id: 'emp-2', skill_name: 'kubernetes', proficiency: 'EXPERT', verified: true },
          { id: 'es-7', employee_id: 'emp-2', skill_name: 'aws', proficiency: 'EXPERT', verified: true },
          { id: 'es-8', employee_id: 'emp-2', skill_name: 'docker', proficiency: 'EXPERT', verified: true },
          { id: 'es-9', employee_id: 'emp-2', skill_name: 'ci/cd', proficiency: 'ADVANCED', verified: true },
          { id: 'es-10', employee_id: 'emp-2', skill_name: 'kafka', proficiency: 'INTERMEDIATE', verified: true },
        ],
        availability: [],
      },
      {
        id: 'emp-3',
        name: 'David Chen',
        email: 'david.c@reflex.internal',
        team: 'Frontend',
        role_title: 'Senior Frontend Engineer',
        seniority: 'SENIOR',
        status: 'ACTIVE',
        work_mode: 'REMOTE',
        weekly_capacity_hours: 40,
        current_workload_percent: 45,
        performance_score: 4.6,
        location: 'San Francisco, CA (PST)',
        timezone: 'America/Los_Angeles',
        avatar_url: EMPLOYEE_AVATAR_URL,
        skills: [
          { id: 'es-11', employee_id: 'emp-3', skill_name: 'react', proficiency: 'EXPERT', verified: true },
          { id: 'es-12', employee_id: 'emp-3', skill_name: 'typescript', proficiency: 'EXPERT', verified: true },
          { id: 'es-13', employee_id: 'emp-3', skill_name: 'next.js', proficiency: 'ADVANCED', verified: true },
          { id: 'es-14', employee_id: 'emp-3', skill_name: 'tailwindcss', proficiency: 'ADVANCED', verified: true },
          { id: 'es-15', employee_id: 'emp-3', skill_name: 'graphql', proficiency: 'INTERMEDIATE', verified: true },
        ],
        availability: [],
      },
      {
        id: 'emp-4',
        name: 'Maya Lin',
        email: 'maya.l@reflex.internal',
        team: 'Backend',
        role_title: 'Senior Backend Engineer',
        seniority: 'SENIOR',
        status: 'ACTIVE',
        work_mode: 'REMOTE',
        weekly_capacity_hours: 40,
        current_workload_percent: 30,
        performance_score: 4.7,
        location: 'Toronto, CA (EST)',
        timezone: 'America/Toronto',
        avatar_url: EMPLOYEE_AVATAR_URL,
        skills: [
          { id: 'es-16', employee_id: 'emp-4', skill_name: 'stripe', proficiency: 'ADVANCED', verified: true },
          { id: 'es-17', employee_id: 'emp-4', skill_name: 'postgresql', proficiency: 'EXPERT', verified: true },
          { id: 'es-18', employee_id: 'emp-4', skill_name: 'python', proficiency: 'ADVANCED', verified: true },
          { id: 'es-19', employee_id: 'emp-4', skill_name: 'node.js', proficiency: 'INTERMEDIATE', verified: true },
        ],
        availability: [],
      },
      {
        id: 'emp-5',
        name: 'Marcus Vance',
        email: 'marcus.v@reflex.internal',
        team: 'Data & Stream',
        role_title: 'Senior Data Platform Engineer',
        seniority: 'SENIOR',
        status: 'ACTIVE',
        work_mode: 'HYBRID',
        weekly_capacity_hours: 40,
        current_workload_percent: 75,
        performance_score: 4.5,
        location: 'New York, NY (EST)',
        timezone: 'America/New_York',
        avatar_url: EMPLOYEE_AVATAR_URL,
        skills: [
          { id: 'es-20', employee_id: 'emp-5', skill_name: 'kafka', proficiency: 'EXPERT', verified: true },
          { id: 'es-21', employee_id: 'emp-5', skill_name: 'python', proficiency: 'ADVANCED', verified: true },
          { id: 'es-22', employee_id: 'emp-5', skill_name: 'redis', proficiency: 'ADVANCED', verified: true },
          { id: 'es-23', employee_id: 'emp-5', skill_name: 'docker', proficiency: 'ADVANCED', verified: true },
        ],
        availability: [],
      },
      {
        id: 'emp-6',
        name: 'Aisha Morales',
        email: 'aisha.m@reflex.internal',
        team: 'Security & QA',
        role_title: 'Lead Security Systems Engineer',
        seniority: 'LEAD',
        status: 'ACTIVE',
        work_mode: 'ONSITE',
        weekly_capacity_hours: 40,
        current_workload_percent: 40,
        performance_score: 4.8,
        location: 'San Francisco, CA (PST)',
        timezone: 'America/Los_Angeles',
        avatar_url: EMPLOYEE_AVATAR_URL,
        skills: [
          { id: 'es-24', employee_id: 'emp-6', skill_name: 'security audit', proficiency: 'EXPERT', verified: true },
          { id: 'es-25', employee_id: 'emp-6', skill_name: 'postgresql', proficiency: 'ADVANCED', verified: true },
          { id: 'es-26', employee_id: 'emp-6', skill_name: 'aws', proficiency: 'ADVANCED', verified: true },
          { id: 'es-27', employee_id: 'emp-6', skill_name: 'system design', proficiency: 'ADVANCED', verified: true },
          { id: 'es-28', employee_id: 'emp-6', skill_name: 'kubernetes', proficiency: 'EXPERT', verified: true },
        ],
        availability: [],
      },
    ];

    // Keep a visible availability history in the demo while leaving every
    // seeded employee available for allocation.
    const availabilityStart = new Date(nowDateOnly());
    const availabilityEnd = new Date(availabilityStart.getTime() + 30 * 24 * 60 * 60 * 1000);
    this.employees.forEach((employee, index) => {
      employee.availability = [{
        id: `avail-seed-${index + 1}`,
        employee_id: employee.id,
        start_date: formatDateOnly(availabilityStart),
        end_date: formatDateOnly(availabilityEnd),
        is_available: true,
        reason: 'Regular working availability',
        created_at: new Date().toISOString(),
      }];
    });

    // 3. Seed Initial Tasks
    const now = new Date();
    const task1Sla = new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString();
    const task2Sla = new Date(now.getTime() + 2.5 * 60 * 60 * 1000).toISOString(); // Demo SLA is within the three-hour window
    const task3Sla = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
    const task4Sla = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString();

    this.tasks = [
      {
        id: 'task-1',
        title: 'Payment Webhook Idempotency & Latency Remediation',
        description: 'Resolve webhook timeout anomalies under peak traffic during international payment batching. Enforce Redis lock deduplication and zero duplicate charge guarantees.',
        status: 'ASSIGNED',
        priority: 'HIGH',
        sla_deadline: task1Sla,
        estimated_effort: 16,
        tags: ['stripe', 'payments', 'redis', 'backend'],
        required_location: 'REMOTE',
        created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        skill_requirements: [
          {
            id: 'req-1',
            task_id: 'task-1',
            skill_name: 'stripe',
            proficiency: 'ADVANCED',
            people_required: 1,
            requirement_type: 'MUST_HAVE',
          },
          {
            id: 'req-2',
            task_id: 'task-1',
            skill_name: 'redis',
            proficiency: 'ADVANCED',
            people_required: 1,
            requirement_type: 'NICE_TO_HAVE',
          },
        ],
      },
      {
        id: 'task-2',
        title: 'Kubernetes Ingress Controller Memory Spike Mitigation',
        description: 'Investigate and tune Envoy proxy buffer limits in the production EKS cluster. Memory leaks causing pod eviction cycles under SSL renegotiation.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        sla_deadline: task2Sla,
        estimated_effort: 12,
        tags: ['kubernetes', 'aws', 'docker', 'infrastructure'],
        required_location: 'HYBRID',
        created_at: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        skill_requirements: [
          {
            id: 'req-3',
            task_id: 'task-2',
            skill_name: 'kubernetes',
            proficiency: 'EXPERT',
            people_required: 1,
            requirement_type: 'MUST_HAVE',
          },
          {
            id: 'req-4',
            task_id: 'task-2',
            skill_name: 'aws',
            proficiency: 'ADVANCED',
            people_required: 1,
            requirement_type: 'MUST_HAVE',
          },
        ],
      },
      {
        id: 'task-3',
        title: 'Cross-Region PostgreSQL Read Replica Synchronization',
        description: 'Configure logical replication stream between us-east and eu-central. Mitigate WAL retention lag and verify read consistency for European customers.',
        status: 'ASSIGNED',
        priority: 'HIGH',
        sla_deadline: task3Sla,
        estimated_effort: 20,
        tags: ['postgresql', 'database', 'system design'],
        required_location: 'REMOTE',
        created_at: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
        skill_requirements: [
          {
            id: 'req-5',
            task_id: 'task-3',
            skill_name: 'postgresql',
            proficiency: 'ADVANCED',
            people_required: 1,
            requirement_type: 'MUST_HAVE',
          },
        ],
      },
      {
        id: 'task-4',
        title: 'Kafka Event Backpressure Buffer Hardening',
        description: 'Resolve consumer lag during peak analytics ingestion. Rebalance partitions and optimize memory allocation across consumer groups.',
        status: 'UNASSIGNED',
        priority: 'MEDIUM',
        sla_deadline: task4Sla,
        estimated_effort: 14,
        tags: ['kafka', 'streaming', 'python'],
        required_location: 'HYBRID',
        created_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        skill_requirements: [
          {
            id: 'req-6',
            task_id: 'task-4',
            skill_name: 'kafka',
            proficiency: 'ADVANCED',
            people_required: 1,
            requirement_type: 'MUST_HAVE',
          },
        ],
      },
    ];

    // 4. Seed Initial Allocations
    this.allocations = [
      {
        id: 'alloc-1',
        task_id: 'task-1',
        employee_id: 'emp-1', // Vikram Malhotra
        status: 'ACTIVE',
        allocated_by: 'AI',
        allocated_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'alloc-2',
        task_id: 'task-2',
        employee_id: 'emp-2', // Elena Rostova
        status: 'ACTIVE',
        allocated_by: 'AI',
        allocated_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'alloc-3',
        task_id: 'task-3',
        employee_id: 'emp-4', // Maya Lin
        status: 'ACTIVE',
        allocated_by: 'MANUAL',
        allocated_at: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // 5. Seed Events
    this.events = [
      {
        id: 'evt-1',
        type: 'NEW_TASK',
        payload: { task_id: 'task-1', title: 'Payment Webhook Idempotency & Latency Remediation' },
        created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'evt-2',
        type: 'SLA_RISK',
        payload: { task_id: 'task-2', title: 'Kubernetes Ingress Controller Memory Spike Mitigation', hours_remaining: 2.5 },
        created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // 6. Seed Audit Logs
    this.auditLogs = [
      {
        id: 'log-1',
        task_id: 'task-1',
        employee_id: 'emp-1',
        event_id: 'evt-1',
        action: 'ALLOCATED',
        triggered_by: 'AI',
        actor_user_id: 'user-manager-1',
        actor_name: 'Alex Rivera',
        before_state: { status: 'UNASSIGNED', assigned_employees: [] },
        after_state: { status: 'ASSIGNED', assigned_employees: ['Vikram Malhotra'] },
        reason: 'Optimal match (94.5/100). Expert Stripe proficiency, 4.8 performance rating, and safe projected workload (65%).',
        created_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'log-2',
        task_id: 'task-2',
        employee_id: 'emp-2',
        action: 'ALLOCATED',
        triggered_by: 'AI',
        actor_user_id: 'user-manager-1',
        actor_name: 'Alex Rivera',
        before_state: { status: 'UNASSIGNED', assigned_employees: [] },
        after_state: { status: 'IN_PROGRESS', assigned_employees: ['Elena Rostova'] },
        reason: 'Lead DevOps coverage (96.2/100). Unmatched Kubernetes & AWS expertise with hybrid work mode match.',
        created_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'log-3',
        task_id: 'task-2',
        employee_id: 'emp-2',
        event_id: 'evt-2',
        action: 'PRIORITY_ESCALATED',
        triggered_by: 'AI',
        actor_name: 'SLA Automated Worker',
        before_state: { priority: 'HIGH' },
        after_state: { priority: 'CRITICAL' },
        reason: 'Automated lookahead scan detected task deadline approaching in under 4 hours.',
        created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // 7. Seed Skill Gaps
    this.skillGaps = [
      {
        id: 'gap-1',
        skill_name: 'kafka',
        times_failed: 4,
        related_events: ['evt-2'],
        last_occurred: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        recommendation_strength: 0.8,
        suggested_hiring_priority: 2,
      },
      {
        id: 'gap-2',
        skill_name: 'security audit',
        times_failed: 2,
        related_events: [],
        last_occurred: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
        recommendation_strength: 0.4,
        suggested_hiring_priority: 3,
      },
    ];
  }

  // Helper: Recalculate dynamic workloads across all employees based on active task assignments
  public recalculateAllWorkloads() {
    const workloadMap: Record<string, number> = {};
    for (const emp of this.employees) {
      workloadMap[emp.id] = 0;
    }

    for (const alloc of this.allocations) {
      if (alloc.status === 'ACTIVE') {
        const task = this.tasks.find((t) => t.id === alloc.task_id);
        const emp = this.employees.find((e) => e.id === alloc.employee_id);
        if (task && emp && task.status !== 'COMPLETED') {
          const cap = emp.weekly_capacity_hours || 40;
          const loadPercent = (task.estimated_effort / cap) * 100;
          workloadMap[emp.id] = (workloadMap[emp.id] || 0) + loadPercent;
        }
      }
    }

    for (const emp of this.employees) {
      emp.current_workload_percent = Math.round(workloadMap[emp.id] || 0);
    }
  }

  private activeTasksForScoring(excludeTaskId?: string): Record<string, Pick<Task, 'id' | 'sla_deadline' | 'priority'>[]> {
    const result: Record<string, Pick<Task, 'id' | 'sla_deadline' | 'priority'>[]> = {};
    for (const allocation of this.allocations) {
      if (allocation.status !== 'ACTIVE' || allocation.task_id === excludeTaskId) continue;
      const task = this.tasks.find((item) => item.id === allocation.task_id);
      if (!task || task.status === 'COMPLETED') continue;
      (result[allocation.employee_id] ||= []).push({ id: task.id, sla_deadline: task.sla_deadline, priority: task.priority });
    }
    return result;
  }

  /**
   * Workload for scoring is derived from active allocations, which already
   * include the task being (re)allocated. Subtract this task's own effort for
   * employees already assigned to it so projected workload is not double
   * counted during re-allocation and staleness checks.
   */
  private workforceForScoring(taskId: string): Employee[] {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return this.employees;
    const effort = Number(task.estimated_effort) || 0;
    const assigned = new Set(
      this.allocations
        .filter((a) => a.task_id === taskId && a.status === 'ACTIVE')
        .map((a) => a.employee_id)
    );
    if (!assigned.size || !effort) return this.employees;
    return this.employees.map((emp) => {
      if (!assigned.has(emp.id)) return emp;
      const cap = emp.weekly_capacity_hours || 40;
      const ownShare = (effort / cap) * 100;
      return { ...emp, current_workload_percent: Math.max(0, (emp.current_workload_percent || 0) - ownShare) };
    });
  }

  // Build a fresh reallocation proposal for a task with scoring inputs that
  // match the approve/override revalidation (store allocations, not the raw
  // task objects which carry no embedded allocations).
  private buildProposalForTask(task: Task, event: AppEvent): {
    proposal: AllocationProposal;
    uncoveredSkills: string[];
  } {
    const nowStr = new Date().toISOString();
    const propResult = generateReallocationProposal({
      event,
      affectedTask: task,
      workforce: this.employees,
      currentAllocations: this.allocations.filter(
        (a) => a.task_id === task.id && a.status === 'ACTIVE'
      ),
      activeTasksMap: this.activeTasksForScoring(task.id),
      slaLookaheadHours: this.agentSettings.sla_lookahead_hours || 4,
    });
    return {
      proposal: {
        id: uid('prop'),
        ...propResult.proposal,
        created_at: nowStr,
      },
      uncoveredSkills: propResult.uncoveredSkills,
    };
  }

  /**
   * Recompute a task's open (PENDING or NO_FEASIBLE_MATCH) proposal in place so
   * the manager queue never serves stale candidates (e.g. a leave window
   * deleted after the proposal was created, or workloads shifted by newer
   * allocations). The proposal id is preserved; the trigger event is updated
   * to the latest one.
   */
  private refreshPendingProposal(
    existing: AllocationProposal,
    task: Task,
    event: AppEvent
  ): { proposal: AllocationProposal; uncoveredSkills: string[] } {
    const fresh = this.buildProposalForTask(task, event);
    existing.event_id = fresh.proposal.event_id;
    existing.trigger_type = fresh.proposal.trigger_type;
    existing.proposal_type = fresh.proposal.proposal_type;
    existing.status = fresh.proposal.status;
    existing.summary = fresh.proposal.summary;
    existing.explanation = fresh.proposal.explanation;
    existing.items = fresh.proposal.items;
    (existing as any).candidates = (fresh.proposal as any).candidates;
    existing.decided_at = undefined;
    existing.decided_by = undefined;
    existing.decision_note = `Refreshed after ${event.type} at ${event.created_at}.`;
    return { proposal: existing, uncoveredSkills: fresh.uncoveredSkills };
  }

  // Get hydrated task with requirements, allocations, and employees
  public getHydratedTask(taskId: string): Task | null {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const taskAllocations = this.allocations
      .filter((a) => a.task_id === taskId)
      .map((a) => {
        const emp = this.employees.find((e) => e.id === a.employee_id);
        return { ...a, employee: emp };
      });

    return {
      ...task,
      allocations: taskAllocations,
    };
  }

  // Get hydrated proposals with items and employees
  public getHydratedProposals(statusFilter?: string): AllocationProposal[] {
    let list = this.proposals;
    if (statusFilter) {
      list = list.filter((p) => p.status === statusFilter);
    }

    return list.map((p) => {
      const task = this.getHydratedTask(p.task_id) || undefined;
      const event = this.events.find((e) => e.id === p.event_id);
      const items = p.items.map((it) => {
        const emp = this.employees.find((e) => e.id === it.employee_id);
        const srcTask = it.source_task_id ? this.tasks.find((t) => t.id === it.source_task_id) : undefined;
        return {
          ...it,
          employee: emp,
          source_task: srcTask,
        };
      });
      const currentAllocations = this.allocations
        .filter((a) => a.task_id === p.task_id && a.status === 'ACTIVE')
        .map((a) => ({ ...a, employee: this.employees.find((e) => e.id === a.employee_id) }));
      // Back-compat for UI reading proposal.candidates / proposal.trigger_type.
      const candidates = items
        .filter((it) => it.selected)
        .concat(items.filter((it) => !it.selected))
        .map((it) => {
          const emp = this.employees.find((e) => e.id === it.employee_id);
          return {
            employeeId: it.employee_id,
            employeeName: emp?.name || it.employee_id,
            roleTitle: emp?.role_title || '',
            seniority: emp?.seniority || 'MID',
            team: emp?.team || '',
            workMode: emp?.work_mode || 'REMOTE',
            currentWorkload: emp?.current_workload_percent || 0,
            projectedWorkload: emp?.current_workload_percent || 0,
            eligible: true,
            score: it.score,
            breakdown: {
              skillMatch: it.skill_match,
              availability: it.availability,
              workload: it.workload,
              performance: it.performance,
              slaSafety: it.sla_safety,
              location: it.location,
            },
            rejectionReasons: [] as string[],
            reason: it.reason,
          };
        });

      return {
        ...p,
        trigger_type: p.trigger_type || event?.type as any,
        candidates: (p as any).candidates?.length ? (p as any).candidates : candidates as any,
        task,
        event,
        items,
        current_allocations: currentAllocations,
      };
    });
  }

  // Atomic Allocation Execution
  public executeAllocation(params: {
    taskId: string;
    employeeIds: string[];
    allocatedBy: 'AI' | 'MANUAL';
    actorUserId?: string;
    actorName?: string;
    reason: string;
  }): { task: Task; allocations: Allocation[]; auditLogId: string } {
    const { taskId, employeeIds, allocatedBy, actorUserId, actorName, reason } = params;
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) throw new ApiError(404, 'NOT_FOUND', `Task with id ${taskId} not found`);
    if (task.status === 'COMPLETED') throw new ApiError(409, 'CONFLICT', 'Cannot allocate a COMPLETED task');
    const uniqueEmployeeIds = [...new Set(employeeIds)];
    if (!uniqueEmployeeIds.length) throw new ApiError(422, 'VALIDATION_ERROR', 'At least one employee is required');
    if (uniqueEmployeeIds.length !== employeeIds.length) throw new ApiError(409, 'CONFLICT', 'Duplicate employees are not allowed');
    if (uniqueEmployeeIds.some((id) => !this.employees.some((employee) => employee.id === id))) {
      throw new ApiError(404, 'NOT_FOUND', 'One or more employees were not found');
    }
    const headcountRequired = requiredHeadcountFor(task);
    if (uniqueEmployeeIds.length > headcountRequired) {
      throw new ApiError(422, 'VALIDATION_ERROR', `Selection exceeds required headcount (${headcountRequired})`);
    }
    const plan = buildAllocationPlan(task, this.workforceForScoring(task.id), new Date(), this.activeTasksForScoring(task.id), this.agentSettings.sla_lookahead_hours || 4);
    const candidateById = new Map(plan.rankedCandidates.map((candidate) => [candidate.employeeId, candidate]));
    const invalidSelections = uniqueEmployeeIds
      .map((id) => candidateById.get(id))
      .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate && !candidate.eligible));
    if (invalidSelections.length > 0) {
      const details = invalidSelections
        .map((candidate) => `${candidate.employeeName}: ${candidate.rejectionReasons.join('; ')}`)
        .join(' | ');
      throw new ApiError(422, 'VALIDATION_ERROR', `Selected employees do not satisfy the task hard constraints. ${details}`);
    }
    if (plan.status !== 'READY') {
      throw new ApiError(422, 'VALIDATION_ERROR', 'No feasible allocation satisfies MUST_HAVE coverage and headcount');
    }

    const beforeEmployees = this.allocations
      .filter((a) => a.task_id === taskId && a.status === 'ACTIVE')
      .map((a) => this.employees.find((e) => e.id === a.employee_id)?.name || a.employee_id);

    // Release any current active allocations if reassigned
    const nowStr = new Date().toISOString();
    for (const alloc of this.allocations) {
      if (alloc.task_id === taskId && alloc.status === 'ACTIVE') {
        if (!uniqueEmployeeIds.includes(alloc.employee_id)) {
          alloc.status = 'RELEASED';
          alloc.released_at = nowStr;
        }
      }
    }

    // Add new active allocations
    const createdAllocations: Allocation[] = [];
    for (const empId of uniqueEmployeeIds) {
      const existing = this.allocations.find(
        (a) => a.task_id === taskId && a.employee_id === empId && a.status === 'ACTIVE'
      );
      if (!existing) {
        const newAlloc: Allocation = {
          id: uid('alloc'),
          task_id: taskId,
          employee_id: empId,
          status: 'ACTIVE',
          allocated_by: allocatedBy,
          allocated_at: nowStr,
        };
        this.allocations.push(newAlloc);
        createdAllocations.push(newAlloc);
      }
    }

    // Never downgrade IN_PROGRESS or allocate onto COMPLETED.
    if (task.status !== 'IN_PROGRESS') task.status = 'ASSIGNED';
    task.updated_at = nowStr;

    // Recalculate workloads
    this.recalculateAllWorkloads();

    const afterEmployees = this.allocations
      .filter((a) => a.task_id === taskId && a.status === 'ACTIVE')
      .map((a) => this.employees.find((e) => e.id === a.employee_id)?.name || a.employee_id);

    // Create Audit Log
    const auditLogId = uid('log');
    this.auditLogs.unshift({
      id: auditLogId,
      task_id: taskId,
      employee_id: uniqueEmployeeIds[0] || 'team',
      action: 'ALLOCATED',
      triggered_by: allocatedBy === 'AI' ? 'AI' : 'MANAGER',
      actor_user_id: actorUserId,
      actor_name: actorName || (allocatedBy === 'AI' ? 'Reflex AI Engine' : 'Manager'),
      before_state: { status: beforeEmployees.length ? 'ASSIGNED' : 'UNASSIGNED', assigned_employees: beforeEmployees },
      after_state: { status: 'ASSIGNED', assigned_employees: afterEmployees },
      reason,
      created_at: nowStr,
      task_title: task.title,
      employee_name: afterEmployees.join(', '),
    });

    return {
      task: this.getHydratedTask(taskId)!,
      allocations: createdAllocations,
      auditLogId,
    };
  }

  // Atomic Release Allocation
  public releaseAllocation(params: {
    allocationId: string;
    actorUserId?: string;
    actorName?: string;
    reason: string;
  }): { releasedAllocation: Allocation; newProposal?: AllocationProposal } {
    const { allocationId, actorUserId, actorName, reason } = params;
    const alloc = this.allocations.find((a) => a.id === allocationId);
    if (!alloc) throw new ApiError(404, 'NOT_FOUND', `Allocation ${allocationId} not found`);
    if (alloc.status !== 'ACTIVE') throw new ApiError(409, 'CONFLICT', 'Allocation is already released');

    const nowStr = new Date().toISOString();
    alloc.status = 'RELEASED';
    alloc.released_at = nowStr;

    const task = this.tasks.find((t) => t.id === alloc.task_id);
    const emp = this.employees.find((e) => e.id === alloc.employee_id);

    // Check remaining active allocations for task
    const remainingActive = this.allocations.filter(
      (a) => a.task_id === alloc.task_id && a.status === 'ACTIVE'
    );
    if (task && remainingActive.length === 0) {
      task.status = 'UNASSIGNED';
      task.updated_at = nowStr;
    }

    this.recalculateAllWorkloads();

    // Create Audit Log
    this.auditLogs.unshift({
      id: uid('log'),
      task_id: alloc.task_id,
      employee_id: alloc.employee_id,
      action: 'RELEASED',
      triggered_by: 'MANAGER',
      actor_user_id: actorUserId,
      actor_name: actorName || 'Manager',
      before_state: { status: 'ACTIVE', employee: emp?.name },
      after_state: { status: 'RELEASED', employee: emp?.name },
      reason: reason || 'Manual employee release by manager',
      created_at: nowStr,
      task_title: task?.title,
      employee_name: emp?.name,
    });

    // If task has unassigned slots, automatically trigger reallocation proposal
    let newProposal: AllocationProposal | undefined;
    if (task && task.status !== 'COMPLETED') {
      const evt: AppEvent = {
        id: uid('evt'),
        type: 'PERSON_UNAVAILABLE',
        payload: { task_id: task.id, employee_id: alloc.employee_id, reason },
        created_at: nowStr,
      };
      this.events.unshift(evt);

      // One open proposal per task — refresh the existing PENDING or
      // NO_FEASIBLE_MATCH one instead of creating duplicates or stacking
      // repeated no-match alerts. Decided proposals are never touched.
      const existingPending = this.proposals.find(
        (p) => p.task_id === task.id && (p.status === 'PENDING' || p.status === 'NO_FEASIBLE_MATCH')
      );
      if (existingPending) {
        const refreshed = this.refreshPendingProposal(existingPending, task, evt);
        newProposal = refreshed.proposal;
        if (refreshed.uncoveredSkills.length > 0) {
          this.skillGaps = updateSkillGapsOnFailure(this.skillGaps, refreshed.uncoveredSkills, evt.id, this.employees);
        }
      } else {
        const built = this.buildProposalForTask(task, evt);
        newProposal = built.proposal;
        this.proposals.unshift(newProposal);

        if (built.uncoveredSkills.length > 0) {
          this.skillGaps = updateSkillGapsOnFailure(this.skillGaps, built.uncoveredSkills, evt.id, this.employees);
        }
      }
    }

    return {
      releasedAllocation: alloc,
      newProposal,
    };
  }

  // Employee marks availability / leave
  public setEmployeeAvailability(params: {
    employeeId: string;
    startDate: string;
    endDate: string;
    isAvailable: boolean;
    reason: string;
  }): {
    availability: any;
    affectedTasksCount: number;
    createdProposalsCount: number;
    events: AppEvent[];
  } {
    const { employeeId, startDate, endDate, isAvailable, reason } = params;
    const emp = this.employees.find((e) => e.id === employeeId);
    if (!emp) throw new ApiError(404, 'NOT_FOUND', `Employee ${employeeId} not found`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate < startDate) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Availability dates must be YYYY-MM-DD with end_date on or after start_date');
    }

    if (!emp.availability) emp.availability = [];

    const nowStr = new Date().toISOString();
    const newAvail = {
      id: uid('avail'),
      employee_id: employeeId,
      start_date: startDate,
      end_date: endDate,
      is_available: isAvailable,
      reason,
      created_at: nowStr,
    };
    emp.availability.unshift(newAvail);

    // If marked unavailable, scan for overlapping active tasks!
    let affectedTasksCount = 0;
    let createdProposalsCount = 0;
    const triggeredEvents: AppEvent[] = [];

    // Always publish the leave event, including leave that does not currently
    // affect an allocation, so managers can see the employee state change.
    if (!isAvailable) {
      const event: AppEvent = {
        id: uid('evt'),
        type: 'PERSON_UNAVAILABLE',
        payload: {
          employee_id: employeeId,
          employee_name: emp.name,
          start_date: startDate,
          end_date: endDate,
          reason,
          affected_tasks_count: 0,
        },
        created_at: nowStr,
      };
      this.events.unshift(event);
      triggeredEvents.push(event);
    }

    if (!isAvailable) {
      // Find active allocations for this employee
      const activeAllocs = this.allocations.filter(
        (a) => a.employee_id === employeeId && a.status === 'ACTIVE'
      );

      for (const alloc of activeAllocs) {
        const task = this.tasks.find((t) => t.id === alloc.task_id);
        if (task && task.status !== 'COMPLETED') {
          affectedTasksCount += 1;

          // Emit PERSON_UNAVAILABLE event
          const eventId = uid('evt');
          const evt: AppEvent = {
            id: eventId,
            type: 'PERSON_UNAVAILABLE',
            payload: {
              employee_id: employeeId,
              employee_name: emp.name,
              task_id: task.id,
              task_title: task.title,
              start_date: startDate,
              end_date: endDate,
              reason,
            },
            created_at: nowStr,
          };
          this.events.unshift(evt);
          triggeredEvents.push(evt);

          // One open proposal per task — refresh it when workforce state
          // changed instead of stacking independently-approvable duplicates,
          // repeated no-match alerts, or stale candidates in the manager queue.
          const existingPending = this.proposals.find(
            (p) => p.task_id === task.id && (p.status === 'PENDING' || p.status === 'NO_FEASIBLE_MATCH')
          );
          if (existingPending) {
            const refreshed = this.refreshPendingProposal(existingPending, task, evt);
            createdProposalsCount += 1;
            if (refreshed.uncoveredSkills.length > 0) {
              this.skillGaps = updateSkillGapsOnFailure(
                this.skillGaps,
                refreshed.uncoveredSkills,
                eventId,
                this.employees,
              );
            }
            continue;
          }

          // Generate dynamic reallocation proposal
          const built = this.buildProposalForTask(task, evt);

          const proposal: AllocationProposal = built.proposal;
          this.proposals.unshift(proposal);
          createdProposalsCount += 1;

          if (built.uncoveredSkills.length > 0) {
            this.skillGaps = updateSkillGapsOnFailure(
              this.skillGaps,
              built.uncoveredSkills,
              eventId,
              this.employees,
            );
          }
        }
      }
    }

    return {
      availability: newAvail,
      affectedTasksCount,
      createdProposalsCount,
      events: triggeredEvents,
    };
  }

  // Approve Reallocation Proposal
  public approveProposal(params: {
    proposalId: string;
    actorUserId?: string;
    actorName?: string;
    decisionNote?: string;
  }): { proposal: AllocationProposal; allocations: Allocation[]; auditLogIds: string[] } {
    const { proposalId, actorUserId, actorName, decisionNote } = params;
    const proposal = this.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new ApiError(404, 'NOT_FOUND', `Proposal ${proposalId} not found`);
    if (proposal.status !== 'PENDING') throw new ApiError(409, 'CONFLICT', `Proposal is not in PENDING state (${proposal.status})`);

    const task = this.tasks.find((t) => t.id === proposal.task_id);
    if (!task) throw new ApiError(404, 'NOT_FOUND', `Task ${proposal.task_id} not found`);
    if (task.status === 'COMPLETED') throw new ApiError(409, 'CONFLICT', 'Cannot approve allocation onto a COMPLETED task');

    const selectedItems = proposal.items.filter((it) => it.selected);
    if (selectedItems.length === 0) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Proposal has no selected candidate items');
    }
    const currentPlan = buildAllocationPlan(task, this.workforceForScoring(task.id), new Date(), this.activeTasksForScoring(task.id), this.agentSettings.sla_lookahead_hours || 4);
    const eligibleNow = new Set(currentPlan.rankedCandidates.filter((candidate) => candidate.eligible).map((candidate) => candidate.employeeId));
    if (currentPlan.status !== 'READY' || selectedItems.some((item) => !eligibleNow.has(item.employee_id))) {
      throw new ApiError(409, 'CONFLICT', 'Proposal is stale; workforce or task state has changed');
    }

    const nowStr = new Date().toISOString();
    const beforeEmployees = this.allocations
      .filter((a) => a.task_id === task.id && a.status === 'ACTIVE')
      .map((a) => this.employees.find((e) => e.id === a.employee_id)?.name || a.employee_id);

    // Release old active allocations for this task, keeping holders who remain
    // selected so approval does not churn unchanged assignments.
    const selectedIds = new Set(selectedItems.map((item) => item.employee_id));
    for (const alloc of this.allocations) {
      if (alloc.task_id === task.id && alloc.status === 'ACTIVE' && !selectedIds.has(alloc.employee_id)) {
        alloc.status = 'RELEASED';
        alloc.released_at = nowStr;
      }
    }

    // Allocate new approved candidates, retaining already-active ones.
    const createdAllocations: Allocation[] = [];
    for (const item of selectedItems) {
      const retained = this.allocations.find(
        (a) => a.task_id === task.id && a.employee_id === item.employee_id && a.status === 'ACTIVE'
      );
      if (retained) {
        createdAllocations.push(retained);
        continue;
      }
      const newAlloc: Allocation = {
        id: uid('alloc'),
        task_id: task.id,
        employee_id: item.employee_id,
        status: 'ACTIVE',
        allocated_by: 'AI',
        allocated_at: nowStr,
      };
      this.allocations.push(newAlloc);
      createdAllocations.push(newAlloc);
    }

    proposal.status = 'APPROVED';
    proposal.decided_at = nowStr;
    proposal.decided_by = actorUserId || 'user-manager-1';
    proposal.decision_note = decisionNote || 'Approved AI Reallocation recommendation';

    if (task.status !== 'IN_PROGRESS') task.status = 'ASSIGNED';
    task.updated_at = nowStr;

    this.recalculateAllWorkloads();

    const afterEmployees = selectedItems.map(
      (s) => this.employees.find((e) => e.id === s.employee_id)?.name || s.employee_id
    );

    // Create Audit Log
    const auditId = uid('log');
    this.auditLogs.unshift({
      id: auditId,
      task_id: task.id,
      employee_id: selectedItems[0].employee_id,
      event_id: proposal.event_id,
      action: 'REALLOCATED',
      triggered_by: 'MANAGER',
      actor_user_id: actorUserId,
      actor_name: actorName || 'Manager',
      before_state: { status: 'UNAVAILABLE / REPLACED', assigned_employees: beforeEmployees },
      after_state: { status: task.status, assigned_employees: afterEmployees },
      reason: decisionNote || `Approved reallocation replacement for ${task.title}. Workloads and SLA bounds rebalanced.`,
      created_at: nowStr,
      task_title: task.title,
      employee_name: afterEmployees.join(', '),
    });

    return {
      proposal,
      allocations: createdAllocations,
      auditLogIds: [auditId],
    };
  }

  // Manual Override for Proposal
  public overrideProposal(params: {
    proposalId: string;
    employeeIds: string[];
    actorUserId?: string;
    actorName?: string;
    reason: string;
  }): { proposal: AllocationProposal; allocations: Allocation[]; auditLogIds: string[] } {
    const { proposalId, employeeIds, actorUserId, actorName, reason } = params;
    const proposal = this.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new ApiError(404, 'NOT_FOUND', `Proposal ${proposalId} not found`);

    const task = this.tasks.find((t) => t.id === proposal.task_id);
    if (!task) throw new ApiError(404, 'NOT_FOUND', `Task ${proposal.task_id} not found`);
    if (task.status === 'COMPLETED') throw new ApiError(409, 'CONFLICT', 'Cannot allocate onto a COMPLETED task');
    // Overrides are allowed on PENDING and on NO_FEASIBLE_MATCH proposals: the
    // latter is a recovery path (manager picks after freeing capacity), and
    // eligibility is always revalidated live below. Decided proposals stay
    // immutable to prevent double execution.
    if (proposal.status !== 'PENDING' && proposal.status !== 'NO_FEASIBLE_MATCH') {
      throw new ApiError(409, 'CONFLICT', `Proposal is not in PENDING state (${proposal.status})`);
    }
    const uniqueEmployeeIds = [...new Set(employeeIds)];
    if (!uniqueEmployeeIds.length) throw new ApiError(422, 'VALIDATION_ERROR', 'At least one employee is required');
    if (uniqueEmployeeIds.length !== employeeIds.length) throw new ApiError(409, 'CONFLICT', 'Duplicate employees are not allowed');
    const requiredHeadcount = requiredHeadcountFor(task);
    if (uniqueEmployeeIds.length > requiredHeadcount) throw new ApiError(422, 'VALIDATION_ERROR', `Override cannot exceed required headcount (${requiredHeadcount})`);
    if (uniqueEmployeeIds.some((id) => !this.employees.some((employee) => employee.id === id))) {
      throw new ApiError(404, 'NOT_FOUND', 'One or more employees were not found');
    }
    const plan = buildAllocationPlan(task, this.workforceForScoring(task.id), new Date(), this.activeTasksForScoring(task.id), this.agentSettings.sla_lookahead_hours || 4);
    const candidateById = new Map(plan.rankedCandidates.map((candidate) => [candidate.employeeId, candidate]));
    const ineligibleSelections = uniqueEmployeeIds
      .map((id) => ({ id, candidate: candidateById.get(id) }))
      .filter(({ candidate }) => !candidate || !candidate.eligible);
    if (ineligibleSelections.length > 0) {
      const details = ineligibleSelections
        .map(({ id, candidate }) => {
          const name = candidate?.employeeName || this.employees.find((e) => e.id === id)?.name || id;
          const reasons = candidate?.rejectionReasons?.length ? candidate.rejectionReasons.join('; ') : 'did not satisfy the task hard constraints';
          return `${name}: ${reasons}`;
        })
        .join(' | ');
      throw new ApiError(422, 'VALIDATION_ERROR', `Override includes ineligible employees. ${details}`);
    }

    const nowStr = new Date().toISOString();
    const beforeEmployees = this.allocations
      .filter((a) => a.task_id === task.id && a.status === 'ACTIVE')
      .map((a) => this.employees.find((e) => e.id === a.employee_id)?.name || a.employee_id);

    // Release old allocations, keeping holders who remain selected.
    const overrideIds = new Set(uniqueEmployeeIds);
    for (const alloc of this.allocations) {
      if (alloc.task_id === task.id && alloc.status === 'ACTIVE' && !overrideIds.has(alloc.employee_id)) {
        alloc.status = 'RELEASED';
        alloc.released_at = nowStr;
      }
    }

    const createdAllocations: Allocation[] = [];
    for (const empId of uniqueEmployeeIds) {
      const retained = this.allocations.find(
        (a) => a.task_id === task.id && a.employee_id === empId && a.status === 'ACTIVE'
      );
      if (retained) {
        createdAllocations.push(retained);
        continue;
      }
      const newAlloc: Allocation = {
        id: uid('alloc'),
        task_id: task.id,
        employee_id: empId,
        status: 'ACTIVE',
        allocated_by: 'MANUAL',
        allocated_at: nowStr,
      };
      this.allocations.push(newAlloc);
      createdAllocations.push(newAlloc);
    }

    proposal.status = 'OVERRIDDEN';
    proposal.decided_at = nowStr;
    proposal.decided_by = actorUserId;
    proposal.decision_note = reason || 'Manager manual override';

    if (task.status !== 'IN_PROGRESS') task.status = 'ASSIGNED';
    task.updated_at = nowStr;

    this.recalculateAllWorkloads();

    const afterEmployees = uniqueEmployeeIds.map(
      (id) => this.employees.find((e) => e.id === id)?.name || id
    );

    const auditId = uid('log');
    this.auditLogs.unshift({
      id: auditId,
      task_id: task.id,
      employee_id: uniqueEmployeeIds[0] || 'team',
      event_id: proposal.event_id,
      action: 'REALLOCATED',
      triggered_by: 'MANAGER',
      actor_user_id: actorUserId,
      actor_name: actorName || 'Manager',
      before_state: { assigned_employees: beforeEmployees },
      after_state: { assigned_employees: afterEmployees, override: true, status: task.status },
      reason: reason || 'Manager manual override applied.',
      created_at: nowStr,
      task_title: task.title,
      employee_name: afterEmployees.join(', '),
    });

    return {
      proposal,
      allocations: createdAllocations,
      auditLogIds: [auditId],
    };
  }

  // SLA Background Worker Execution
  public runSlaScan(): {
    processedCount: number;
    escalatedCount: number;
    proposalsCount: number;
  } {
    const lookaheadHours = this.agentSettings.sla_lookahead_hours || 4;
    const nowMs = Date.now();
    const lookaheadMs = lookaheadHours * 60 * 60 * 1000;

    let processedCount = 0;
    let escalatedCount = 0;
    let proposalsCount = 0;

    for (const task of this.tasks) {
      if (task.status === 'COMPLETED') continue;

      const deadlineMs = new Date(task.sla_deadline).getTime();
      const diffMs = deadlineMs - nowMs;

      // Include breached (overdue) SLAs: anything at or past the deadline
      // within the lookahead window is at risk.
      if (diffMs <= lookaheadMs) {
        processedCount++;

        // Escalate priority if not yet CRITICAL
        if (task.priority !== 'CRITICAL') {
          const oldPriority = task.priority;
          task.priority = 'CRITICAL';
          task.updated_at = new Date().toISOString();
          escalatedCount++;

          const evtId = uid('evt');
          const evt: AppEvent = {
            id: evtId,
            type: 'SLA_RISK',
            payload: {
              task_id: task.id,
              task_title: task.title,
              hours_remaining: Math.round((diffMs / (60 * 60 * 1000)) * 10) / 10,
              escalated_from: oldPriority,
              breached: diffMs <= 0,
            },
            created_at: new Date().toISOString(),
          };
          this.events.unshift(evt);

          this.auditLogs.unshift({
            id: uid('log'),
            task_id: task.id,
            employee_id: 'system',
            event_id: evtId,
            action: 'PRIORITY_ESCALATED',
            triggered_by: 'AI',
            actor_name: 'SLA Automated Worker',
            before_state: { priority: oldPriority },
            after_state: { priority: 'CRITICAL' },
            reason: diffMs <= 0
              ? `SLA deadline breached ${Math.abs(diffMs / (60 * 60 * 1000)).toFixed(1)}h ago. Automated priority escalation triggered.`
              : `SLA deadline is in ${(diffMs / (60 * 60 * 1000)).toFixed(1)}h. Automated priority escalation triggered.`,
            created_at: new Date().toISOString(),
            task_title: task.title,
          });

          // One open proposal per task — refresh it so SLA re-scans never
          // leave stale candidates or stacked no-match alerts in the queue.
          const existingPending = this.proposals.find(
            (p) => p.task_id === task.id && (p.status === 'PENDING' || p.status === 'NO_FEASIBLE_MATCH')
          );
          if (existingPending) {
            const refreshed = this.refreshPendingProposal(existingPending, task, evt);
            if (refreshed.proposal.status === 'PENDING') {
              proposalsCount++;
            }
            if (refreshed.uncoveredSkills.length > 0) {
              this.skillGaps = updateSkillGapsOnFailure(this.skillGaps, refreshed.uncoveredSkills, evtId, this.employees);
            }
          } else {
            const built = this.buildProposalForTask(task, evt);

            if (built.proposal.status === 'PENDING') {
              this.proposals.unshift(built.proposal);
              proposalsCount++;
            } else {
              // Keep NO_FEASIBLE_MATCH visible so managers see why no transfer
              // is possible instead of an empty queue.
              this.proposals.unshift(built.proposal);
            }
            if (built.uncoveredSkills.length > 0) {
              this.skillGaps = updateSkillGapsOnFailure(this.skillGaps, built.uncoveredSkills, evtId, this.employees);
            }
          }
        }
      }
    }

    return { processedCount, escalatedCount, proposalsCount };
  }
}

export const store = new ReflexStore();
