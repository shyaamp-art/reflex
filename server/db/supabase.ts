import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type PersistenceMode = 'dummy' | 'supabase';

const mode: PersistenceMode = process.env.REFLEX_PERSISTENCE === 'supabase' ? 'supabase' : 'dummy';
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export interface SupabaseConnector {
  readonly mode: PersistenceMode;
  readonly client?: SupabaseClient;
  health(): { connected: boolean; mode: PersistenceMode; configuration_error?: string };
}

class Connector implements SupabaseConnector {
  readonly mode = mode;
  readonly client = mode === 'supabase' && url && serviceRoleKey
    ? createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : undefined;

  health() {
    if (this.mode === 'dummy') return { connected: false as const, mode: this.mode };
    if (!url || !serviceRoleKey) {
      return {
        connected: false as const,
        mode: this.mode,
        configuration_error: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for supabase persistence.',
      };
    }
    return { connected: true as const, mode: this.mode };
  }
}

export const supabase = new Connector();
