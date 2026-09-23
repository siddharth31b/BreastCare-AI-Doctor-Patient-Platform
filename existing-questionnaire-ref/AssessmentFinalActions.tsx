import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ClipboardCheck, Calendar, Upload, RefreshCw, CheckCircle2, AlertCircle, Stethoscope } from "lucide-react";
import { PatientService } from "../../services/patient.service";
import type { QuestionnaireAnswer } from "../../types/questionnaire";
import { useAuth } from "../auth/AuthContext";

interface AssessmentFinalActionsProps {
  patientId: string;
  answers: QuestionnaireAnswer[];
  sessionNote?: string;
  careGuidanceLevel?: "LOW" | "MEDIUM" | "HIGH";
  isAlreadySubmitted?: boolean;
  onSubmittedSuccess?: () => void;
  onSwitchToManual?: () => void;
  assessmentMode?: "CHATBOT" | "MANUAL";
}

export const AssessmentFinalActions: React.FC<AssessmentFinalActionsProps> = ({
  patientId,
  answers,
  sessionNote = "",
  isAlreadySubmitted = false,
  onSubmittedSuccess,
  assessmentMode = "CHATBOT",
}) => {
  const router = useRouter();
  const { login } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(isAlreadySubmitted);
  const [isBooking, setIsBooking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTransitioningToDoctor, setIsTransitioningToDoctor] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // FUNCTION 1: SUBMIT ASSESSMENT
  const handleSubmitAssessment = async () => {
    if (isSubmitting || isSubmitted) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessToast(null);

    try {
      const result = await PatientService.submitQuestionnaire(patientId, answers, sessionNote, assessmentMode);
      if (result) {
        setIsSubmitted(true);
        setSuccessToast("Assessment submitted successfully.");
        if (onSubmittedSuccess) onSubmittedSuccess();
      } else {
        setErrorMessage("We couldn't submit your assessment. Please try again.");
      }
    } catch (err) {
      console.error("Failed to submit assessment:", err);
      setErrorMessage("We couldn't submit your assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // FUNCTION 2: BOOK CONSULTATION
  const handleBookConsultation = () => {
    setIsBooking(true);
    setTimeout(() => {
      router.push("/patient/connect");
    }, 100);
  };

  // FUNCTION 3: UPLOAD REPORTS
  const handleUploadReports = () => {
    setIsUploading(true);
    setTimeout(() => {
      router.push("/patient/screening/upload");
    }, 100);
  };

  // FUNCTION 4: SIMULATE LOGIN & REDIRECT TO DOCTOR DASHBOARD
  const handleGoToDoctor = async () => {
    setIsTransitioningToDoctor(true);
    try {
      await login("doctor@demo.breastcare.ai", "Demo@123");
      router.push(`/doctor/dashboard?patientId=${patientId}`);
    } catch (e) {
      console.error("Auto doctor login failed", e);
    } finally {
      setIsTransitioningToDoctor(false);
    }
  };

  return (
    <div className="assessment-final-actions w-full max-w-full flex flex-col gap-3.5 pt-2 text-left overflow-visible box-border">
      
      {/* HELPER TEXT WRAPPER (Max width 560px centered) */}
      {!isSubmitted && (
        <div className="w-full max-w-[560px] mx-auto text-center px-2 mb-1">
          <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-normal">
            Submit your assessment, consult a doctor, or add existing medical reports.
          </p>
        </div>
      )}

      {/* Success Banner / Doctor Transition Card */}
      {isSubmitted && (
        <div className="w-full max-w-full p-5 bg-[#005F56]/5 border border-[#005F56]/15 rounded-2xl flex flex-col gap-4 text-left box-border mt-2 animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">Assessment Successfully Submitted</h4>
              <p className="text-xs text-slate-500 font-medium">Your breast health assessment has been saved and shared with your assigned doctor, Dr. Sarah Iyer.</p>
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-3.5 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleGoToDoctor}
              disabled={isTransitioningToDoctor}
              className="flex-1 min-h-[48px] py-2.5 px-4 bg-primary hover:bg-[#004D46] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-75 disabled:cursor-wait"
            >
              {isTransitioningToDoctor ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing In as Dr. Sarah Iyer...</span>
                </>
              ) : (
                <>
                  <Stethoscope className="w-4 h-4" />
                  <span>Go to Doctor Dashboard (View Profile)</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/patient/dashboard")}
              className="min-h-[48px] py-2.5 px-4 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <span>Back to Patient Portal</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="w-full max-w-full p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl flex items-center justify-between gap-2 shadow-xs box-border">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={handleSubmitAssessment}
            className="text-[11px] bg-rose-600 text-white px-2.5 py-1 rounded-lg font-bold hover:bg-rose-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ROW 1: PRIMARY ACTION - SUBMIT ASSESSMENT (FULL WIDTH) */}
      <button
        type="button"
        onClick={handleSubmitAssessment}
        disabled={isSubmitting || isSubmitted}
        aria-busy={isSubmitting}
        className={`submit-action w-full min-w-0 min-h-[58px] px-5 py-3.5 rounded-2xl font-semibold text-base flex items-center justify-center gap-2.5 text-center transition-all cursor-pointer shadow-md shadow-primary/15 box-border overflow-visible ${
          isSubmitted
            ? "bg-emerald-700 text-white cursor-default opacity-95"
            : isSubmitting
            ? "bg-primary/80 text-white cursor-wait opacity-80"
            : "bg-primary hover:bg-[#004D46] text-white active:scale-[0.99]"
        }`}
      >
        <span className="shrink-0 flex items-center justify-center w-5 h-5">
          {isSubmitting ? (
            <RefreshCw className="w-5 h-5 animate-spin text-white" />
          ) : isSubmitted ? (
            <Check className="w-5 h-5 text-white" />
          ) : (
            <ClipboardCheck className="w-5 h-5 text-white" />
          )}
        </span>
        <span className="action-label block min-w-0 w-auto text-center leading-tight whitespace-normal overflow-visible text-clip font-semibold text-base">
          {isSubmitting ? "Submitting…" : isSubmitted ? "Assessment Submitted" : "Submit Assessment"}
        </span>
      </button>

      {/* ROW 2: SECONDARY ACTIONS - BOOK CONSULTATION & UPLOAD REPORTS (2 COLUMNS, STACKS BELOW 560PX) */}
      <div className="secondary-actions grid grid-cols-1 min-[560px]:grid-cols-2 gap-3.5 w-full max-w-full box-border">
        
        {/* BUTTON 2: BOOK CONSULTATION (SECONDARY AMBER) */}
        <button
          type="button"
          onClick={handleBookConsultation}
          disabled={isBooking}
          aria-busy={isBooking}
          className="w-full min-w-0 min-h-[58px] px-3.5 py-3 rounded-2xl font-semibold text-xs sm:text-sm bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-2.5 text-center transition-all cursor-pointer shadow-md shadow-amber-600/15 active:scale-[0.99] box-border overflow-visible"
        >
          <span className="shrink-0 flex items-center justify-center w-4.5 h-4.5">
            {isBooking ? (
              <RefreshCw className="w-4.5 h-4.5 animate-spin text-white" />
            ) : (
              <Calendar className="w-4.5 h-4.5 text-white" />
            )}
          </span>
          <span className="action-label block min-w-0 w-auto text-center leading-tight whitespace-normal overflow-visible text-clip font-semibold text-xs sm:text-sm">
            {isBooking ? "Opening Booking…" : "Book Consultation"}
          </span>
        </button>

        {/* BUTTON 3: UPLOAD REPORTS (TERTIARY OUTLINED WHITE) */}
        <button
          type="button"
          onClick={handleUploadReports}
          disabled={isUploading}
          aria-busy={isUploading}
          className="w-full min-w-0 min-h-[58px] px-3.5 py-3 rounded-2xl font-semibold text-xs sm:text-sm bg-white border-2 border-primary/40 text-slate-800 hover:bg-primary/5 hover:border-primary flex items-center justify-center gap-2.5 text-center transition-all cursor-pointer shadow-xs active:scale-[0.99] box-border overflow-visible"
        >
          <span className="shrink-0 flex items-center justify-center w-4.5 h-4.5">
            {isUploading ? (
              <RefreshCw className="w-4.5 h-4.5 animate-spin text-primary" />
            ) : (
              <Upload className="w-4.5 h-4.5 text-primary" />
            )}
          </span>
          <span className="action-label block min-w-0 w-auto text-center leading-tight whitespace-normal overflow-visible text-clip font-semibold text-xs sm:text-sm">
            {isUploading ? "Opening Upload…" : "Upload Reports"}
          </span>
        </button>

      </div>
    </div>
  );
};
