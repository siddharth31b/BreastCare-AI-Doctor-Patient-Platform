'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Filter, ArrowUpRight, Activity, Calendar, User, Stethoscope } from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { adminApi, Assessment } from '../../lib/api';

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const list = await adminApi.getAssessments({
          status: statusFilter || undefined,
          tier: tierFilter || undefined,
        });
        setAssessments(list || []);
      } catch (err) {
        console.warn('Assessments fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [statusFilter, tierFilter]);

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

  const getStatusBadge = (status: string, reviewedBy?: string | null) => {
    switch (status) {
      case 'DOCTOR_VALIDATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Validated {reviewedBy ? `(${reviewedBy.split(' ')[0]})` : ''}
          </span>
        );
      case 'PENDING_DOCTOR_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
            Pending Review
          </span>
        );
      case 'REASSESSMENT_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Reassessment Req
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Breadcrumb / Title Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 mb-1">
                <Activity className="w-3.5 h-3.5" />
                <span>CLINICAL SCREENINGS & DIAGNOSTIC AUDIT</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                Patient Assessments Directory
              </h2>
              <p className="text-slate-500 text-xs md:text-sm mt-0.5">
                Centralized registry of clinical triage records, algorithmic risk stratifications, and safety override statuses.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs shadow-sm">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING_DOCTOR_REVIEW">Pending Doctor Review</option>
                  <option value="DOCTOR_VALIDATED">Doctor Validated</option>
                  <option value="REASSESSMENT_REQUESTED">Reassessment Requested</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs shadow-sm">
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="">All Risk Tiers</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                Total Screenings
              </span>
              <span className="text-xl font-bold text-slate-900 mt-0.5 block">{assessments.length}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 block">
                Urgent Attention
              </span>
              <span className="text-xl font-bold text-rose-700 mt-0.5 block">
                {assessments.filter((a) => a.risk_analysis?.tier?.toUpperCase() === 'URGENT').length}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 block">
                High Priority
              </span>
              <span className="text-xl font-bold text-amber-700 mt-0.5 block">
                {assessments.filter((a) => a.risk_analysis?.tier?.toUpperCase() === 'HIGH').length}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 block">
                Routine / Low
              </span>
              <span className="text-xl font-bold text-emerald-700 mt-0.5 block">
                {assessments.filter((a) => !a.risk_analysis?.tier || a.risk_analysis?.tier?.toUpperCase() === 'LOW').length}
              </span>
            </div>
          </div>

          {/* Assessments Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Assessment ID</th>
                    <th className="px-5 py-3">Patient</th>
                    <th className="px-5 py-3">Assigned Physician</th>
                    <th className="px-5 py-3">Clinical Score</th>
                    <th className="px-5 py-3">Risk Stratification</th>
                    <th className="px-5 py-3">Screening Status</th>
                    <th className="px-5 py-3">Session Date</th>
                    <th className="px-5 py-3 text-right">Medical Record</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                        Filtering and retrieving clinical records...
                      </td>
                    </tr>
                  ) : assessments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                        No clinical assessment records found matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    assessments.map((a) => {
                      const tier = a.risk_analysis?.tier || 'Low';
                      const pName = a.patient?.name || a.patients?.name || 'Patient';
                      const pCode = a.patient?.patient_code || a.patients?.patient_code || '—';
                      const dName = a.doctor?.name || a.doctors?.name || 'Assigned Doctor';
                      const tabletId = a.doctor?.tablet_id || a.doctors?.tablet_id;
                      const sessionDate = a.started_at
                        ? new Date(a.started_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—';

                      return (
                        <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                            #{a.id.slice(0, 8)}
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-slate-900 text-xs">{pName}</p>
                            <p className="font-mono text-[11px] text-sky-700">{pCode}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-slate-800 text-xs">{dName}</p>
                            {tabletId && (
                              <p className="text-[11px] text-slate-400">Station: {tabletId}</p>
                            )}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-900 text-xs">
                            {a.risk_analysis?.totalScore !== undefined ? `${a.risk_analysis.totalScore} pts` : '—'}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border inline-block ${getTierBadge(tier)}`}>
                              {tier.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {getStatusBadge(a.status, a.reviewed_by)}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 text-[11px]">
                            {sessionDate}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Link
                              href={`/assessments/${a.id}`}
                              className="px-3 py-1 rounded-md bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                            >
                              Report <ArrowUpRight className="w-3.5 h-3.5" />
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
