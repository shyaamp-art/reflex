// Reflex AI - Realistic Initial Data and Scenarios

export const INITIAL_EMPLOYEES = [
  {
    id: 'emp-1',
    name: 'Sarah Chen',
    role: 'Staff Full-Stack Engineer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    email: 'sarah.chen@reflex.ai',
    location: 'San Francisco, US (PST)',
    skills: [
      { name: 'React', proficiency: 'Expert' },
      { name: 'Node.js', proficiency: 'Expert' },
      { name: 'Stripe', proficiency: 'Advanced' },
      { name: 'TypeScript', proficiency: 'Expert' },
      { name: 'GraphQL', proficiency: 'Advanced' }
    ],
    workload: 65, // %
    maxCapacityHours: 40,
    currentAllocatedHours: 26,
    availability: 'Available', // 'Available', 'Busy', 'On Leave', 'Sick'
    performanceScore: 96,
    activeTasks: ['Checkout Redesign V2', 'API Rate Limiter'],
    reliabilityRating: 'Exceptional (99% SLA adherence)'
  },
  {
    id: 'emp-2',
    name: 'Marcus Vance',
    role: 'Senior Backend & Payments Specialist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    email: 'marcus.vance@reflex.ai',
    location: 'London, UK (GMT)',
    skills: [
      { name: 'Node.js+Stripe', proficiency: 'Expert' },
      { name: 'Node.js', proficiency: 'Expert' },
      { name: 'PostgreSQL', proficiency: 'Advanced' },
      { name: 'Go', proficiency: 'Intermediate' },
      { name: 'Kafka', proficiency: 'Advanced' }
    ],
    workload: 40, // %
    maxCapacityHours: 40,
    currentAllocatedHours: 16,
    availability: 'Available',
    performanceScore: 94,
    activeTasks: ['Webhook Reliability Service'],
    reliabilityRating: 'High (97% SLA adherence)'
  },
  {
    id: 'emp-3',
    name: 'Elena Rostova',
    role: 'Frontend UI/UX Architect',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    email: 'elena.rostova@reflex.ai',
    location: 'Berlin, DE (CET)',
    skills: [
      { name: 'React', proficiency: 'Expert' },
      { name: 'CSS/Tailwind', proficiency: 'Expert' },
      { name: 'Next.js', proficiency: 'Expert' },
      { name: 'TypeScript', proficiency: 'Advanced' }
    ],
    workload: 85, // %
    maxCapacityHours: 40,
    currentAllocatedHours: 34,
    availability: 'Busy',
    performanceScore: 98,
    activeTasks: ['Design System Tokens v3', 'Accessibility Audit'],
    reliabilityRating: 'Exceptional (100% SLA adherence)'
  },
  {
    id: 'emp-4',
    name: 'Aarav Patel',
    role: 'Full-Stack Distributed Systems Engineer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    email: 'aarav.patel@reflex.ai',
    location: 'Bengaluru, IN (IST)',
    skills: [
      { name: 'React', proficiency: 'Advanced' },
      { name: 'Node.js', proficiency: 'Advanced' },
      { name: 'Node.js+Stripe', proficiency: 'Advanced' },
      { name: 'Docker', proficiency: 'Expert' },
      { name: 'Kubernetes', proficiency: 'Advanced' }
    ],
    workload: 50, // %
    maxCapacityHours: 40,
    currentAllocatedHours: 20,
    availability: 'Available',
    performanceScore: 92,
    activeTasks: ['Cluster Health Monitor'],
    reliabilityRating: 'High (95% SLA adherence)'
  },
  {
    id: 'emp-5',
    name: 'Devon Miles',
    role: 'Mobile & Full-Stack Engineer',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    email: 'devon.miles@reflex.ai',
    location: 'Toronto, CA (EST)',
    skills: [
      { name: 'React', proficiency: 'Intermediate' },
      { name: 'React Native', proficiency: 'Advanced' },
      { name: 'Node.js', proficiency: 'Intermediate' },
      { name: 'GraphQL', proficiency: 'Intermediate' }
    ],
    workload: 30, // %
    maxCapacityHours: 40,
    currentAllocatedHours: 12,
    availability: 'Available',
    performanceScore: 89,
    activeTasks: ['Push Notification Delivery'],
    reliabilityRating: 'Steady (91% SLA adherence)'
  },
  {
    id: 'emp-6',
    name: 'Leila Farhat',
    role: 'Cloud Security & FinTech Engineer',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    email: 'leila.farhat@reflex.ai',
    location: 'Paris, FR (CET)',
    skills: [
      { name: 'Node.js+Stripe', proficiency: 'Expert' },
      { name: 'Cybersecurity', proficiency: 'Expert' },
      { name: 'AWS', proficiency: 'Advanced' },
      { name: 'Node.js', proficiency: 'Advanced' }
    ],
    workload: 90, // %
    maxCapacityHours: 40,
    currentAllocatedHours: 36,
    availability: 'Busy',
    performanceScore: 97,
    activeTasks: ['PCI-DSS 4.0 Compliance Audit', 'Vault Key Rotation'],
    reliabilityRating: 'Exceptional (99% SLA adherence)'
  }
];

