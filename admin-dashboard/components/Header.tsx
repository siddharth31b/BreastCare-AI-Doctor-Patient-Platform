'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Shield, CheckCircle2 } from 'lucide-react';
import { adminApi } from '../lib/api';

export function Header() {
  const router = useRouter();

  const handleLogout = () => {
    adminApi.setAuthToken('');
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* System Live Status */}
      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Clinical Network Online
        </span>
        <span className="text-xs text-slate-500 hidden sm:inline">
          PostgreSQL Database & Supabase Storage Active
        </span>
      </div>

      {/* User Session & Logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
            <Shield className="w-4 h-4 text-sky-700" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-none">Clinical Administrator</p>
            <p className="text-[11px] text-slate-500 mt-1">admin@narisetu.org</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors"
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
