"use client";

import { useRouter, usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";

import { PatientService } from "../../services/patient.service";
import { useAuth } from "../auth/AuthContext";
import type { QuestionnaireAnswer } from "../../types/questionnaire";
import { BreastCareGuidedAssessment } from "./BreastCareGuidedAssessment";
import { AssessmentFinalActions } from "./AssessmentFinalActions";
import { ClipboardList, ArrowLeft, CheckCircle, AlertTriangle, MessageSquare, FileText } from "lucide-react";

export const PatientRiskAssessmentPage: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const patientId = user?.id || "demo-patient";

  const stateData = null as { answers?: QuestionnaireAnswer[]; note?: string } | null;

  const [mode, setMode] = useState<"choose" | "guided" | "manual">(() => {
    return stateData?.answers ? "manual" : "choose";
  });

  const [partialAnswers, setPartialAnswers] = useState<QuestionnaireAnswer[] | null>(null);
  const [partialNote, setPartialNote] = useState<string>("");

  // Form State
  const [painPresence, setPainPresence] = useState("no");
  const [sideSelection, setSideSelection] = useState("none");
  
  // Specific Discomfort
  const [leftArmpit, setLeftArmpit] = useState(false);
  const [leftShoulder, setLeftShoulder] = useState(false);
  const [leftLump, setLeftLump] = useState(false);
  const [rightArmpit, setRightArmpit] = useState(false);
  const [rightShoulder, setRightShoulder] = useState(false);
  const [rightLump, setRightLump] = useState(false);

  // Symptoms Checklist
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [bloodyDischarge, setBloodyDischarge] = useState("clear_milky");
  const [rapidSwelling, setRapidSwelling] = useState("no");
  const [rednessFever, setRednessFever] = useState("no");
  const [lumpPersistence, setLumpPersistence] = useState("no");
  const [painSeverity, setPainSeverity] = useState("mild_moderate");
  const [acutelyUnwell, setAcutelyUnwell] = useState("no");

  // Duration & Progression
  const [duration, setDuration] = useState("not_sure");
  const [progression, setProgression] = useState("unchanged");

  // History Checklist
  const [historyItems, setHistoryItems] = useState<string[]>([]);
  const [patientNote, setPatientNote] = useState("");

  const [successMsg, setSuccessMsg] = useState(false);

  // Sync state if coming from chatbot
  useEffect(() => {
    let active = true;
    const loadRecord = async () => {
      const record = await PatientService.getPatient(patientId);
      if (!active) return;
      let prefilledAnswers: QuestionnaireAnswer[] = [];

      if (stateData?.answers) {
        prefilledAnswers = stateData.answers;
        if (stateData.note) setPatientNote(stateData.note);
      } else if (partialAnswers) {
        prefilledAnswers = partialAnswers;
        if (partialNote) setPatientNote(partialNote);
      } else if (record && record.assessmentSession) {
        prefilledAnswers = record.assessmentSession.answers;
        setPatientNote(record.assessmentSession.summary?.patientNote || "");
      }

      if (prefilledAnswers.length > 0) {
        const getVal = (id: string) => prefilledAnswers.find(a => a.questionId === id)?.value;

        setPainPresence(getVal("pain_presence") as string || "no");
        setSideSelection(getVal("side_selection") as string || "none");

        // Set side specific branch values
        const leftBranch = getVal("branch_left") as string[] || [];
        setLeftArmpit(leftBranch.includes("armpit_left"));
        setLeftShoulder(leftBranch.includes("neck_left"));
        setLeftLump(leftBranch.includes("lump_swelling_left"));

        const rightBranch = getVal("branch_right") as string[] || [];
        setRightArmpit(rightBranch.includes("armpit_right"));
        setRightShoulder(rightBranch.includes("neck_right"));
        setRightLump(rightBranch.includes("lump_swelling_right"));

        const bothBranch = getVal("branch_both") as string[] || [];
        if (bothBranch.includes("armpit_both")) {
          setLeftArmpit(true);
          setRightArmpit(true);
        }
        if (bothBranch.includes("neck_both")) {
          setLeftShoulder(true);
          setRightShoulder(true);
        }
        if (bothBranch.includes("lump_swelling_both")) {
          setLeftLump(true);
          setRightLump(true);
        }

        setSelectedSymptoms(getVal("symptom_types") as string[] || []);
        setBloodyDischarge(getVal("discharge_type") as string || getVal("check_bloody_discharge") as string || "clear_milky");
        setRapidSwelling(getVal("swelling_progression") as string || getVal("check_rapid_swelling") as string || "no");
        setRednessFever(getVal("redness_fever") as string || getVal("check_redness_fever") as string || "no");
        setLumpPersistence(getVal("lump_persistence") as string || getVal("check_lump_persistence") as string || "no");
        setPainSeverity(getVal("pain_severity") as string || getVal("check_pain_severity") as string || "mild_moderate");
        setAcutelyUnwell(getVal("acutely_unwell") as string || getVal("check_acutely_unwell") as string || "no");

        setDuration(getVal("duration") as string || "not_sure");
        setProgression(getVal("progression") as string || "unchanged");

        setHistoryItems(getVal("history_summary") as string[] || []);
      }
    };
    loadRecord();
    return () => { active = false; };
  }, [patientId, stateData, partialAnswers, partialNote]);

  const toggleSymptom = (val: string) => {
    setSelectedSymptoms(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const toggleHistory = (val: string) => {
    setHistoryItems(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };


    // Compile into answer structure matching standard decision-tree IDs
    const getCompiledAnswers = (): QuestionnaireAnswer[] => {
      const compiled: QuestionnaireAnswer[] = [
        { questionId: "pain_presence", value: painPresence, label: painPresence === "yes" ? "Yes" : painPresence === "no" ? "No" : "Not sure", answeredAt: new Date().toISOString() },
        { questionId: "side_selection", value: sideSelection, label: sideSelection === "left" ? "Left Breast" : sideSelection === "right" ? "Right Breast" : sideSelection === "both" ? "Both Breasts" : "None", answeredAt: new Date().toISOString() }
      ];

      if (sideSelection === "left") {
        const vals: string[] = [];
        if (leftArmpit) vals.push("armpit_left");
        if (leftShoulder) vals.push("neck_left");
        if (leftLump) vals.push("lump_swelling_left");
        compiled.push({ questionId: "branch_left", value: vals, label: vals.join(", ") || "None", answeredAt: new Date().toISOString() });
      } else if (sideSelection === "right") {
        const vals: string[] = [];
        if (rightArmpit) vals.push("armpit_right");
        if (rightShoulder) vals.push("neck_right");
        if (rightLump) vals.push("lump_swelling_right");
        compiled.push({ questionId: "branch_right", value: vals, label: vals.join(", ") || "None", answeredAt: new Date().toISOString() });
      } else if (sideSelection === "both") {
        const vals: string[] = [];
        if (leftArmpit || rightArmpit) vals.push("armpit_both");
        if (leftShoulder || rightShoulder) vals.push("neck_both");
        if (leftLump || rightLump) vals.push("lump_swelling_both");
        compiled.push({ questionId: "branch_both", value: vals, label: vals.join(", ") || "None", answeredAt: new Date().toISOString() });
      }

      compiled.push({ questionId: "symptom_types", value: selectedSymptoms, label: selectedSymptoms.join(", ") || "None", answeredAt: new Date().toISOString() });

      if (selectedSymptoms.includes("discharge")) {
        compiled.push({ questionId: "discharge_type", value: bloodyDischarge, label: bloodyDischarge === "bloody" ? "Bloody" : "Clear or Milky", answeredAt: new Date().toISOString() });
      }
      if (selectedSymptoms.includes("swelling")) {
        compiled.push({ questionId: "swelling_progression", value: rapidSwelling, label: rapidSwelling === "yes" ? "Rapidly increasing" : "Stable or slow", answeredAt: new Date().toISOString() });
      }
      if (selectedSymptoms.includes("redness")) {
        compiled.push({ questionId: "redness_fever", value: rednessFever, label: rednessFever === "yes" ? "Fever reported" : "No fever", answeredAt: new Date().toISOString() });
      }
      if (selectedSymptoms.includes("lump")) {
        compiled.push({ questionId: "lump_persistence", value: lumpPersistence, label: lumpPersistence === "yes" ? "New persistent" : "Older or temporary", answeredAt: new Date().toISOString() });
      }
      if (selectedSymptoms.includes("persistent_pain")) {
        compiled.push({ questionId: "pain_severity", value: painSeverity, label: painSeverity === "severe" ? "Severe or worsening" : "Mild or fluctuating", answeredAt: new Date().toISOString() });
      }

      compiled.push({ questionId: "acutely_unwell", value: acutelyUnwell, label: acutelyUnwell === "yes" ? "Yes" : "No", answeredAt: new Date().toISOString() });
      compiled.push({ questionId: "duration", value: duration, label: duration.replace(/_/g, " "), answeredAt: new Date().toISOString() });
      compiled.push({ questionId: "progression", value: progression, label: progression.replace(/_/g, " "), answeredAt: new Date().toISOString() });
      compiled.push({ questionId: "history_summary", value: historyItems, label: historyItems.join(", ") || "None", answeredAt: new Date().toISOString() });

      return compiled;
    };

  if (mode === "choose") {
    return (
      <div className="space-y-6 text-left max-w-4xl mx-auto py-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" /> NariSetu Health Intake
            </h1>
            <p className="text-xs text-slate-400 mt-1">Please select how you would like to complete your breast-health questionnaire.</p>
          </div>
          <button
            onClick={() => router.push("/patient/dashboard")}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>

        {/* Option Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Conversational Guide Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-primary/45 transition-all shadow-xs space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Interactive Conversational Guide</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Answer one question at a time in a calm, supportive chat assistant interface. Best for mobile devices or patients who prefer a simple guided conversation.
              </p>
            </div>
            <button
              onClick={() => setMode("guided")}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors"
            >
              Start Guided Chatbot
            </button>
          </div>

          {/* Full Manual Form Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-primary/45 transition-all shadow-xs space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-primary flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Complete Manual Form</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Review and fill out the entire clinical intake form on a single screen. Ideal for desktop users, or to quickly verify and update all information.
              </p>
            </div>
            <button
              onClick={() => setMode("manual")}
              className="w-full py-3 border border-slate-250 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              Open Manual Questionnaire
            </button>
          </div>
        </div>

        {/* Disclaimer box */}
        <div className="p-4 bg-teal-50/40 border border-teal-100 rounded-xl flex gap-3 text-xs text-primary leading-normal">
          <AlertTriangle className="w-4 h-4 text-accent-teal shrink-0 mt-0.5" />
          <div className="text-slate-500 text-[11px] leading-relaxed">
            <span className="font-bold block mb-0.5 text-primary text-xs">Safe & Clinical Intake</span>
            This assessment records symptom histories to help your clinical care team review your case. This does not provide diagnoses or treatment plans. Your responses will be reviewed directly by Dr. Sarah Iyer.
          </div>
        </div>
      </div>
    );
  }

  if (mode === "guided") {
    return (
      <div className="space-y-6 text-left max-w-4xl lg:max-w-5xl mx-auto py-4 overflow-visible">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setMode("choose")}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Change Method
          </button>
          <span className="text-[10px] bg-slate-100 border border-slate-250 text-slate-500 rounded-full px-2.5 py-1 font-bold">Guided Mode</span>
        </div>
        
        <BreastCareGuidedAssessment 
          onSubmitted={() => router.push("/patient/dashboard")} 
          onSwitchToManual={(answers, note) => {
            setPartialAnswers(answers);
            setPartialNote(note);
            setMode("manual");
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" /> Full Intake Assessment
          </h1>
          <p className="text-xs text-slate-400 mt-1">Complete your clinical intake questions manually below.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setMode("guided")}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-250 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition-colors"
          >
            Switch to Chatbot
          </button>
          <button
            onClick={() => router.push("/patient/dashboard")}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4.5 bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-2xl flex gap-3 text-xs leading-normal font-semibold animate-scale-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            Assessment successfully submitted! Shared with your care team. Redirecting to your dashboard...
          </div>
        </div>
      )}

      {/* Manual intake form */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-xs space-y-8">
        
        {/* Section 1: Pain & Affected Side */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#005F56] border-b border-slate-100 pb-2">1. Pain & Side Selection</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-700">Are you currently experiencing pain or discomfort in either breast?</span>
              <div className="flex gap-4">
                {["yes", "no", "not_sure"].map(opt => (
                  <label key={opt} className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer min-h-[44px]">
                    <input
                      type="radio"
                      name="painPresence"
                      value={opt}
                      checked={painPresence === opt}
                      onChange={(e) => setPainPresence(e.target.value)}
                      className="accent-primary w-4.5 h-4.5"
                    />
                    <span className="capitalize">{opt.replace("_", " ")}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="select-side" className="block text-xs font-bold text-slate-700">Which side is affected?</label>
              <select
                id="select-side"
                value={sideSelection}
                onChange={(e) => setSideSelection(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus-ring min-h-[44px]"
              >
                <option value="none">No side affected / None</option>
                <option value="left">Left breast</option>
                <option value="right">Right breast</option>
                <option value="both">Both breasts</option>
              </select>
            </div>
          </div>

          {/* Conditional Side discomfort checkboxes */}
          {sideSelection !== "none" && (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
              <span className="block text-xs font-bold text-slate-700">Specific Discomfort Checkpoints:</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(sideSelection === "left" || sideSelection === "both") && (
                  <div className="space-y-2.5">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Left Side Options</span>
                    {[
                      { label: "Left armpit discomfort", state: leftArmpit, setter: setLeftArmpit },
                      { label: "Left neck/shoulder discomfort", state: leftShoulder, setter: setLeftShoulder },
                      { label: "Left lump or heaviness", state: leftLump, setter: setLeftLump }
                    ].map((c, i) => (
                      <label key={i} className="flex items-center gap-2.5 text-xs font-medium text-slate-600 cursor-pointer min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={c.state}
                          onChange={(e) => c.setter(e.target.checked)}
                          className="accent-primary w-4.5 h-4.5 rounded-sm"
                        />
                        <span>{c.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {(sideSelection === "right" || sideSelection === "both") && (
                  <div className="space-y-2.5">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Right Side Options</span>
                    {[
                      { label: "Right armpit discomfort", state: rightArmpit, setter: setRightArmpit },
                      { label: "Right neck/shoulder discomfort", state: rightShoulder, setter: setRightShoulder },
                      { label: "Right lump or heaviness", state: rightLump, setter: setRightLump }
                    ].map((c, i) => (
                      <label key={i} className="flex items-center gap-2.5 text-xs font-medium text-slate-600 cursor-pointer min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={c.state}
                          onChange={(e) => c.setter(e.target.checked)}
                          className="accent-primary w-4.5 h-4.5 rounded-sm"
                        />
                        <span>{c.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Symptoms Checklist */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#005F56] border-b border-slate-100 pb-2">2. Symptom Checklist</h3>
          
          <div className="space-y-2">
            <span className="block text-xs font-bold text-slate-700">Please check any symptoms or changes you have noticed:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Lump or thickening", val: "lump" },
                { label: "Swelling in breast/armpit", val: "swelling" },
                { label: "Skin dimpling or puckering", val: "dimpling" },
                { label: "Redness, warmth or color changes", val: "redness" },
                { label: "Nipple inversion", val: "inversion" },
                { label: "Nipple discharge", val: "discharge" },
                { label: "Change in breast size/shape", val: "size_change" },
                { label: "Persistent localized pain", val: "persistent_pain" }
              ].map((sym) => (
                <label key={sym.val} className="flex items-center gap-3 p-3.5 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer min-h-[44px] text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={selectedSymptoms.includes(sym.val)}
                    onChange={() => toggleSymptom(sym.val)}
                    className="accent-primary w-4.5 h-4.5 rounded-sm"
                  />
                  <span>{sym.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Conditional follow-up fields for priority validation */}
          {(selectedSymptoms.includes("discharge") || 
            selectedSymptoms.includes("swelling") || 
            selectedSymptoms.includes("redness") || 
            selectedSymptoms.includes("lump") || 
            selectedSymptoms.includes("persistent_pain")) && (
            <div className="p-4 bg-amber-50/20 border border-amber-100 rounded-2xl space-y-4">
              <span className="block text-xs font-bold text-[#005F56]">Clinical Symptom Detail Checks:</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedSymptoms.includes("discharge") && (
                  <div className="space-y-1.5">
                    <label htmlFor="discharge-type" className="block text-[11px] font-bold text-slate-600">Nipple Discharge Type</label>
                    <select
                      id="discharge-type"
                      value={bloodyDischarge}
                      onChange={(e) => setBloodyDischarge(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus-ring"
                    >
                      <option value="clear_milky">Clear, milky, or yellowish</option>
                      <option value="bloody">Bloody (pink or red fluid)</option>
                      <option value="not_sure">Not sure</option>
                    </select>
                  </div>
                )}

                {selectedSymptoms.includes("swelling") && (
                  <div className="space-y-1.5">
                    <label htmlFor="swelling-progression" className="block text-[11px] font-bold text-slate-600">Swelling Progression</label>
                    <select
                      id="swelling-progression"
                      value={rapidSwelling}
                      onChange={(e) => setRapidSwelling(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus-ring"
                    >
                      <option value="no">Stable or slow growing</option>
                      <option value="yes">Yes, swelling is rapidly expanding</option>
                      <option value="not_sure">Not sure</option>
                    </select>
                  </div>
                )}

                {selectedSymptoms.includes("redness") && (
                  <div className="space-y-1.5">
                    <label htmlFor="redness-fever" className="block text-[11px] font-bold text-slate-600">Redness & Fever</label>
                    <select
                      id="redness-fever"
                      value={rednessFever}
                      onChange={(e) => setRednessFever(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus-ring"
                    >
                      <option value="no">No fever</option>
                      <option value="yes">Yes, accompanied by fever/chills</option>
                      <option value="not_sure">Not sure</option>
                    </select>
                  </div>
                )}

                {selectedSymptoms.includes("lump") && (
                  <div className="space-y-1.5">
                    <label htmlFor="lump-persistence" className="block text-[11px] font-bold text-slate-600">Lump Characteristics</label>
                    <select
                      id="lump-persistence"
                      value={lumpPersistence}
                      onChange={(e) => setLumpPersistence(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus-ring"
                    >
                      <option value="no">Temporary or older lump</option>
                      <option value="yes">Newly noticed and persistent</option>
                      <option value="not_sure">Not sure</option>
                    </select>
                  </div>
                )}

                {selectedSymptoms.includes("persistent_pain") && (
                  <div className="space-y-1.5">
                    <label htmlFor="pain-severity" className="block text-[11px] font-bold text-slate-600">Pain Character</label>
                    <select
                      id="pain-severity"
                      value={painSeverity}
                      onChange={(e) => setPainSeverity(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus-ring"
                    >
                      <option value="mild_moderate">Mild to moderate, stable</option>
                      <option value="severe">Severe or worsening rapidly</option>
                      <option value="comes_and_goes">Fluctuating (comes and goes)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <span className="block text-xs font-bold text-slate-700">Are you feeling acutely unwell (fever, body aches, chills)?</span>
            <div className="flex gap-4">
              {["yes", "no", "not_sure"].map(opt => (
                <label key={opt} className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer min-h-[44px]">
                  <input
                    type="radio"
                    name="acutelyUnwell"
                    value={opt}
                    checked={acutelyUnwell === opt}
                    onChange={(e) => setAcutelyUnwell(e.target.value)}
                    className="accent-primary w-4.5 h-4.5"
                  />
                  <span className="capitalize">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Duration & Progression */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#005F56] border-b border-slate-100 pb-2">3. Duration & Evolution</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="select-duration" className="block text-xs font-bold text-slate-700">How long have you noticed these symptoms?</label>
              <select
                id="select-duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus-ring min-h-[44px]"
              >
                <option value="less_than_1_week">Less than 1 week</option>
                <option value="1_to_4_weeks">1–4 weeks</option>
                <option value="more_than_1_month">More than 1 month</option>
                <option value="not_sure">Not sure</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="select-progression" className="block text-xs font-bold text-slate-700">How have they changed over time?</label>
              <select
                id="select-progression"
                value={progression}
                onChange={(e) => setProgression(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus-ring min-h-[44px]"
              >
                <option value="improving">Improving</option>
                <option value="unchanged">Unchanged</option>
                <option value="worsening">Worsening</option>
                <option value="comes_and_goes">Comes and goes (fluctuating)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: History & Patient Notes */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#005F56] border-b border-slate-100 pb-2">4. Medical History & Notes</h3>
          
          <div className="space-y-2">
            <span className="block text-xs font-bold text-slate-700">Check any medical history items that apply:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { label: "Previous benign breast conditions (cysts, fibroadenoma)", val: "previous_condition" },
                { label: "Previous breast surgery or biopsy", val: "previous_surgery" },
                { label: "Family history of breast or ovarian cancer", val: "family_history" },
                { label: "Current pregnancy or breastfeeding", val: "pregnancy_lactation" },
                { label: "Prior mammogram or ultrasound screening", val: "prior_imaging" },
                { label: "Current hormone therapy or oral contraceptives", val: "hormones" },
                { label: "Recent breast injury or physical trauma", val: "recent_injury" }
              ].map(item => (
                <label key={item.val} className="flex items-start gap-3 p-3.5 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer min-h-[44px] text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={historyItems.includes(item.val)}
                    onChange={() => toggleHistory(item.val)}
                    className="accent-primary w-4.5 h-4.5 mt-0.5 rounded-sm"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="intake-note" className="block text-xs font-bold text-slate-700">Additional Details or Patient Note</label>
            <textarea
              id="intake-note"
              rows={4}
              value={patientNote}
              onChange={(e) => setPatientNote(e.target.value.slice(0, 500))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 focus-ring resize-none"
              placeholder="Provide any details on family conditions, medication schedules, or specific timing of changes..."
              maxLength={500}
            />
            <div className="text-right text-[10px] text-slate-400 font-bold">
              {patientNote.length}/500 characters
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100">
          <AssessmentFinalActions
            patientId={patientId}
            answers={getCompiledAnswers()}
            sessionNote={patientNote}
            assessmentMode="MANUAL"
            onSubmittedSuccess={() => {
              setSuccessMsg(true);
              setTimeout(() => {
                router.push("/patient/dashboard");
              }, 1500);
            }}
          />
        </div>
      </div>
    </div>
  );
};
