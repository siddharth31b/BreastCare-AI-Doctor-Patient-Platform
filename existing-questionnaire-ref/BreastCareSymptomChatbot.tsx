import React, { useState, useEffect, useRef } from "react";
import { 
  Brain, 
  X, 
  Send, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Download, 
  ChevronRight, 
  RotateCcw,
  User,
  Heart,
  CheckCircle2,
  Stethoscope,
  Sparkles
} from "lucide-react";
import { getQuestions, type Category, type RiskProfileData } from "../../services/symptom.service";
import { saveSymptomResponse, loadSymptomResponses, exportSymptomResponsesCsv } from "../../services/symptom.storage.service";
import { 
  calculateClinicalRiskAnalysis, 
  type ClinicalRiskAnalysisResult, 
  type RiskTier 
} from "./assessmentEngine";
import { PatientService } from "../../services/patient.service";
import { useAuth } from "../auth/AuthContext";
import type { QuestionnaireAnswer } from "../../types/questionnaire";

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  type?: "text" | "checklist" | "risk_profile_step" | "interpretation" | "risk_report";
  phase?: number;
  category?: Category;
  submitted?: boolean;
  interpretation?: string;
  recommendation?: string;
  riskResult?: ClinicalRiskAnalysisResult;
}

export interface BreastCareSymptomChatbotProps {
  onClose?: () => void;
  onSubmitted?: () => void;
  onSwitchToManual?: (answers: QuestionnaireAnswer[], note: string) => void;
  isModal?: boolean;
  hideHeader?: boolean;
}

type ChatPhase = 
  | "p0_age" 
  | "p0_marriage" 
  | "p0_first_child" 
  | "p0_children_count" 
  | "p0_breastfeeding" 
  | "p0_contraceptives" 
  | "p0_family_history" 
  | "p0_smoking" 
  | "p0_diet" 
  | "p1_side" 
  | "p1_breast" 
  | "p2_neck" 
  | "p2_arm" 
  | "p3_check" 
  | "p3_systemic" 
  | "p4_report" 
  | "done";

