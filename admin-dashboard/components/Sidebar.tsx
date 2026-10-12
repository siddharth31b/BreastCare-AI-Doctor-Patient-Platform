'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  FileText,
  Activity,
  ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Clinical Overview', icon: LayoutDashboard },
  { href: '/patients', label: 'Patient Registry', icon: Users },
  { href: '/assessments', label: 'Clinical Assessments', icon: FileText },
  { href: '/doctors', label: 'Doctors & Tablets', icon: Stethoscope },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen">
      {/* Hospital System Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 gap-3">
        <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0">
          <Activity className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-tight">NariSetu Admin</h1>
          <p className="text-[11px] text-slate-500 font-medium truncate">Clinical Management System</p>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 px-3 py-5 space-y-6">
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Clinical Workflow
          </p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-50 text-sky-800 font-semibold border-l-4 border-sky-600 pl-2.5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-700' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Hospital Infrastructure & Compliance Footer */}
      <div className="p-3 m-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
        <div className="flex items-center gap-1.5 text-slate-800 font-semibold mb-1 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Role Isolation Active</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-normal">
          Authorized hospital administrator session. Clinical audit logging enabled.
        </p>
      </div>
    </aside>
  );
}
