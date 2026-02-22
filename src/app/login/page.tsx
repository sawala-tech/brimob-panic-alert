/**
 * Login Page - Form login dengan validasi credentials
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { unlockAudio } from '@/lib/audio';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated, user, initAuth } = useAuthStore();
  const router = useRouter();

  // Initialize auth on mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'admin' ? '/admin' : '/user';
      router.push(redirectPath);
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const success = login(username, password);

    if (success) {
      // Unlock audio context setelah login
      await unlockAudio();
      console.log('✅ Audio unlocked after login');
      
      const currentUser = useAuthStore.getState().user;
      const redirectPath = currentUser?.role === 'admin' ? '/admin' : '/user';
      router.push(redirectPath);
    } else {
      setError('Username atau password salah');
      setPassword('');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-red-950">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🚔</div>
          <h1 className="text-3xl font-black text-white mb-2">BRIMOB</h1>
          <h2 className="text-xl font-bold text-red-500">Alert System</h2>
          <p className="text-gray-400 text-sm mt-2">Panic Alert System Kepolisian</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 border border-red-900/30">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                placeholder="Masukkan username"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                placeholder="Masukkan password"
                required
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 uppercase tracking-wide"
            >
              {isLoading ? 'Memproses...' : 'Login'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-500 mb-3 font-semibold">Demo Credentials:</p>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-mono">Admin: admin / admin123</span>
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-mono">User: user1 / user123</span>
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-mono">User: user2 / user123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
