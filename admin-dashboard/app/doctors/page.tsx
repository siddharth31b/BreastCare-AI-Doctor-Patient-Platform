'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Stethoscope, Tablet, Mail, Phone, Calendar, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { adminApi, Doctor } from '../../lib/api';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDoctors() {
      try {
        const list = await adminApi.getDoctors();
        setDoctors(list || []);
      } catch (err) {
        console.warn('Doctors fetch note:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDoctors();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 mb-1">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>CLINICAL STAFF & HARDWARE REGISTRY</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                Doctors & Tablet Workstations
              </h2>
              <p className="text-slate-500 text-xs md:text-sm mt-0.5">
                Authorized medical personnel, assigned clinical screening tablets, and active operating status.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm font-semibold">
                Total Physicians: <span className="text-sky-700 font-bold">{doctors.length}</span>
              </span>
            </div>
          </div>

          {/* Physician Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              <div className="col-span-full py-12 text-center text-slate-400">
                Loading clinical doctor and station registry...
              </div>
            ) : doctors.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                No physician profiles registered in the system.
              </div>
            ) : (
              doctors.map((doc) => {
                const isActive = doc.status?.toUpperCase() === 'ACTIVE';
                return (
                  <div
                    key={doc.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top status bar */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-11 h-11 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center font-bold">
                          <Stethoscope className="w-5 h-5" />
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {doc.status || 'Active'}
                        </span>
                      </div>

                      {/* Doctor Info */}
                      <h3 className="font-bold text-base text-slate-900">{doc.name}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">Physician ID: {doc.id.slice(0, 8)}...</p>

                      {/* Details list */}
                      <div className="space-y-2 mt-4 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{doc.email}</span>
                        </div>
                        {doc.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>{doc.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <Tablet className="w-4 h-4 text-sky-700 shrink-0" />
                          <span className="font-semibold text-slate-800">
                            Station: <span className="text-sky-700 font-mono">{doc.tablet_id || 'Unassigned'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Joined {new Date(doc.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <Link
                        href={`/doctors/${doc.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-800 transition-colors"
                      >
                        View Profile <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
