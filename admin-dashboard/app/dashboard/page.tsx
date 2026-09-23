'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Stethoscope,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { adminApi, Analytics, Assessment } from '../../lib/api';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [stats, list] = await Promise.all([
          adminApi.getAnalytics(),
          adminApi.getAssessments(),
        ]);
        setAnalytics(stats);
        setAssessments(list.slice(0, 10)); // Top 10 recent
      } catch (err) {
        console.warn('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getTierBadge = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case 'urgent':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'high':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'moderate':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const urgentAndHighCount =
    (analytics?.tierBreakdown.Urgent ?? 0) + (analytics?.tierBreakdown.High ?? 0);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-5">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
                Clinical Overview
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Hospital breast cancer screening, patient triage, and tablet station administration.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-xs text-slate-500 font-medium">Station Units:</span>
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700">
                {analytics?.totalDoctors ?? 0} Authorized Tablets
              </span>
            </div>
          </div>

          {/* 4 Primary Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Patients */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Patients
                </span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {analytics?.totalPatients ?? 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Registered in clinical database</p>
            </div>

            {/* Active Assessments */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Active Assessments
                </span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {analytics?.pendingAssessments ?? 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Screening sessions in progress</p>
            </div>

            {/* Completed Assessments */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Completed Assessments
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {analytics?.completedAssessments ?? 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Evaluated & triaged</p>
            </div>

            {/* Patients Requiring Review */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                  Requiring Priority Review
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-3xl font-extrabold text-rose-700 tracking-tight">
                {urgentAndHighCount}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">High & Urgent risk tier cases</p>
            </div>
          </div>

          {/* Risk Tier Stratification Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-600" />
                Clinical Risk Tier Stratification
              </h2>
              <span className="text-[11px] text-slate-400">Validated algorithmic classification</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase">Low Risk</span>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {analytics?.tierBreakdown.Low ?? 0}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Routine preventive care</p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-yellow-800 uppercase">Moderate Risk</span>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {analytics?.tierBreakdown.Moderate ?? 0}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">2–4 week observation</p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-amber-800 uppercase">High Risk</span>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {analytics?.tierBreakdown.High ?? 0}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Diagnostic imaging</p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-rose-700 uppercase">Urgent Risk</span>
                <p className="text-2xl font-bold text-rose-700 mt-0.5">
                  {analytics?.tierBreakdown.Urgent ?? 0}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">24–48h oncology referral</p>
              </div>
            </div>
          </div>

          {/* Recent Patient Screenings Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Patient Assessments</h3>
                <p className="text-xs text-slate-500 mt-0.5">Screenings submitted by clinical staff</p>
              </div>
              <Link
                href="/assessments"
                className="text-xs font-semibold text-sky-700 hover:text-sky-800 flex items-center gap-1 transition-colors"
              >
                All Assessments <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Patient</th>
                    <th className="px-6 py-3 font-semibold">Medical ID</th>
                    <th className="px-6 py-3 font-semibold">Age & Gender</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Risk Level</th>
                    <th className="px-6 py-3 font-semibold">Assigned Doctor</th>
                    <th className="px-6 py-3 font-semibold">Last Updated</th>
                    <th className="px-6 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                        Loading clinical records...
                      </td>
                    </tr>
                  ) : assessments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                        No patient assessments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    assessments.map((a) => {
                      const tier = a.risk_analysis?.tier || 'Low';
                      const patientName = a.patient?.name || a.patients?.name || 'Patient';
                      const patientCode = a.patient?.patient_code || a.patients?.patient_code || '—';
                      const patientAge = a.patient?.age || a.patients?.age;
                      const patientGender = a.patient?.gender || a.patients?.gender || 'Female';
                      const doctorName = a.doctor?.name || a.doctors?.name || 'Clinic Physician';

                      return (
                        <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-3.5">
                            <Link
                              href={`/patients/${a.patient_id}`}
                              className="font-semibold text-slate-900 hover:text-sky-700 transition-colors"
                            >
                              {patientName}
                            </Link>
                          </td>
                          <td className="px-6 py-3.5 font-mono text-slate-600 font-medium">
                            {patientCode}
                          </td>
                          <td className="px-6 py-3.5 text-slate-600">
                            {patientAge ? `${patientAge} yrs` : '—'} • {patientGender}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  a.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                              />
                              {a.status}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getTierBadge(
                                tier
                              )}`}
                            >
                              {tier.toUpperCase()} ({a.risk_analysis?.totalScore ?? 0} pts)
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-slate-700 truncate max-w-[160px]" title={doctorName}>
                            {doctorName}
                          </td>
                          <td className="px-6 py-3.5 text-slate-500">
                            {new Date(a.started_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <Link
                              href={`/patients/${a.patient_id}`}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                            >
                              View Record
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
