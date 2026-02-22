/**
 * Type definitions untuk BRIMOB Panic Alert System
 */

// User roles
export type UserRole = 'admin' | 'user';

// User interface
export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
}

// Alert message interface
export interface AlertMessage {
  type: 'panic_alert';
  id: string;
  message: string;
  location: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged?: boolean;
}

// Auth state interface
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  initAuth: () => void;
}

// Broadcast channel message types
export type BroadcastMessageType = 'panic_alert';

export interface BroadcastMessage {
  type: BroadcastMessageType;
  data: AlertMessage;
}
