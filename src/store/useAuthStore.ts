/**
 * Zustand store untuk authentication state management
 */

import { create } from 'zustand';
import { AuthState } from '@/types';
import { validateCredentials, saveSession, getSession, clearSession } from '@/lib/auth';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  // Initialize auth from localStorage
  initAuth: () => {
    const user = getSession();
    if (user) {
      set({ user, isAuthenticated: true });
    }
  },

  // Login function
  login: (username: string, password: string) => {
    const user = validateCredentials(username, password);
    if (user) {
      saveSession(user);
      set({ user, isAuthenticated: true });
      return true;
    }
    return false;
  },

  // Logout function
  logout: () => {
    clearSession();
    set({ user: null, isAuthenticated: false });
  },
}));