export const BreastCareSymptomChatbot: React.FC<BreastCareSymptomChatbotProps> = ({
  onClose,
  onSubmitted,
  onSwitchToManual,
  isModal = false,
  hideHeader = false
}) => {
  const { user } = useAuth();
  const patientId = user?.id || "demo-patient";

  const allCategories = getQuestions();

  const [phase, setPhase] = useState<ChatPhase>("p0_age");
  const [selectedSide, setSelectedSide] = useState<"left" | "right" | "both" | "none">("both");
  const [riskProfile, setRiskProfile] = useState<RiskProfileData>({
    age: "",
    ageAtMarriage: "",
    ageAtFirstChild: "",
    numberOfChildren: "",
    breastfeeding: "",
    contraceptives: "",
    familyHistory: "",
    smoking: "",
    diet: ""
  });

  const [collectedResponses, setCollectedResponses] = useState<Record<string, "Yes" | "No">>({});
  const [tempSelections, setTempSelections] = useState<Record<string, boolean>>({});
  const [activeChecklistCategory, setActiveChecklistCategory] = useState<Category | null>(null);
  const [activeChecklistPhaseNumber, setActiveChecklistPhaseNumber] = useState<number>(1);
  const [riskAnalysisResult, setRiskAnalysisResult] = useState<ClinicalRiskAnalysisResult | null>(null);

  const [suggestions, setSuggestions] = useState<string[]>([
    "< 30 years",
    "30–40 years",
    "41–50 years",
    "> 50 years"
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome-1",
      sender: "bot",
      text: `Hello ${user?.name ? user.name.split(" ")[0] : "there"}! I am your NariSetu Clinical AI Assistant.`,
      type: "text"
    },
    {
      id: "msg-welcome-2",
      sender: "bot",
      text: "We follow an adaptive, oncology clinical triage flow with 4 phases:\n• **Phase 0:** Risk Profile Intake\n• **Phase 1:** Primary Breast Screening (Diagnostic weight)\n• **Phase 2:** Regional Spread Screening (Neck & Armpit)\n• **Phase 3:** Systemic Screening (Respiratory, CNS, Musculoskeletal)\n• **Phase 4:** Comprehensive Risk Analysis & Clinical Staging",
      type: "text"
    },
    {
      id: "msg-p0-start",
      sender: "bot",
      text: "**Phase 0: Risk Profile Intake**\nWhat is your current age group?",
      type: "text",
      phase: 0
    }
  ]);

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, phase]);

  const addBotMessage = (text: string, type: ChatMessage["type"] = "text", extra: Partial<ChatMessage> = {}) => {
    setMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sender: "bot",
        text,
        type,
        ...extra
      }
    ]);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sender: "user",
        text
      }
    ]);
  };

  const startChecklist = (catName: string, phaseNum: number, nextPhase: ChatPhase) => {
    const category = allCategories.find(c => c.category.toLowerCase().includes(catName.toLowerCase()));
    if (!category) return;

    setActiveChecklistCategory(category);
    setActiveChecklistPhaseNumber(phaseNum);

    const initialSelections: Record<string, boolean> = {};
    category.options.forEach(o => {
      initialSelections[o.converted_name] = false;
    });
    setTempSelections(initialSelections);

    addBotMessage(
      `Please select all symptoms that apply to you for **${category.category}**:`,
      "checklist",
      {
        phase: phaseNum,
        category,
        submitted: false
      }
    );
    setSuggestions(["Submit Selection", "None of these apply"]);
  };

  const submitCurrentChecklist = (isNone = false) => {
    if (!activeChecklistCategory) return;

    setMessages(prev =>
      prev.map(m => (m.type === "checklist" && !m.submitted ? { ...m, submitted: true } : m))
    );

    const selectedLabels: string[] = [];
    const updatedResponses = { ...collectedResponses };

    activeChecklistCategory.options.forEach(o => {
      const isChecked = !isNone && !!tempSelections[o.converted_name];
      updatedResponses[o.converted_name] = isChecked ? "Yes" : "No";
      if (isChecked) {
        selectedLabels.push(o.label);
      }
    });

    setCollectedResponses(updatedResponses);

    const selectionSummary = selectedLabels.length > 0
      ? `Selected: ${selectedLabels.join(", ")}`
      : "None of these symptoms apply to me.";
    addUserMessage(selectionSummary);

    // Progression logic based on current phase
    if (phase === "p1_breast") {
      if (selectedSide === "both" && activeChecklistCategory.category.includes("Left")) {
        // Now do Right Breast
        addBotMessage("Now checking **Symptoms on Right Breast**:", "text", { phase: 1 });
        startChecklist("Symptoms on Right Breast", 1, "p1_breast");
      } else {
        // Move to Phase 2: Regional Spread
        setPhase("p2_neck");
        addBotMessage(
          "**Phase 2: Regional Spread Screening**\nWe will now screen regional lymph node territories (Neck and Armpit).",
          "text",
          { phase: 2 }
        );
        startChecklist("Symptoms on Neck", 2, "p2_neck");
      }
    } else if (phase === "p2_neck") {
      setPhase("p2_arm");
      const armCat = selectedSide === "right" 
        ? "Symptoms on Right Arm" 
        : selectedSide === "left" 
        ? "Symptoms on Left Arm" 
        : "Symptoms on Left Arm";
      
      addBotMessage("Screening axillary & arm region:", "text", { phase: 2 });
      startChecklist(armCat, 2, "p2_arm");
    } else if (phase === "p2_arm") {
      if (selectedSide === "both" && activeChecklistCategory.category.includes("Left")) {
        // Do Right Arm as well
        startChecklist("Symptoms on Right Arm", 2, "p2_arm");
      } else {
        // Evaluate if Phase 1 or 2 had any positive findings
        const hasPositivesInP1orP2 = Object.entries(updatedResponses).some(([k, v]) => {
          return v === "Yes" && (k.includes("Breast") || k.includes("Neck") || k.includes("Arm"));
        });

        if (hasPositivesInP1orP2) {
          // Adaptive: full systemic screening
          setPhase("p3_systemic");
          addBotMessage(
            "**Phase 3: Systemic & Distant Screening**\nBecause regional or breast symptoms were noted, we will now check systemic areas (Respiratory, CNS, Musculoskeletal).",
            "text",
            { phase: 3 }
          );
          startChecklist("Respiratory Symptoms", 3, "p3_systemic");
        } else {
          // Adaptive: brief question
          setPhase("p3_check");
          addBotMessage(
            "**Phase 3: Systemic Check**\nHave you experienced any unexplained cough, breathlessness, bone/back pain, or persistent headaches recently?",
            "text",
            { phase: 3 }
          );
          setSuggestions(["No, none of these", "Yes, I have some systemic symptoms"]);
        }
      }
    } else if (phase === "p3_systemic") {
      if (activeChecklistCategory.category.includes("Respiratory")) {
        addBotMessage("Checking Central Nervous System (CNS) indicators:", "text", { phase: 3 });
        startChecklist("CNS Symptoms", 3, "p3_systemic");
      } else if (activeChecklistCategory.category.includes("CNS")) {
        addBotMessage("Checking Musculoskeletal indicators:", "text", { phase: 3 });
        startChecklist("Under Muscular Skeleton", 3, "p3_systemic");
      } else {
        // Finished Phase 3 -> Proceed to Phase 4 Risk Report
        generateRiskReport(updatedResponses);
      }
    }
  };

  const generateRiskReport = async (finalResponses: Record<string, "Yes" | "No">) => {
    // Fill remaining unanswered categories with "No"
    allCategories.forEach(c => {
      c.options.forEach(o => {
        if (finalResponses[o.converted_name] !== "Yes") {
          finalResponses[o.converted_name] = "No";
        }
      });
    });

    const result = calculateClinicalRiskAnalysis(riskProfile, finalResponses);
    setRiskAnalysisResult(result);
    setPhase("p4_report");

    // Save to storage
    const responsePayload = {
      id: `resp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      answers: finalResponses,
      riskProfile,
      brmScore: result.brm.score,
      symptomScore: result.symptomScoring.totalSymptomScore,
      totalScore: result.totalScore,
      riskTier: result.tier,
      overrideTriggered: result.override.triggered ? result.override.ruleName : null
    };
    saveSymptomResponse(responsePayload);

    // Save to PatientService for Doctor Portal sync
    const symptomAnswers: QuestionnaireAnswer[] = Object.entries(finalResponses).map(([key, val]) => ({
      questionId: key,
      value: val,
      label: `${key}: ${val}`,
      answeredAt: new Date().toISOString()
    }));

    const profileAnswers: QuestionnaireAnswer[] = [
      { questionId: "risk_profile_age", value: riskProfile.age, label: `Age: ${riskProfile.age}`, answeredAt: new Date().toISOString() },
      { questionId: "risk_profile_marriage", value: riskProfile.ageAtMarriage || "N/A", label: `Age at Marriage: ${riskProfile.ageAtMarriage || "N/A"}`, answeredAt: new Date().toISOString() },
      { questionId: "risk_profile_first_child", value: riskProfile.ageAtFirstChild || "N/A", label: `First Childbirth: ${riskProfile.ageAtFirstChild || "N/A"}`, answeredAt: new Date().toISOString() },
      { questionId: "risk_profile_children", value: riskProfile.numberOfChildren || "0", label: `Children: ${riskProfile.numberOfChildren || "0"}`, answeredAt: new Date().toISOString() },
      { questionId: "risk_profile_breastfeeding", value: riskProfile.breastfeeding || "N/A", label: `Breastfeeding: ${riskProfile.breastfeeding || "N/A"}`, answeredAt: new Date().toISOString() },
      { questionId: "risk_profile_contraceptives", value: riskProfile.contraceptives || "N/A", label: `Contraceptives: ${riskProfile.contraceptives || "N/A"}`, answeredAt: new Date().toISOString() },
      { questionId: "risk_profile_family_history", value: riskProfile.familyHistory || "No", label: `Family History: ${riskProfile.familyHistory || "No"}`, answeredAt: new Date().toISOString() },
      { questionId: "risk_profile_smoking", value: riskProfile.smoking || "Never", label: `Smoking: ${riskProfile.smoking || "Never"}`, answeredAt: new Date().toISOString() },
      { questionId: "risk_profile_diet", value: riskProfile.diet || "Standard", label: `Diet: ${riskProfile.diet || "Standard"}`, answeredAt: new Date().toISOString() }
    ];

    const answersList: QuestionnaireAnswer[] = [...profileAnswers, ...symptomAnswers];

    try {
      await PatientService.saveQuestionnaireProgress(patientId, answersList, []);
      await PatientService.submitQuestionnaire(
        patientId, 
        answersList, 
        `Completed Clinical Risk Assessment · Tier: ${result.tier} (Score: ${result.totalScore})`
      );
    } catch (e) {
      console.warn("Could not sync with PatientService", e);
    }

    addBotMessage(
      "**Phase 4: Risk Scoring & Clinical Analysis Complete**\nHere is your clinical risk analysis based on the Clinical Oncology Triage Algorithm:",
      "risk_report",
      {
        phase: 4,
        riskResult: result
      }
    );

    setSuggestions([
      "Finish & Save Assessment",
      "Download responses as CSV",
      "Check other symptoms",
      ...(onSwitchToManual ? ["Switch to Manual Questionnaire"] : [])
    ]);

    if (onSubmitted) {
      onSubmitted();
    }
  };

  const handleSuggestion = (val: string) => {
    if (val === "Switch to Manual Questionnaire" && onSwitchToManual) {
      const answersList: QuestionnaireAnswer[] = Object.entries(collectedResponses).map(([key, v]) => ({
        questionId: key,
        value: v,
        label: `${key}: ${v}`,
        answeredAt: new Date().toISOString()
      }));
      onSwitchToManual(answersList, "Switched from Phased Risk Chatbot");
      return;
    }

    if (val === "Download responses as CSV") {
      const allResponses = loadSymptomResponses();
      const csv = exportSymptomResponsesCsv(allResponses);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `breastcare_risk_assessment_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addBotMessage("Your comprehensive clinical assessment CSV is downloaded.");
      return;
    }

    if (val === "Finish & Save Assessment") {
      addUserMessage("Finish & Save Assessment");
      addBotMessage("Your assessment has been saved, your health & risk scores have been updated, and your report has been transmitted to your clinical care team.");
      setPhase("done");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("patient-updated"));
        try {
          const channel = new BroadcastChannel("breastcare-sync");
          channel.postMessage({ type: "patient-updated" });
          channel.close();
        } catch (e) {}
      }
      if (onSubmitted) {
        onSubmitted();
      }
      setSuggestions([
        ...(isModal ? ["Close & View Dashboard"] : []),
        "Download responses as CSV",
        "Re-evaluate Symptoms"
      ]);
      return;
    }

    if (val === "Close & View Dashboard") {
      if (onClose) {
        onClose();
      }
      return;
    }

    if (val === "Check other symptoms" || val === "Re-evaluate Symptoms") {
      addUserMessage("Check other symptoms");
      setPhase("p1_side");
      addBotMessage("**Phase 1: Primary Breast Screening**\nWhich breast is affected by symptoms?", "text", { phase: 1 });
      setSuggestions(["Left Breast", "Right Breast", "Both Breasts", "No breast symptoms"]);
      return;
    }

    if (val === "Submit Selection") {
      submitCurrentChecklist(false);
      return;
    }

    if (val === "None of these apply" || val === "None") {
      submitCurrentChecklist(true);
      return;
    }

    // Phase 0: Risk Profile Flow
    if (phase === "p0_age") {
      addUserMessage(val);
      setRiskProfile(prev => ({ ...prev, age: val }));
      setPhase("p0_marriage");
      addBotMessage("What was your age at marriage (if applicable)?", "text", { phase: 0 });
      setSuggestions(["< 20 years", "20–25 years", "26–30 years", "> 30 years", "Not married / N/A"]);
      return;
    }

    if (phase === "p0_marriage") {
      addUserMessage(val);
      const isUnmarried = val.toLowerCase().includes("not married") || val.toLowerCase().includes("n/a") || val.toLowerCase().includes("single");
      
      if (isUnmarried) {
        setRiskProfile(prev => ({
          ...prev,
          ageAtMarriage: val,
          ageAtFirstChild: "No children",
          numberOfChildren: "0",
          breastfeeding: "Never breastfed / N/A"
        }));
        setPhase("p0_contraceptives");
        addBotMessage("Have you used hormonal oral contraceptives?", "text", { phase: 0 });
        setSuggestions(["Never used", "Used < 1 year", "Used 1–5 years", "Used > 5 years (Long-term)"]);
        return;
      }

      setRiskProfile(prev => ({ ...prev, ageAtMarriage: val }));
      setPhase("p0_first_child");
      addBotMessage("What was your age at first childbirth?", "text", { phase: 0 });
      setSuggestions(["No children", "Age < 30 years", "Age ≥ 30 years"]);
      return;
    }

    if (phase === "p0_first_child") {
      addUserMessage(val);
      const hasNoChildren = val.toLowerCase().includes("no children");

      if (hasNoChildren) {
        setRiskProfile(prev => ({
          ...prev,
          ageAtFirstChild: "No children",
          numberOfChildren: "0",
          breastfeeding: "Never breastfed / N/A"
        }));
        setPhase("p0_contraceptives");
        addBotMessage("Have you used hormonal oral contraceptives?", "text", { phase: 0 });
        setSuggestions(["Never used", "Used < 1 year", "Used 1–5 years", "Used > 5 years (Long-term)"]);
        return;
      }

      setRiskProfile(prev => ({ ...prev, ageAtFirstChild: val }));
      setPhase("p0_children_count");
      addBotMessage("How many children do you have?", "text", { phase: 0 });
      setSuggestions(["1", "2", "3 or more"]);
      return;
    }

    if (phase === "p0_children_count") {
      addUserMessage(val);
      setRiskProfile(prev => ({ ...prev, numberOfChildren: val }));
      setPhase("p0_breastfeeding");
      addBotMessage("Do you have a history of breastfeeding?", "text", { phase: 0 });
      setSuggestions(["Yes (> 6 months)", "Yes (< 6 months)", "No / Never breastfed"]);
      return;
    }

    if (phase === "p0_breastfeeding") {
      addUserMessage(val);
      setRiskProfile(prev => ({ ...prev, breastfeeding: val }));
      setPhase("p0_contraceptives");
      addBotMessage("Have you used hormonal oral contraceptives?", "text", { phase: 0 });
      setSuggestions(["Never used", "Used < 1 year", "Used 1–5 years", "Used > 5 years (Long-term)"]);
      return;
    }

    if (phase === "p0_contraceptives") {
      addUserMessage(val);
      setRiskProfile(prev => ({ ...prev, contraceptives: val }));
      setPhase("p0_family_history");
      addBotMessage("Do you have a family history of breast or ovarian cancer?", "text", { phase: 0 });
      setSuggestions(["Yes (Mother / Sister / Daughter)", "Yes (Aunt / Grandmother)", "No family history", "Not sure"]);
      return;
    }

    if (phase === "p0_family_history") {
      addUserMessage(val);
      setRiskProfile(prev => ({ ...prev, familyHistory: val }));
      setPhase("p0_smoking");
      addBotMessage("What is your smoking status?", "text", { phase: 0 });
      setSuggestions(["Never smoked", "Former smoker", "Current smoker"]);
      return;
    }

    if (phase === "p0_smoking") {
      addUserMessage(val);
      setRiskProfile(prev => ({ ...prev, smoking: val }));
      setPhase("p0_diet");
      addBotMessage("What best describes your general diet?", "text", { phase: 0 });
      setSuggestions(["Vegetarian", "Non-vegetarian", "High-fat diet"]);
      return;
    }

    if (phase === "p0_diet") {
      addUserMessage(val);
      const updatedProfile = { ...riskProfile, diet: val };
      setRiskProfile(updatedProfile);

      addBotMessage(
        "**Phase 0 Completed.** Baseline Risk Modifier calculated.\nNow proceeding to **Phase 1: Primary Breast Screening** (Highest diagnostic weight).",
        "text",
        { phase: 1 }
      );
      addBotMessage("Which breast is affected by symptoms or changes?", "text", { phase: 1 });

      setPhase("p1_side");
      setSuggestions(["Left Breast", "Right Breast", "Both Breasts", "No breast symptoms"]);
      return;
    }

    // Phase 1: Side selection
    if (phase === "p1_side") {
      addUserMessage(val);
      const sideVal = val.toLowerCase().includes("left")
        ? "left"
        : val.toLowerCase().includes("right")
        ? "right"
        : val.toLowerCase().includes("both")
        ? "both"
        : "none";
      
      setSelectedSide(sideVal);

      if (sideVal === "none") {
        setPhase("p2_neck");
        addBotMessage("**Phase 2: Regional Spread Screening**\nScreening Neck and Lymph Node areas:", "text", { phase: 2 });
        startChecklist("Symptoms on Neck", 2, "p2_neck");
      } else {
        setPhase("p1_breast");
        const catToStart = sideVal === "right" ? "Symptoms on Right Breast" : "Symptoms on Left Breast";
        startChecklist(catToStart, 1, "p1_breast");
      }
      return;
    }

    // Phase 3 Check question
    if (phase === "p3_check") {
      addUserMessage(val);
      if (val.toLowerCase().includes("yes")) {
        setPhase("p3_systemic");
        addBotMessage("Screening Respiratory symptoms:", "text", { phase: 3 });
        startChecklist("Respiratory Symptoms", 3, "p3_systemic");
      } else {
        // Clean Phase 3 -> Finish
        generateRiskReport(collectedResponses);
      }
      return;
    }

    addBotMessage("Please choose one of the available options below.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const value = input.trim();
    setInput("");

    handleSuggestion(value);
  };

  const containerClasses = isModal
    ? "fixed bottom-6 right-6 z-50 h-[88vh] w-[46vw] min-w-[360px] max-w-[760px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-scale-in"
    : "chatbot-shell w-full max-w-4xl lg:max-w-5xl bg-white rounded-2xl shadow-xl border border-slate-100 grid grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden text-left h-[min(760px,calc(100dvh-120px))] min-h-[480px]";

  const getTierColor = (tier: RiskTier) => {
    switch (tier) {
      case "Urgent":
        return {
          bg: "bg-rose-50 border-rose-200 text-rose-800",
          badge: "bg-rose-600 text-white",
          icon: ShieldAlert
        };
      case "High":
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-900",
          badge: "bg-amber-600 text-white",
          icon: AlertTriangle
        };
      case "Moderate":
        return {
          bg: "bg-blue-50 border-blue-200 text-blue-900",
          badge: "bg-blue-600 text-white",
          icon: Activity
        };
      default:
        return {
          bg: "bg-emerald-50 border-emerald-200 text-emerald-900",
          badge: "bg-emerald-600 text-white",
          icon: ShieldCheck
        };
    }
  };

  return (
    <div className={containerClasses}>
      {/* Header */}
      {!hideHeader && (
        <div className="bg-gradient-to-r from-[#005F56] via-[#007066] to-[#00897B] px-5 py-4 flex items-center justify-between shrink-0 border-b border-white/10 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8.5 h-8.5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Brain className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">NariSetu Assistant</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] text-white/80 font-medium">Educational purposes only</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 bg-[#FAF6F6]/30 scrollbar-thin relative focus:outline-none"
        style={{ overscrollBehavior: "contain" }}
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`max-w-[88%] ${msg.sender === "user" ? "ml-auto" : "mr-auto"}`}>
            {msg.sender === "user" ? (
              <div className="bg-[#005F56] text-white p-3 rounded-2xl rounded-tr-none text-xs leading-relaxed font-medium shadow-sm">
                {msg.text}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 text-slate-700 p-4 rounded-2xl rounded-tl-none text-xs leading-relaxed shadow-sm space-y-3">
                {msg.text && (
                  <div className="whitespace-pre-line text-slate-800">
                    {msg.text.includes("**") ? (
                      <span dangerouslySetInnerHTML={{
                        __html: msg.text
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#005F56]">$1</strong>')
                          .replace(/\n/g, '<br/>')
                      }} />
                    ) : (
                      msg.text
                    )}
                  </div>
                )}

                {/* Checklist Rendering */}
                {msg.type === "checklist" && msg.category && (
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                    {msg.category.options.map((option) => {
                      const isChecked = msg.submitted
                        ? collectedResponses[option.converted_name] === "Yes"
                        : tempSelections[option.converted_name] || false;
                      return (
                        <label
                          key={option.converted_name}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all select-none
                            ${isChecked ? "bg-[#005F56]/10 border-[#005F56] text-[#005F56] font-semibold" : "bg-slate-50/50 border-slate-200 text-slate-600"}
                            ${msg.submitted ? "cursor-default opacity-85" : "cursor-pointer hover:bg-[#005F56]/5 hover:border-[#005F56]/30"}
                          `}
                        >
                          <input
                            type="checkbox"
                            disabled={msg.submitted}
                            checked={isChecked}
                            onChange={(e) => {
                              if (msg.submitted) return;
                              setTempSelections((prev) => ({
                                ...prev,
                                [option.converted_name]: e.target.checked
                              }));
                            }}
                            className="mt-0.5 rounded border-slate-350 text-[#005F56] focus:ring-[#005F56] h-3.5 w-3.5 accent-[#005F56]"
                          />
                          <span className="text-[11px] leading-tight flex-1">
                            {option.label}
                          </span>
                        </label>
                      );
                    })}
                    {!msg.submitted && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => submitCurrentChecklist(false)}
                          className="flex-1 py-2 bg-[#005F56] hover:bg-[#004D46] text-white text-[11px] font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                        >
                          Submit Selection
                        </button>
                        <button
                          onClick={() => submitCurrentChecklist(true)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-xl transition-all cursor-pointer"
                        >
                          None
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Risk Report Output */}
                {msg.type === "risk_report" && msg.riskResult && (
                  <div className="space-y-3.5 mt-3 border-t border-slate-100 pt-3 text-left">
                    {/* Risk Tier Badge Card */}
                    {(() => {
                      const style = getTierColor(msg.riskResult.tier);
                      const TierIcon = style.icon;
                      return (
                        <div className={`p-3.5 rounded-2xl border ${style.bg}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Clinical Triage Result
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${style.badge}`}>
                              <TierIcon className="w-3 h-3" /> {msg.riskResult.tier} Risk
                            </span>
                          </div>

                          <div className="mt-2.5 flex items-baseline justify-between border-t border-slate-200/60 pt-2 text-xs">
                            <span className="font-semibold text-slate-700">Total Weighted Score:</span>
                            <span className="font-black text-sm text-[#005F56]">{msg.riskResult.totalScore} pts</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Escalation Override Alert */}
                    {msg.riskResult.override.triggered && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs">
                        <p className="font-bold text-[11px] text-rose-800 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          Safety Escalation Triggered: {msg.riskResult.override.ruleName}
                        </p>
                        <p className="text-[10px] text-rose-700 mt-1 leading-relaxed">
                          {msg.riskResult.override.reason}
                        </p>
                      </div>
                    )}

                    {/* Score Breakdown Table */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                      <p className="font-bold text-[10px] text-slate-600 uppercase tracking-wider">
                        Phased Scoring & Multipliers Breakdown
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 pt-1">
                        <div>Phase 0 (Risk Profile): <strong>+{msg.riskResult.brm.score} pts</strong></div>
                        <div>Phase 1 (Breast ×1.5): <strong>{msg.riskResult.symptomScoring.phase1Weighted} pts</strong></div>
                        <div>Phase 2 (Regional ×{msg.riskResult.symptomScoring.phase2Multiplier}): <strong>{msg.riskResult.symptomScoring.phase2Weighted} pts</strong></div>
                        <div>Phase 3 (Systemic ×{msg.riskResult.symptomScoring.phase3Multiplier}): <strong>{msg.riskResult.symptomScoring.phase3Weighted} pts</strong></div>
                      </div>
                    </div>

                    {/* Interpretation */}
                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl">
                      <p className="font-bold text-[10px] text-blue-800 uppercase tracking-wider flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-blue-600" /> POSSIBLE CLINICAL INTERPRETATION
                      </p>
                      <p className="text-[11px] text-blue-900 mt-1 leading-relaxed">
                        {msg.riskResult.interpretation}
                      </p>
                    </div>

                    {/* Recommendation */}
                    <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                      <p className="font-bold text-[10px] text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> RECOMMENDATION
                      </p>
                      <p className="text-[11px] text-emerald-900 mt-1 leading-relaxed">
                        {msg.riskResult.recommendation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions / Options */}
      <div className="px-4 py-2.5 border-t border-slate-100 bg-white max-h-32 overflow-y-auto scrollbar-thin shrink-0">
        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">OPTIONS</p>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSuggestion(s)}
              className="text-[10px] bg-slate-50 border border-slate-200 hover:border-[#005F56]/40 hover:bg-[#005F56]/5 hover:text-[#005F56] text-slate-600 px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-semibold animate-fade-in"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Search / Text Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-slate-100 bg-white shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          type="text"
          placeholder="Type a category, option, or search..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#005F56]/30 focus:border-[#005F56]/40 transition-all"
        />
        <button
          type="submit"
          className="w-8.5 h-8.5 rounded-xl bg-[#005F56] hover:bg-[#004D46] text-white flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
