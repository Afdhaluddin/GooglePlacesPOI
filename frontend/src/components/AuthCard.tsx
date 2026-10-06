import { useState, type FormEvent } from 'react';
import * as authApi from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';

type Mode = 'login' | 'register';

/**
 * Minimal friendly auth card — toggles between Login and Register.
 * On success the token is stored (localStorage) and the app unlocks.
 */
export default function AuthCard() {
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);
    try {
      if (mode === 'register') {
        await authApi.register(username, password);
        // Registered — log in straight away for a friction-free flow.
      }
      const { token } = await authApi.login(username, password);
      login(token);
    } catch (err) {
      // Surface the backend's error message when available.
      setError(
        err instanceof ApiError
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError(null);
    setInfo(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">📍 Places Favourites</h1>
        <p className="mt-1 text-sm text-gray-500">
          {mode === 'login'
            ? 'Welcome back — log in to see your favourites.'
            : 'Create an account to start saving places.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">❌ {error}</p>
          )}
          {info && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{info}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {isSubmitting
              ? 'Please wait…'
              : mode === 'login'
                ? 'Log in'
                : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          {mode === 'login' ? 'No account yet?' : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={toggleMode}
            className="font-medium text-indigo-600 hover:underline"
          >
            {mode === 'login' ? 'Register' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
