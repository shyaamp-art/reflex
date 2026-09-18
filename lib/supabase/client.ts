import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5eiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjc5OTk5OTk5LCJleHAiOjE5OTk5OTk5OTl9.mockkey';

export function createClient() {
  if (typeof window === 'undefined') {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Singleton client with lazy getter or safe init
export const supabase =
  typeof window !== 'undefined'
    ? createBrowserClient(supabaseUrl, supabaseAnonKey)
    : (createSupabaseClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } }) as any);
