import dotenv from 'dotenv';

dotenv.config();

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key || process.env.REFLEX_PERSISTENCE !== 'supabase') {
  console.log('Supabase smoke skipped (set REFLEX_PERSISTENCE=supabase, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(0);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };
for (const table of ['users', 'employees', 'tasks']) {
  const response = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, { headers });
  if (!response.ok) throw new Error(`${table} read failed (${response.status})`);
  console.log(`${table}: readable`);
}
console.log('Supabase smoke passed (read-only).');
