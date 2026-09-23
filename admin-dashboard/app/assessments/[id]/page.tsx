'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Calendar,
  Stethoscope,
  Activity,
  Layers,
  Phone,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import { Sidebar } from '../../../components/Sidebar';
import { Header } from '../../../components/Header';
import { adminApi, Assessment } from '../../../lib/api';

export default function AssessmentDetailPage() {
  const params = useParams();
  const assessmentId = params.id as string;
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssessment() {
      try {
        const data = await adminApi.getAssessmentById(assessmentId);
        setAssessment(data);
      } catch (err) {
        console.warn('Assessment detail load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAssessment();
  }, [assessmentId]);

  const getTierBadge = (tier?: string) => {
    switch (tier?.toUpperCase()) {
      case 'URGENT':
        return {
          container: 'bg-rose-50 border-rose-200 text-rose-700',
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          accent: 'text-rose-700',
        };
      case 'HIGH':
        return {
          container: 'bg-amber-50 border-amber-200 text-amber-800',
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          accent: 'text-amber-700',
        };
      case 'MODERATE':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          badge: 'bg-yellow-100 text-yellow-900 border-yellow-300',
          accent: 'text-yellow-700',
        };
      case 'LOW':
      default:
        return {
          container: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          accent: 'text-emerald-700',
        };
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-12 text-center text-slate-500">
            <Activity className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-3" />
            <p className="font-medium text-sm">Loading clinical assessment dossier #{assessmentId}...</p>
          </main>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-12 text-center text-slate-500">
            <p className="font-semibold text-base text-slate-800 mb-2">Clinical Assessment Not Found</p>
            <p className="text-xs text-slate-500 mb-4">The requested assessment session #{assessmentId} could not be located in records.</p>
            <Link
              href="/assessments"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Assessments
            </Link>
          </main>
        </div>
      </div>
    );
  }

  const result = assessment.risk_analysis || {};
  const patient = assessment.patient || assessment.patients;
  const doctor = assessment.doctor || assessment.doctors;
  const tier = result.tier || 'Low';
  const tierStyle = getTierBadge(tier);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Bar with Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <Link
                href="/assessments"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Assessments
              </Link>
              {(assessment.patient_id || assessment.patient?.id) && (
                <Link
                  href={`/patients/${assessment.patient_id || assessment.patient?.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800 px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-lg shadow-sm transition-colors"
                >
                  <User className="w-3.5 h-3.5" /> View Patient Dossier <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            <div className="text-right text-xs text-slate-500 font-mono">
              SESSION ID: <span className="font-bold text-slate-700">{assessment.id}</span>
            </div>
          </div>

          {/* Clinical Header Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {patient?.face_photo_url ? (
                    <img
                      src={patient.face_photo_url}
                      alt={patient.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-xl font-bold text-slate-900">{patient?.name || 'Patient'}</h2>
                    <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                      {patient?.patient_code || 'ID UNASSIGNED'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {patient?.age ? `${patient.age} yrs` : 'Age: N/A'} • {patient?.gender || 'Female'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                    <span className="flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                      Assigned Doctor: <strong className="text-slate-700 ml-1">{doctor?.name || 'Assigned Staff'}</strong>
                    </span>
                    {doctor?.tablet_id && (
                      <span className="text-slate-400 font-mono text-[11px]">Station: {doctor.tablet_id}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Session: {new Date(assessment.started_at || assessment.created_at || '').toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Restrained Clinical Risk Box */}
              <div className={`px-6 py-4 rounded-xl border ${tierStyle.container} text-center min-w-[200px]`}>
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 block">
                  Stratified Risk Tier
                </span>
                <span className={`text-2xl font-black mt-0.5 block ${tierStyle.accent}`}>
                  {tier.toUpperCase()}
                </span>
                <span className="text-xs font-semibold text-slate-700 mt-1 block">
                  Aggregate Score: {result.totalScore ?? 0} pts
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Safety Alert Banner */}
          {result.override?.triggered && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 flex items-start gap-3.5 text-rose-900 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase font-black tracking-widest text-rose-700 bg-rose-200/60 px-2 py-0.5 rounded">
                    CLINICAL SAFETY ALERT
                  </span>
                  <h4 className="font-bold text-sm text-rose-900">
                    {result.override.ruleName}
                  </h4>
                </div>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  {result.override.reason}
                </p>
              </div>
            </div>
          )}

          {/* Physician Clinical Validation Status Card (Audit & Compliance) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-700" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Physician Review & Clinical Sign-off
                </h3>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold border inline-block ${
                  assessment.status === 'DOCTOR_VALIDATED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : assessment.status === 'REASSESSMENT_REQUESTED'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-sky-50 text-sky-700 border-sky-200'
                }`}
              >
                {assessment.status === 'DOCTOR_VALIDATED'
                  ? 'DOCTOR VALIDATED'
                  : assessment.status === 'REASSESSMENT_REQUESTED'
                  ? 'REASSESSMENT REQUESTED'
                  : 'PENDING DOCTOR REVIEW'}
              </span>
            </div>

            {assessment.status === 'DOCTOR_VALIDATED' && (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">Reviewing Physician</span>
                    <span className="font-semibold text-emerald-900 text-sm">{assessment.reviewed_by || doctor?.name || 'Attending Physician'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">Validation Timestamp</span>
                    <span className="font-medium text-slate-800">
                      {assessment.reviewed_at ? new Date(assessment.reviewed_at).toLocaleString() : '—'}
                    </span>
                  </div>
                </div>
                {assessment.doctor_note && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Attending Physician Note</span>
                    <p className="text-xs text-slate-800 italic leading-relaxed">"{assessment.doctor_note}"</p>
                  </div>
                )}
              </div>
            )}

            {assessment.status === 'REASSESSMENT_REQUESTED' && (
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                  <span className="text-[11px] font-bold text-amber-900 uppercase block mb-1">Clinical Reason for Reassessment</span>
                  <p className="text-xs font-semibold text-amber-950 leading-relaxed">{assessment.reassessment_reason}</p>
                  <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-800">
                    <span>Requested by: <strong>{assessment.reviewed_by || doctor?.name || 'Physician'}</strong></span>
                    <span>{assessment.reviewed_at ? new Date(assessment.reviewed_at).toLocaleString() : ''}</span>
                  </div>
                </div>
                {assessment.doctor_note && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Doctor Note</span>
                    <p className="text-xs text-slate-800 italic leading-relaxed">"{assessment.doctor_note}"</p>
                  </div>
                )}
              </div>
            )}

            {(assessment.status === 'PENDING_DOCTOR_REVIEW' || assessment.status === 'COMPLETED' || assessment.status === 'IN_PROGRESS') && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                <span>
                  Clinical assessment is currently awaiting formal validation and sign-off by assigned physician: <strong className="text-slate-800">{doctor?.name || 'Attending Physician'}</strong>.
                </span>
              </div>
            )}
          </div>

          {/* Oncologist Recommendation & Interpretation Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-sky-700" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Clinical Recommendation & On-Site Action Directive
              </h3>
            </div>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              {result.recommendation || 'Clinical screening completed without urgent intervention directives.'}
            </p>
            {result.interpretation && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-700 block mb-0.5">Clinical Interpretation Summary:</span>
                {result.interpretation}
              </div>
            )}
          </div>

          {/* Diagnostic Sub-Scores Breakdown */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-sky-700" />
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Multi-Phase Clinical Score Breakdown
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Phase 0 (BRM)</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">
                  +{result.brm?.score ?? 0} <span className="text-xs font-normal text-slate-500">pts</span>
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">Baseline Reproductive Risk</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Phase 1 (Primary)</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">
                  {result.symptomScoring?.phase1Weighted ?? 0} <span className="text-xs font-normal text-slate-500">pts</span>
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {result.symptomScoring?.positiveCountPhase1 ?? 0} positive primary findings
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Phase 2 (Regional)</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">
                  {result.symptomScoring?.phase2Weighted ?? 0} <span className="text-xs font-normal text-slate-500">pts</span>
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {result.symptomScoring?.positiveCountPhase2 ?? 0} positive regional findings
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Phase 3 (Systemic)</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">
                  {result.symptomScoring?.phase3Weighted ?? 0} <span className="text-xs font-normal text-slate-500">pts</span>
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {result.symptomScoring?.positiveCountPhase3 ?? 0} positive systemic findings
                </span>
              </div>
            </div>
          </div>

          {/* Questionnaire Transcript Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recorded Questionnaire Transcript</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete sequence of answered clinical symptom checks with recorded timestamps.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200">
                {assessment.answers?.length || 0} Questions Answered
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 w-12 text-center">#</th>
                    <th className="px-5 py-3">Clinical Screening Question</th>
                    <th className="px-5 py-3 w-32">Response</th>
                    <th className="px-5 py-3 w-32 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {(!assessment.answers || assessment.answers.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                        No recorded questionnaire responses stored for this session.
                      </td>
                    </tr>
                  ) : (
                    assessment.answers.map((ans, idx) => {
                      const isYes = ans.answer?.trim().toLowerCase() === 'yes';
                      return (
                        <tr key={ans.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3 text-center font-mono text-slate-400 text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-800">
                            {ans.question}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`px-2.5 py-0.5 rounded text-[11px] font-bold border inline-block ${
                                isYes
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {ans.answer}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-slate-400 font-mono text-[11px]">
                            {ans.answered_at
                              ? new Date(ans.answered_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })
                              : '—'}
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
