'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Stethoscope,
  Activity,
  FileText,
  Clock,
  Layers,
  Search,
  CheckCircle2,
  ExternalLink,
  Filter,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { Sidebar } from '../../../components/Sidebar';
import { Header } from '../../../components/Header';
import {
  adminApi,
  Patient,
  Assessment,
  AssessmentAnswer,
} from '../../../lib/api';

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [assessmentCache, setAssessmentCache] = useState<Record<string, Assessment>>({});

  const [loading, setLoading] = useState(true);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Questionnaire view filters
  const [phaseFilter, setPhaseFilter] = useState<'ALL' | 'POSITIVE' | '0' | '1' | '2' | '3'>('ALL');
  const [searchQuestion, setSearchQuestion] = useState('');

  // Initial Load: Fetch Patient and Assessments list
  async function loadPatientData() {
    setLoading(true);
    setError(null);
    try {
      const [p, allAssessments] = await Promise.all([
        adminApi.getPatientById(patientId),
        adminApi.getAssessments(),
      ]);

      setPatient(p);
      const patientAssessments = (allAssessments || [])
        .filter((a) => a.patient_id === patientId)
        .sort((a, b) => new Date(b.created_at || b.started_at).getTime() - new Date(a.created_at || a.started_at).getTime());

      setAssessments(patientAssessments);

      // Default select the latest assessment
      if (patientAssessments.length > 0) {
        const latestId = patientAssessments[0].id;
        setSelectedAssessmentId(latestId);
        await loadAssessmentDetails(latestId);
      }
    } catch (err: any) {
      console.error('Failed to load patient medical record:', err);
      setError(err?.message || 'Failed to retrieve patient medical file. Please check connection.');
    } finally {
      setLoading(false);
    }
  }

  // Fetch full details (including all 50 answers) for the selected assessment
  async function loadAssessmentDetails(assessmentId: string) {
    if (assessmentCache[assessmentId]) {
      setActiveAssessment(assessmentCache[assessmentId]);
      return;
    }

    setLoadingAssessment(true);
    try {
      const fullData = await adminApi.getAssessmentById(assessmentId);
      setActiveAssessment(fullData);
      setAssessmentCache((prev) => ({ ...prev, [assessmentId]: fullData }));
    } catch (err) {
      console.warn('Failed to load assessment answers:', err);
    } finally {
      setLoadingAssessment(false);
    }
  }

  useEffect(() => {
    if (patientId) {
      loadPatientData();
    }
  }, [patientId]);

  const handleSelectAssessment = (id: string) => {
    setSelectedAssessmentId(id);
    loadAssessmentDetails(id);
  };

  // Restrained, clinical risk badge styles
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

  // Categorize an answer into Phase and Anatomical Region
  const categorizeAnswer = (questionText: string): { phase: number; region: string } => {
    if (questionText.startsWith('Symptoms on Left Breast')) {
      return { phase: 1, region: 'Left Breast' };
    }
    if (questionText.startsWith('Symptoms on Right Breast')) {
      return { phase: 1, region: 'Right Breast' };
    }
    if (questionText.startsWith('Symptoms on Neck')) {
      return { phase: 2, region: 'Neck / Cervical' };
    }
    if (questionText.startsWith('Symptoms on Left Arm')) {
      return { phase: 2, region: 'Left Arm / Axillary' };
    }
    if (questionText.startsWith('Symptoms on Right Arm')) {
      return { phase: 2, region: 'Right Arm / Axillary' };
    }
    if (questionText.startsWith('Respiratory Symptoms')) {
      return { phase: 3, region: 'Respiratory Domain' };
    }
    if (questionText.startsWith('CNS Symptoms')) {
      return { phase: 3, region: 'Central Nervous System' };
    }
    if (questionText.startsWith('Under Muscular Skeleton')) {
      return { phase: 3, region: 'Musculoskeletal Domain' };
    }
    return { phase: 1, region: 'Primary Breast' };
  };

  // Extract Phase 0 items from active assessment risk profile and BRM breakdown
  const phase0Items = useMemo(() => {
    if (!activeAssessment) return [];
    const profile = activeAssessment.risk_profile || {};
    const brmBreakdown = activeAssessment.risk_analysis?.brm?.breakdown || [];

    const items: Array<{
      factor: string;
      answer: string;
      points?: number;
      isPositive: boolean;
    }> = [];

    // Family History
    const fam = profile.familyHistory || 'None reported';
    const famBrm = brmBreakdown.find((b) => b.factor?.toLowerCase().includes('family'));
    items.push({
      factor: 'Family History of Breast / Ovarian Cancer',
      answer: fam,
      points: famBrm ? famBrm.points : undefined,
      isPositive: !!famBrm || fam.toLowerCase().includes('yes'),
    });

    // Patient Age factor
    const ageVal = profile.age || patient?.age || 'Not recorded';
    const ageBrm = brmBreakdown.find((b) => b.factor?.toLowerCase().includes('age'));
    items.push({
      factor: 'Patient Age at Screening',
      answer: `${ageVal} years`,
      points: ageBrm ? ageBrm.points : undefined,
      isPositive: !!ageBrm,
    });

    // Breastfeeding
    const bf = profile.breastfeeding || 'Standard / Unspecified';
    const bfBrm = brmBreakdown.find((b) => b.factor?.toLowerCase().includes('breastfeeding'));
    items.push({
      factor: 'Breastfeeding History',
      answer: bf,
      points: bfBrm ? bfBrm.points : undefined,
      isPositive: !!bfBrm,
    });

    // Contraceptives
    const hc = profile.contraceptives || 'None reported';
    const hcBrm = brmBreakdown.find((b) => b.factor?.toLowerCase().includes('contraceptive'));
    items.push({
      factor: 'Hormonal Contraceptive Exposure',
      answer: hc,
      points: hcBrm ? hcBrm.points : undefined,
      isPositive: !!hcBrm,
    });

    // Parity / Children
    const kids = profile.numberOfChildren || 'Unspecified';
    const kidsBrm = brmBreakdown.find((b) => b.factor?.toLowerCase().includes('child') || b.factor?.toLowerCase().includes('nulliparity'));
    items.push({
      factor: 'Parity / Number of Children',
      answer: kids,
      points: kidsBrm ? kidsBrm.points : undefined,
      isPositive: !!kidsBrm,
    });

    // Smoking
    if (profile.smoking) {
      const smkBrm = brmBreakdown.find((b) => b.factor?.toLowerCase().includes('smoking'));
      items.push({
        factor: 'Smoking History',
        answer: profile.smoking,
        points: smkBrm ? smkBrm.points : undefined,
        isPositive: !!smkBrm,
      });
    }

    return items;
  }, [activeAssessment, patient]);

  // Filtered Phase 1-3 answers based on active filters and search
  const filteredAnswers = useMemo(() => {
    if (!activeAssessment?.answers) return [];

    return activeAssessment.answers.filter((ans) => {
      const { phase } = categorizeAnswer(ans.question);
      const isYes = ans.answer?.toLowerCase() === 'yes';

      if (phaseFilter === 'POSITIVE' && !isYes) return false;
      if (phaseFilter === '1' && phase !== 1) return false;
      if (phaseFilter === '2' && phase !== 2) return false;
      if (phaseFilter === '3' && phase !== 3) return false;

      if (searchQuestion.trim()) {
        const q = searchQuestion.toLowerCase();
        return ans.question.toLowerCase().includes(q) || ans.answer.toLowerCase().includes(q);
      }

      return true;
    });
  }, [activeAssessment, phaseFilter, searchQuestion]);

  const positiveCount = useMemo(() => {
    if (!activeAssessment?.answers) return 0;
    return activeAssessment.answers.filter((a) => a.answer?.toLowerCase() === 'yes').length;
  }, [activeAssessment]);

  const latestDoctor = assessments[0]?.doctors?.name || assessments[0]?.doctor?.name || 'Clinic Attending Physician';
  const latestTablet = assessments[0]?.doctors?.tablet_id || assessments[0]?.doctor?.tablet_id || 'TABLET-DEFAULT';

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Breadcrumb & Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Link
              href="/patients"
              className="inline-flex items-center gap-1.5 text-xs text-sky-700 hover:text-sky-800 font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Patient Registry
            </Link>

            <button
              onClick={loadPatientData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm self-start sm:self-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
              Refresh File
            </button>
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="bg-white border border-slate-200 rounded-xl p-6 h-40 flex items-center gap-6 shadow-sm">
                <div className="w-28 h-28 rounded-lg bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-6 h-60 shadow-sm" />
            </div>
          ) : error ? (
            /* Error State */
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
              <h3 className="text-base font-bold text-rose-900">Unable to Load Patient File</h3>
              <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
              <button
                onClick={loadPatientData}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors"
              >
                Retry
              </button>
            </div>
          ) : !patient ? (
            /* Missing Patient 404 */
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3 shadow-sm">
              <User className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Patient Record Not Found</h3>
              <p className="text-xs text-slate-500">
                No patient matching ID <code className="text-slate-700 font-mono font-semibold">{patientId}</code> was found in the hospital registry.
              </p>
              <Link
                href="/patients"
                className="inline-block px-3.5 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-semibold text-xs transition-colors mt-2"
              >
                Return to Registry
              </Link>
            </div>
          ) : (
            <>
              {/* ============================================================== */}
              {/* 1. PATIENT OVERVIEW CARD (EMR Header)                           */}
              {/* ============================================================== */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  {/* Clean Clinical Photo Frame */}
                  <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {patient.face_photo_url ? (
                      <img
                        src={patient.face_photo_url}
                        alt={patient.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <User className="w-10 h-10 mx-auto mb-1 text-slate-400" />
                        <span className="text-[10px] text-slate-500 block">No Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Demographic & Clinical Status Details */}
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {patient.name}
                      </h1>
                      <span className="px-2.5 py-0.5 rounded font-mono text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {patient.patient_code}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {assessments.some((a) => a.status === 'COMPLETED') ? 'Screening Completed' : 'Active Patient'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Age & Gender</span>
                        <p className="font-semibold text-slate-800 mt-0.5">
                          {patient.age} years • {patient.gender}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Contact Phone</span>
                        <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                          {patient.phone ? (
                            <>
                              <Phone className="w-3 h-3 text-slate-400" /> {patient.phone}
                            </>
                          ) : (
                            <span className="text-slate-400 font-normal">Not recorded</span>
                          )}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">File Opened</span>
                        <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(patient.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Assigned Physician</span>
                        <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1 truncate" title={latestDoctor}>
                          <Stethoscope className="w-3 h-3 text-sky-700 shrink-0" />
                          <span className="truncate">{latestDoctor}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* 2. CHRONOLOGICAL ASSESSMENT SESSIONS SELECTOR                   */}
              {/* ============================================================== */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-700" />
                    Clinical Screening Sessions ({assessments.length})
                  </h2>
                  <span className="text-[11px] text-slate-500">
                    Select a screening file below to inspect full results and questionnaire responses.
                  </span>
                </div>

                {assessments.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No clinical assessments recorded yet for this patient.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {assessments.map((a, index) => {
                      const isSelected = a.id === selectedAssessmentId;
                      const tier = a.risk_analysis?.tier || 'Low';
                      const score = a.risk_analysis?.totalScore ?? 0;
                      const doctorName = a.doctors?.name || a.doctor?.name || 'Clinic Physician';
                      const dateStr = new Date(a.started_at || a.created_at || '').toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                      const timeStr = new Date(a.started_at || a.created_at || '').toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <button
                          key={a.id}
                          onClick={() => handleSelectAssessment(a.id)}
                          className={`text-left p-3.5 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-sky-50/70 border-sky-600 shadow-sm ring-1 ring-sky-600/30'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-xs font-mono font-semibold text-slate-800">
                              #{a.id.slice(0, 8)}
                              {index === 0 && (
                                <span className="ml-1.5 text-[10px] font-sans font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-1 py-0.2 rounded">
                                  Latest
                                </span>
                              )}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getTierBadge(tier)}`}>
                              {tier.toUpperCase()} ({score} pts)
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {dateStr} at {timeStr}
                          </p>

                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="truncate max-w-[170px]" title={doctorName}>
                              Dr. {doctorName.replace(/^Dr\.\s*/i, '')}
                            </span>
                            <span className="font-mono">{a.status}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ============================================================== */}
              {/* SELECTED ASSESSMENT DOSSIER                                     */}
              {/* ============================================================== */}
              {activeAssessment && (
                <div className="space-y-5">
                  {/* Selected Assessment Header */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                          Active Session: #{activeAssessment.id.slice(0, 8)}
                        </span>
                        <span className="text-slate-500">
                          Status: <strong className="text-slate-800 font-semibold">{activeAssessment.status}</strong>
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">
                        Clinical Triage & Risk Evaluation
                      </h3>

                      <p className="text-xs text-slate-600">
                        Conducted by <strong className="text-slate-800">{activeAssessment.doctors?.name || activeAssessment.doctor?.name || 'Assigned Physician'}</strong>
                        {' '}(Station ID: <span className="font-mono text-slate-700">{activeAssessment.doctors?.tablet_id || activeAssessment.doctor?.tablet_id || 'TABLET-DEFAULT'}</span>)
                        <br />
                        Session Started: {new Date(activeAssessment.started_at).toLocaleString()}
                        {activeAssessment.completed_at && (
                          <> • Submitted: {new Date(activeAssessment.completed_at).toLocaleString()}</>
                        )}
                      </p>
                    </div>

                    {/* Restrained Clinical Risk Box */}
                    <div className={`px-5 py-3.5 rounded-lg border text-center min-w-[190px] ${getTierBadge(activeAssessment.risk_analysis?.tier)}`}>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                        Assessed Risk Tier
                      </span>
                      <p className="text-2xl font-black tracking-tight mt-0.5">
                        {(activeAssessment.risk_analysis?.tier || 'Low').toUpperCase()}
                      </p>
                      <p className="text-xs font-semibold mt-0.5">
                        Score: {activeAssessment.risk_analysis?.totalScore ?? 0} points
                      </p>
                    </div>
                  </div>

                  {/* CLINICAL SAFETY ALERT (Restrained Medical Alert) */}
                  {activeAssessment.risk_analysis?.override?.triggered && (
                    <div className="p-4 rounded-lg bg-rose-50 border border-rose-300 flex items-start gap-3 text-rose-900 shadow-sm">
                      <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-rose-800">
                          CLINICAL SAFETY ALERT: {activeAssessment.risk_analysis.override.ruleName}
                        </h4>
                        <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                          {activeAssessment.risk_analysis.override.reason}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CLINICAL RECOMMENDATION & INTERPRETATION */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-sky-700" />
                      Physician Recommendation & Action Plan
                    </h4>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                      <p className="text-xs font-medium text-slate-800 leading-relaxed">
                        {activeAssessment.risk_analysis?.recommendation || 'Standard clinical screening protocol applied.'}
                      </p>
                    </div>
                    {activeAssessment.risk_analysis?.interpretation && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong className="text-slate-700 font-semibold">Clinical Interpretation:</strong> {activeAssessment.risk_analysis.interpretation}
                      </p>
                    )}
                  </div>

                  {/* PHYSICIAN VALIDATION & REVIEW STATUS */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-sky-700" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Attending Physician Review & Validation
                        </h4>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold border inline-block ${
                          activeAssessment.status === 'DOCTOR_VALIDATED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : activeAssessment.status === 'REASSESSMENT_REQUESTED'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}
                      >
                        {activeAssessment.status === 'DOCTOR_VALIDATED'
                          ? 'DOCTOR VALIDATED'
                          : activeAssessment.status === 'REASSESSMENT_REQUESTED'
                          ? 'REASSESSMENT REQUESTED'
                          : 'PENDING DOCTOR REVIEW'}
                      </span>
                    </div>

                    {activeAssessment.status === 'DOCTOR_VALIDATED' && (
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Reviewing Physician</span>
                            <span className="font-semibold text-emerald-900 text-sm">
                              {activeAssessment.reviewed_by || activeAssessment.doctors?.name || activeAssessment.doctor?.name || 'Attending Physician'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Validation Timestamp</span>
                            <span className="font-medium text-slate-800">
                              {activeAssessment.reviewed_at ? new Date(activeAssessment.reviewed_at).toLocaleString() : '—'}
                            </span>
                          </div>
                        </div>
                        {activeAssessment.doctor_note && (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Doctor Clinical Note</span>
                            <p className="text-xs text-slate-800 italic leading-relaxed">"{activeAssessment.doctor_note}"</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeAssessment.status === 'REASSESSMENT_REQUESTED' && (
                      <div className="space-y-2 text-xs">
                        <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                          <span className="text-[10px] font-bold text-amber-900 uppercase block mb-1">Clinical Reason for Reassessment</span>
                          <p className="text-xs font-semibold text-amber-950 leading-relaxed">{activeAssessment.reassessment_reason}</p>
                          <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-800">
                            <span>Requested by: <strong>{activeAssessment.reviewed_by || 'Attending Physician'}</strong></span>
                            <span>{activeAssessment.reviewed_at ? new Date(activeAssessment.reviewed_at).toLocaleString() : ''}</span>
                          </div>
                        </div>
                        {activeAssessment.doctor_note && (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Doctor Note</span>
                            <p className="text-xs text-slate-800 italic leading-relaxed">"{activeAssessment.doctor_note}"</p>
                          </div>
                        )}
                      </div>
                    )}

                    {(activeAssessment.status === 'PENDING_DOCTOR_REVIEW' || activeAssessment.status === 'COMPLETED' || activeAssessment.status === 'IN_PROGRESS') && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                        <span>
                          Awaiting formal clinical validation by assigned physician: <strong className="text-slate-800">{activeAssessment.doctors?.name || activeAssessment.doctor?.name || 'Attending Physician'}</strong>.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* PHASE-WISE SCORE BREAKDOWN */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 text-center shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Phase 0 (BRM)
                      </span>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">
                        +{activeAssessment.risk_analysis?.brm?.score ?? 0} pts
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Baseline reproductive risk</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 text-center shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Phase 1 (Primary)
                      </span>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">
                        {activeAssessment.risk_analysis?.symptomScoring?.phase1Weighted ?? 0} pts
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {activeAssessment.risk_analysis?.symptomScoring?.positiveCountPhase1 ?? 0} positive findings
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 text-center shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Phase 2 (Regional)
                      </span>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">
                        {activeAssessment.risk_analysis?.symptomScoring?.phase2Weighted ?? 0} pts
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {activeAssessment.risk_analysis?.symptomScoring?.positiveCountPhase2 ?? 0} positive findings
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 text-center shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Phase 3 (Systemic)
                      </span>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">
                        {activeAssessment.risk_analysis?.symptomScoring?.phase3Weighted ?? 0} pts
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {activeAssessment.risk_analysis?.symptomScoring?.positiveCountPhase3 ?? 0} positive findings
                      </p>
                    </div>
                  </div>

                  {/* ============================================================== */}
                  {/* 3. COMPLETE QUESTIONNAIRE DATA TRANSCRIPT                      */}
                  {/* ============================================================== */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Header with Search and Phase Filters */}
                    <div className="p-4 border-b border-slate-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-sky-700" />
                            Questionnaire Responses Transcript
                          </h3>
                          <p className="text-xs text-slate-500">
                            Recorded responses across Phase 0 (Baseline) through Phase 3 (Systemic).
                          </p>
                        </div>

                        <div className="relative w-full sm:w-60">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Filter questions..."
                            value={searchQuestion}
                            onChange={(e) => setSearchQuestion(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600"
                          />
                        </div>
                      </div>

                      {/* Filter Tabs */}
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <button
                          onClick={() => setPhaseFilter('ALL')}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                            phaseFilter === 'ALL'
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          All ({activeAssessment.answers?.length || 0})
                        </button>

                        <button
                          onClick={() => setPhaseFilter('POSITIVE')}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                            phaseFilter === 'POSITIVE'
                              ? 'bg-rose-600 text-white'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          Positive Findings (Yes) ({positiveCount})
                        </button>

                        <button
                          onClick={() => setPhaseFilter('0')}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                            phaseFilter === '0'
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Phase 0: Baseline ({phase0Items.length})
                        </button>

                        <button
                          onClick={() => setPhaseFilter('1')}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                            phaseFilter === '1'
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Phase 1: Primary
                        </button>

                        <button
                          onClick={() => setPhaseFilter('2')}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                            phaseFilter === '2'
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Phase 2: Regional
                        </button>

                        <button
                          onClick={() => setPhaseFilter('3')}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                            phaseFilter === '3'
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Phase 3: Systemic
                        </button>
                      </div>
                    </div>

                    {/* Phase 0 Section */}
                    {(phaseFilter === 'ALL' || phaseFilter === '0' || (phaseFilter === 'POSITIVE' && phase0Items.some(i => i.isPositive))) && (
                      <div className="border-b border-slate-200">
                        <div className="bg-slate-50/80 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
                          <span className="font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-sky-700" />
                            Phase 0 — Baseline Reproductive Risk Profile (BRM)
                          </span>
                          <span className="font-mono text-slate-500">
                            Contribution: +{activeAssessment.risk_analysis?.brm?.score ?? 0} pts
                          </span>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {phase0Items
                            .filter(item => {
                              if (phaseFilter === 'POSITIVE') return item.isPositive;
                              if (searchQuestion.trim()) {
                                return item.factor.toLowerCase().includes(searchQuestion.toLowerCase()) || item.answer.toLowerCase().includes(searchQuestion.toLowerCase());
                              }
                              return true;
                            })
                            .map((item, idx) => (
                              <div key={idx} className="px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/60 text-xs">
                                <div>
                                  <p className="font-semibold text-slate-800">{item.factor}</p>
                                  <p className="text-slate-500 mt-0.5">Response: <span className="text-slate-900 font-medium">{item.answer}</span></p>
                                </div>
                                <div className="self-start sm:self-center">
                                  {item.points ? (
                                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                      +{item.points} pts (Weighted Risk)
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[11px] text-slate-500 bg-slate-100 border border-slate-200">
                                      Baseline (0 pts)
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Phase 1-3 Table */}
                    {loadingAssessment ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        Loading symptom responses...
                      </div>
                    ) : filteredAnswers.length === 0 && phaseFilter !== '0' ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        No symptom questions match the active filter.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="px-6 py-3 font-semibold">Clinical Symptom Question</th>
                              <th className="px-6 py-3 font-semibold">Phase / Domain</th>
                              <th className="px-6 py-3 font-semibold">Response</th>
                              <th className="px-6 py-3 font-semibold text-right">Recorded Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredAnswers.map((ans) => {
                              const { phase, region } = categorizeAnswer(ans.question);
                              const isYes = ans.answer?.toLowerCase() === 'yes';

                              return (
                                <tr key={ans.id} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="px-6 py-3 font-medium text-slate-800">
                                    {ans.question}
                                  </td>
                                  <td className="px-6 py-3 text-slate-600">
                                    <span className="font-semibold text-slate-700">Phase {phase}</span>
                                    <span className="text-slate-400 block text-[11px]">{region}</span>
                                  </td>
                                  <td className="px-6 py-3">
                                    <span
                                      className={`px-2.5 py-0.5 rounded text-[11px] font-semibold inline-block border ${
                                        isYes
                                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                                          : 'bg-slate-100 text-slate-600 border-slate-200'
                                      }`}
                                    >
                                      {ans.answer}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3 text-right text-slate-400 font-mono text-[11px]">
                                    {ans.answered_at ? new Date(ans.answered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Dedicated Report Link Footer */}
                    <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                      <span>Inspection of file ID: <code className="font-mono text-slate-700">{activeAssessment.id}</code></span>
                      <Link
                        href={`/assessments/${activeAssessment.id}`}
                        className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-800 font-semibold transition-colors"
                      >
                        Open Full Dedicated Report <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
