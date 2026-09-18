import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const defaultPassword = process.env.DEMO_DEFAULT_PASSWORD || 'ReflexDemo!2026';

const demoUsers = [
  {
    email: 'alex.rivera@reflex.internal',
    password: process.env.DEMO_MANAGER_PASSWORD || defaultPassword,
    role: 'MANAGER',
    employeeId: null,
    name: 'Alex Rivera',
    authUserId: 'user-manager-1',
  },
  {
    email: 'vikram.m@reflex.internal',
    password: process.env.DEMO_EMPLOYEE_PASSWORD || defaultPassword,
    role: 'EMPLOYEE',
    employeeId: 'emp-1',
    name: 'Vikram Malhotra',
    authUserId: 'user-emp-1',
  },
  {
    email: 'elena.r@reflex.internal',
    password: process.env.DEMO_EMPLOYEE_PASSWORD || defaultPassword,
    role: 'EMPLOYEE',
    employeeId: 'emp-2',
    name: 'Elena Rostova',
    authUserId: 'user-emp-2',
  },
  {
    email: 'david.c@reflex.internal',
    password: process.env.DEMO_EMPLOYEE_PASSWORD || defaultPassword,
    role: 'EMPLOYEE',
    employeeId: 'emp-3',
    name: 'David Chen',
    authUserId: 'user-emp-3',
  },
  {
    email: 'maya.l@reflex.internal',
    password: process.env.DEMO_EMPLOYEE_PASSWORD || defaultPassword,
    role: 'EMPLOYEE',
    employeeId: 'emp-4',
    name: 'Maya Lin',
    authUserId: 'user-emp-4',
  },
  {
    email: 'marcus.v@reflex.internal',
    password: process.env.DEMO_EMPLOYEE_PASSWORD || defaultPassword,
    role: 'EMPLOYEE',
    employeeId: 'emp-5',
    name: 'Marcus Vance',
    authUserId: 'user-emp-5',
  },
  {
    email: 'aisha.m@reflex.internal',
    password: process.env.DEMO_EMPLOYEE_PASSWORD || defaultPassword,
    role: 'EMPLOYEE',
    employeeId: 'emp-6',
    name: 'Aisha Morales',
    authUserId: 'user-emp-6',
  },
] as const;

async function findAuthUser(email: string) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < 100) return null;
  }
  return null;
}

async function provisionUser(user: (typeof demoUsers)[number]) {
  let authUser = await findAuthUser(user.email);

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { name: user.name, role: user.role, employee_id: user.employeeId },
    });
    if (error) throw error;
    authUser = data.user;
  } else {
    const { data, error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: user.password,
      email_confirm: true,
      user_metadata: { name: user.name, role: user.role, employee_id: user.employeeId },
    });
    if (error) throw error;
    authUser = data.user;
  }

  const { error: profileError } = await supabase
    .from('users')
    .update({ auth_user_id: authUser.id, role: user.role, employee_id: user.employeeId, name: user.name, email: user.email })
    .eq('email', user.email);

  if (profileError) throw profileError;

  return { ...user, authUserId: authUser.id };
}

const provisioned = [];
for (const user of demoUsers) {
  provisioned.push(await provisionUser(user));
}

console.table(provisioned.map(({ email, role, password }) => ({ email, role, password })));
console.log('Demo Auth users provisioned. Passwords are stored as hashes by Supabase Auth, not in public.users.');
