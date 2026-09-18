// lib/auth.ts - Client & Session Auth Helper
import { UserRole } from './types';

export interface AuthSession {
  email: string;
  name: string;
  role: UserRole;
  employeeId: string;
  avatar?: string;
}

export const DEMO_MANAGER: AuthSession = {
  email: 'manager@reflex.local',
  name: 'Alex Rivera',
  role: 'MANAGER',
  employeeId: 'emp-mgr-1',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
};

export const DEMO_EMPLOYEE: AuthSession = {
  email: 'priya@reflex.local',
  name: 'Priya Sharma',
  role: 'EMPLOYEE',
  employeeId: 'emp-priya-01',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
};

const STORAGE_KEY = 'reflex_auth_session';

export function getStoredSession(): AuthSession {
  if (typeof window === 'undefined') return DEMO_MANAGER;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return DEMO_MANAGER;
}

export function setStoredSession(session: AuthSession | null): void {
  if (typeof window === 'undefined') return;
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    document.cookie = `${STORAGE_KEY}=; path=/; max-age=0`;
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    document.cookie = `${STORAGE_KEY}=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=86400`;
  }
}
