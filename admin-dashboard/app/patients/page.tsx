'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, UserCheck, Users, ShieldCheck, Phone, Filter } from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { adminApi, Patient, Assessment } from '../../lib/api';

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [patientList, assessmentList] = await Promise.all([
          adminApi.getPatients(),
          adminApi.getAssessments(),
        ]);
        setPatients(patientList || []);
        setAssessments(assessmentList || []);
      } catch (err) {
        console.warn('Patients load error:', err);
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
      case 'low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  // Map each patient with their latest clinical assessment record
  const enrichedPatients = useMemo(() => {
    return patients.map((p) => {
      const patientAssessments = assessments
        .filter((a) => a.patient_id === p.id)
        .sort((a, b) => new Date(b.started_at || b.created_at || '').getTime() - new Date(a.started_at || a.created_at || '').getTime());

      const latest = patientAssessments[0];
      return {
        ...p,
        latestAssessment: latest,
        tier: latest?.risk_analysis?.tier || null,
        doctorName: latest?.doctors?.name || latest?.doctor?.name || 'Clinic Attending',
        status: latest?.status || 'REGISTERED',
      };
    });
  }, [patients, assessments]);

  const filtered = enrichedPatients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.patient_code.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone && p.phone.includes(search));

    const matchesRisk = !riskFilter || p.tier?.toLowerCase() === riskFilter.toLowerCase();
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
                Patient Medical Registry
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized hospital repository of patient demographics, triage history, and clinical records.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, ID, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 shadow-sm"
                />
              </div>

              {/* Risk Filter */}
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-sky-600 shadow-sm"
              >
                <option value="">All Risk Tiers</option>
                <option value="Urgent">Urgent Risk</option>
                <option value="High">High Risk</option>
                <option value="Moderate">Moderate Risk</option>
                <option value="Low">Low Risk</option>
              </select>
            </div>
          </div>

          {/* Hospital Patient Registry Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">Patient Name</th>
                    <th className="px-6 py-3.5 font-semibold">Patient ID</th>
                    <th className="px-6 py-3.5 font-semibold">Age & Gender</th>
                    <th className="px-6 py-3.5 font-semibold">Assigned Doctor</th>
                    <th className="px-6 py-3.5 font-semibold">Assessment Status</th>
                    <th className="px-6 py-3.5 font-semibold">Risk Level</th>
                    <th className="px-6 py-3.5 font-semibold">Last Assessment</th>
                    <th className="px-6 py-3.5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                        Loading patient records...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                        No patient records match the search query.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => {
                      const tier = p.tier;
                      const hasAssessment = !!p.latestAssessment;
                      const rawDate = (hasAssessment && (p.latestAssessment?.started_at || p.latestAssessment?.created_at)) || p.created_at;
                      const lastDate = rawDate
                        ? new Date(rawDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—';

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-3.5">
                            <Link
                              href={`/patients/${p.id}`}
                              className="font-semibold text-slate-900 hover:text-sky-700 transition-colors block"
                            >
                              {p.name}
                            </Link>
                            {p.phone && (
                              <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5 text-slate-400" /> {p.phone}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 font-mono text-slate-600 font-medium">
                            {p.patient_code}
                          </td>
                          <td className="px-6 py-3.5 text-slate-700">
                            {p.age} yrs • {p.gender}
                          </td>
                          <td className="px-6 py-3.5 text-slate-700 truncate max-w-[150px]" title={p.doctorName}>
                            {p.doctorName}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  p.status === 'COMPLETED'
                                    ? 'bg-emerald-500'
                                    : p.status === 'IN_PROGRESS'
                                    ? 'bg-amber-500'
                                    : 'bg-slate-400'
                                }`}
                              />
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            {tier ? (
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getTierBadge(tier)}`}>
                                {tier.toUpperCase()}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Unassessed</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-slate-500">
                            {lastDate}
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <Link
                              href={`/patients/${p.id}`}
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