export const INITIAL_TASKS = [
  {
    id: 'TASK-101',
    title: 'Global Payments Gateway Integration',
    description: 'Integrate Stripe Elements multi-currency payment intents with automatic retry on 3D-Secure fallback.',
    priority: 'High',
    slaDeadline: '2026-09-24T18:00',
    status: 'In Progress',
    assignedTo: ['emp-2', 'emp-1'],
    skillsRequired: [
      { skill: 'React', proficiency: 'Advanced', people: 1, type: 'Must-have' },
      { skill: 'Node.js+Stripe', proficiency: 'Expert', people: 1, type: 'Must-have' }
    ],
    reallocationHistory: [
      {
        timestamp: '2026-09-18 10:15',
        reason: 'Initial AI Balanced Allocation',
        action: 'Assigned Marcus Vance and Sarah Chen'
      }
    ]
  },
  {
    id: 'TASK-102',
    title: 'Customer Self-Serve Billing Portal',
    description: 'Customer subscription dashboard enabling tier upgrades, billing history downloads, and payment method updates.',
    priority: 'Medium',
    slaDeadline: '2026-09-28T12:00',
    status: 'Allocated',
    assignedTo: ['emp-4'],
    skillsRequired: [
      { skill: 'React', proficiency: 'Intermediate', people: 1, type: 'Must-have' },
      { skill: 'Node.js', proficiency: 'Advanced', people: 1, type: 'Nice-to-have' }
    ],
    reallocationHistory: []
  },
  {
    id: 'TASK-103',
    title: 'Zero-Downtime Database Migration',
    description: 'Migrate transactional order schema from v2 to v3 with shadow writes and zero customer downtime.',
    priority: 'Urgent',
    slaDeadline: '2026-09-20T23:59',
    status: 'In Progress',
    assignedTo: ['emp-6'],
    skillsRequired: [
      { skill: 'PostgreSQL', proficiency: 'Expert', people: 1, type: 'Must-have' },
      { skill: 'Node.js', proficiency: 'Advanced', people: 1, type: 'Must-have' }
    ],
    reallocationHistory: []
  },
  {
    id: 'TASK-104',
    title: 'Unified Design System Component Audit',
    description: 'Standardize modal dialogs, accessible forms, and color tokens across 14 internal micro-frontends.',
    priority: 'Low',
    slaDeadline: '2026-10-05T17:00',
    status: 'Backlog',
    assignedTo: [],
    skillsRequired: [
      { skill: 'React', proficiency: 'Expert', people: 1, type: 'Must-have' },
      { skill: 'CSS/Tailwind', proficiency: 'Advanced', people: 1, type: 'Must-have' }
    ],
    reallocationHistory: []
  },
  {
    id: 'TASK-105',
    title: 'Mobile Push Notification Service',
    description: 'Deliver APNs and FCM batch notifications for order fulfillment status within 3 seconds of webhook receipt.',
    priority: 'Medium',
    slaDeadline: '2026-09-30T15:00',
    status: 'Allocated',
    assignedTo: ['emp-5'],
    skillsRequired: [
      { skill: 'React Native', proficiency: 'Advanced', people: 1, type: 'Must-have' },
      { skill: 'Node.js', proficiency: 'Intermediate', people: 1, type: 'Nice-to-have' }
    ],
    reallocationHistory: []
  }
];

export const SKILL_CATALOG = [
  'React',
  'Node.js+Stripe',
  'Node.js',
  'TypeScript',
  'PostgreSQL',
  'GraphQL',
  'Docker',
  'Kubernetes',
  'CSS/Tailwind',
  'React Native',
  'Cybersecurity',
  'AWS',
  'Go',
  'Kafka'
];

export const PROFICIENCY_LEVELS = [
  'Junior',
  'Intermediate',
  'Advanced',
  'Expert'
];
