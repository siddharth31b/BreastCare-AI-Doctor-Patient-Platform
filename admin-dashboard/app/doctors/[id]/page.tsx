'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Stethoscope,
  Tablet,
  Mail,
  Phone,
  Calendar,
  Activity,
  ArrowUpRight,
  UserCheck,
  FileCheck,
} from 'lucide-react';
import { Sidebar } from '../../../components/Sidebar';
import { Header } from '../../../components/Header';
import { adminApi, Doctor, Assessment } from '../../../lib/api';

export default function DoctorDetailPage() {
  const params = useParams();
  const doctorId = params.id as string;
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDoctorData() {
      try {
        const [docs, allAssessments] = await Promise.all([
          adminApi.getDoctors(),
          adminApi.getAssessments({ doctor_id: doctorId }),
        ]);
        const found = docs.find((d) => d.id === doctorId);
        setDoctor(found || null);
        setAssessments(allAssessments || []);
      } catch (err) {
        console.warn('Doctor detail error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDoctorData();
  }, [doctorId]);

  const getTierBadge = (tier?: string) => {
    switch (tier?.toUpperCase()) {
      case 'URGENT':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'MODERATE':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'LOW':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <Link
              href="/doctors"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Doctors Directory
            </Link>
            <span className="text-xs text-slate-400 font-mono">STAFF RECORD: #{doctorId.slice(0, 8)}</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <Activity className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium">Loading physician profile...</p>
            </div>
          ) : !doctor ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
              <p className="font-semibold text-base text-slate-800">Doctor Profile Not Found</p>
              <p className="text-xs text-slate-400 mt-1">The specified practitioner ID could not be retrieved from records.</p>
            </div>
          ) : (
            <>
              {/* Doctor Dossier Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center font-bold text-xl">
                      <Stethoscope className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-xl font-bold text-slate-900">{doctor.name}</h2>
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {doctor.status || 'Active'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {doctor.id}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-[11px] uppercase font-bold text-slate-400 block">Email Address</span>
                      <span className="font-medium text-slate-800 text-xs">{doctor.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                    <Tablet className="w-4 h-4 text-sky-700" />
                    <div>
                      <span className="text-[11px] uppercase font-bold text-slate-400 block">Assigned Tablet Station</span>
                      <span className="font-semibold text-sky-700 font-mono text-xs">{doctor.tablet_id || 'Unassigned'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-[11px] uppercase font-bold text-slate-400 block">Staff Registered</span>
                      <span className="font-medium text-slate-800 text-xs">
                        {new Date(doctor.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessments conducted by this physician */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-sky-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Assessments Administered by this Physician ({assessments.length})
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">
                    Station: {doctor.tablet_id || 'Default'}
                  </span>
                </div>

                {assessments.length === 0 ? (
                  <p className="text-slate-500 text-xs p-6 text-center">
                    No clinical screening assessments recorded under this physician's credential yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-3">Patient</th>
                          <th className="px-5 py-3">Patient ID</th>
                          <th className="px-5 py-3">Session Date</th>
                          <th className="px-5 py-3">Risk Tier</th>
                          <th className="px-5 py-3">Clinical Score</th>
                          <th className="px-5 py-3 text-right">Report</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {assessments.map((a) => {
                          const pName = a.patient?.name || a.patients?.name || 'Patient';
                          const pCode = a.patient?.patient_code || a.patients?.patient_code || '—';
                          const tier = a.risk_analysis?.tier || 'Low';
                          const score = a.risk_analysis?.totalScore !== undefined ? `${a.risk_analysis.totalScore} pts` : '—';
                          const dateStr = a.started_at
                            ? new Date(a.started_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—';

                          return (
                            <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-5 py-3.5 font-semibold text-slate-900">
                                {pName}
                              </td>
                              <td className="px-5 py-3.5 font-mono text-[11px] text-sky-700">
                                {pCode}
                              </td>
                              <td className="px-5 py-3.5 text-slate-500 text-[11px]">
                                {dateStr}
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border inline-block ${getTierBadge(tier)}`}>
                                  {tier.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 font-bold text-slate-800">
                                {score}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <Link
                                  href={`/assessments/${a.id}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-xs font-semibold transition-colors"
                                >
                                  Report <ArrowUpRight className="w-3 h-3" />
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
