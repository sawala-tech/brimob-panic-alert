/**
 * Auth helper - Hardcoded credentials dan login/logout functions
 */

import { User } from '@/types';

// Hardcoded users database
export const USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Administrator',
  },
  {
    id: '2',
    username: 'user1',
    password: 'user123',
    role: 'user',
    name: 'Anggota 1',
  },
  {
    id: '3',
    username: 'user2',
    password: 'user123',
    role: 'user',
    name: 'Anggota 2',
  },
];

const AUTH_STORAGE_KEY = 'brimob_auth_user';

/**
 * Validate login credentials
 */
export function validateCredentials(username: string, password: string): User | null {
  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );
  return user || null;
}

/**
 * Save user session to localStorage
 */
export function saveSession(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  }
}

/**
 * Get user session from localStorage
 */
export function getSession(): User | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as User;
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Clear user session
 */
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

/**
 * Get total registered users count
 */
export function getTotalUsers(): number {
  return USERS.filter((u) => u.role === 'user').length;
}
