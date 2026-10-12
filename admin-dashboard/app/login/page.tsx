'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Lock, Mail, ShieldCheck, Stethoscope, Hospital } from 'lucide-react';
import { adminApi, getApiUrl } from '../../lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = password.trim().startsWith('Bearer ')
        ? password.trim().replace(/^Bearer\s+/i, '')
        : password.trim();

      const res = await fetch(`${getApiUrl()}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Authentication failed: Invalid credentials or unverified admin token.');
      }

      const data = await res.json();
      if (data.role !== 'ADMIN') {
        throw new Error('Forbidden: Account does not have administrator privileges.');
      }

      adminApi.setAuthToken(token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-slate-900">
      {/* Top hospital banner */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 mb-3.5 shadow-sm">
            <Activity className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">NariSetu Admin</h1>
          <p className="text-xs font-semibold text-sky-700 uppercase tracking-wider mt-0.5">
            NariSetu – BreastCare AI Clinical Platform
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Clinical Administration & Screening Portal
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Staff Clinical Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hospital.org"
                className="w-full bg-slate-50/60 border border-slate-300 rounded-lg pl-10 pr-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-sky-600 focus:bg-white transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50/60 border border-slate-300 rounded-lg pl-10 pr-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-sky-600 focus:bg-white transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-700 hover:bg-sky-800 text-white font-semibold py-2.5 rounded-lg text-xs shadow-sm transition-colors disabled:opacity-50 mt-1 cursor-pointer"
          >
            {loading ? 'Authenticating Staff...' : 'Sign In to Clinical Portal'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
          <Hospital className="w-3.5 h-3.5 text-slate-400" />
          <span>Restricted to Authorized Clinical Personnel • HIPAA Compliant</span>
        </div>
      </div>
    </div>
  );
}
