"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useState, useEffect } from "react";

import { useAuth } from "../auth/AuthContext";
import { PatientService } from "../../services/patient.service";
import type { PatientRecord, ConsentRecord, UploadedClinicalDocument } from "../../types/questionnaire";
import { 
  ArrowLeft, 
  Save, 
  CheckCircle, 
  FileText, 
  Scale, 
  Heart, 
  Activity, 
  FileCheck, 
  AlertCircle, 
  ShieldAlert, 
  Trash2, 
  Upload, 
  ChevronDown, 
  ChevronUp,
  UserCheck
} from "lucide-react";

export const NurseIntakePage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [activeSection, setActiveSection] = useState<number>(1);
  const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "Error">("Saved");
  
  // Section completion checks
  const [completedSections, setCompletedSections] = useState<Record<number, boolean>>({});

  // ─── STATE FOR ALL 11 SECTIONS ──────────────────────────────────────

  // Section 1: Patient Identity
  const [name, setName] = useState("");
  const [age, setAge] = useState(0);
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [preferredContact, setPreferredContact] = useState("SMS");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");

  // Section 2: Basic Measurements & BMI
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [weightNote, setWeightNote] = useState("");
  const [liveBmi, setLiveBmi] = useState<number>(0);
  const [bmiCategory, setBmiCategory] = useState({ category: "", description: "" });

  // Section 3: Current Breast Concern
  const [hasConcern, setHasConcern] = useState<"yes" | "no" | "">("");
  const [affectedSide, setAffectedSide] = useState<"left" | "right" | "both" | "not_sure" | "">("");
  const [mainConcern, setMainConcern] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [progression, setProgression] = useState("");
  const [severity, setSeverity] = useState("");
  const [frequency, setFrequency] = useState(""); // constant vs intermittent
  const [hasFever, setHasFever] = useState("");
  const [hasInjury, setHasInjury] = useState("");
  const [symptomNotes, setSymptomNotes] = useState("");

  // Section 4: Side-Specific Symptoms
  const [leftLump, setLeftLump] = useState("");
  const [leftArmpit, setLeftArmpit] = useState("");
  const [leftShoulderNeck, setLeftShoulderNeck] = useState("");
  const [leftNippleChanges, setLeftNippleChanges] = useState("");
  const [leftSkinChanges, setLeftSkinChanges] = useState("");
  const [leftTenderness, setLeftTenderness] = useState("");

  const [rightLump, setRightLump] = useState("");
  const [rightArmpit, setRightArmpit] = useState("");
  const [rightShoulderNeck, setRightShoulderNeck] = useState("");
  const [rightNippleChanges, setRightNippleChanges] = useState("");
  const [rightSkinChanges, setRightSkinChanges] = useState("");
  const [rightTenderness, setRightTenderness] = useState("");

  // Section 5: Menstrual & Reproductive History
  const [menstrualStatus, setMenstrualStatus] = useState("");
  const [menarcheAge, setMenarcheAge] = useState("");
  const [menopauseStatus, setMenopauseStatus] = useState("");
  const [menopauseAge, setMenopauseAge] = useState("");
  const [pregnancyCount, setPregnancyCount] = useState("");
  const [breastfeedingDuration, setBreastfeedingDuration] = useState("");
  const [currentPregnancyStatus, setCurrentPregnancyStatus] = useState("");
  const [contraceptiveUse, setContraceptiveUse] = useState("");
  const [hrtUse, setHrtUse] = useState("");
  const [fertilityTreatment, setFertilityTreatment] = useState("");

  // Section 6: Personal Medical History (Expandable accordion sections)
  const [historyOpen, setHistoryOpen] = useState<Record<string, boolean>>({
    conditions: true,
    procedures: false,
    other: false
  });
  const [prevConditions, setPrevConditions] = useState<string[]>([]);
  const [prevSurgeries, setPrevSurgeries] = useState<string[]>([]);
  const [prevBiopsy, setPrevBiopsy] = useState("");
  const [prevBenignLump, setPrevBenignLump] = useState("");
  const [prevCancer, setPrevCancer] = useState("");
  const [chestRadiation, setChestRadiation] = useState("");
  const [diabetes, setDiabetes] = useState("");
  const [hypertension, setHypertension] = useState("");
  const [thyroid, setThyroid] = useState("");
  const [currentMeds, setCurrentMeds] = useState("");
  const [allergies, setAllergies] = useState("");

  // Section 7: Family History
  const [familyCancerBreast, setFamilyCancerBreast] = useState("");
  const [familyCancerOvarian, setFamilyCancerOvarian] = useState("");
  const [familyRelation, setFamilyRelation] = useState("");
  const [familyDiagnosisAge, setFamilyDiagnosisAge] = useState("");
  const [familyMultipleAffected, setFamilyMultipleAffected] = useState("");
  const [brcaTested, setBrcaTested] = useState("");

  // Section 8: Lifestyle and General Wellness
  const [physicalActivity, setPhysicalActivity] = useState("");
  const [smoking, setSmoking] = useState("");
  const [alcohol, setAlcohol] = useState("");
  const [sleepQuality, setSleepQuality] = useState("");
  const [nutritionPattern, setNutritionPattern] = useState("");
  const [recentWeightChange, setRecentWeightChange] = useState("");
  const [stressLevel, setStressLevel] = useState("");

  // Section 9: Previous Screening & Reports
  const [mammogramHistory, setMammogramHistory] = useState("");
  const [ultrasoundHistory, setUltrasoundHistory] = useState("");
  const [mriHistory, setMriHistory] = useState("");
  const [lastScreeningDate, setLastScreeningDate] = useState("");
  const [screeningFacility, setScreeningFacility] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedClinicalDocument[]>([]);

  // Section 10: Consent and Verification
  const [consentCareTeam, setConsentCareTeam] = useState(false);
  const [consentReportStorage, setConsentReportStorage] = useState(false);
  const [consentResearch, setConsentResearch] = useState(false);
  const [confirmAccurate, setConfirmAccurate] = useState(false);
  const [nurseVerifyId, setNurseVerifyId] = useState(false);
  const [nurseSignName, setNurseSignName] = useState("");

  // Section 11: Review & Submission states
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);

  // Load existing patient record & prefill form
  useEffect(() => {
    let active = true;
    const loadIntakeData = async () => {
      if (patientId) {
        const record = await PatientService.getPatient(patientId);
        if (!active) return;
        if (record) {
          setPatient(record);
          
          // Prefill Section 1: Demographics
          setName(record.name || "");
          setAge(record.age || 0);
          setDob(record.dob || "");
          setPhone(record.phone || "");
          setEmail(record.email || "");
          setAddress(record.address || "");
          setPreferredLanguage(record.preferredLanguage || "English");
          setPreferredContact(record.contactPreference?.split(" (")[0] || "SMS");
          setEmergencyContact(record.emergencyContact || "");
          setEmergencyRelationship(record.emergencyRelationship || "");

          // Prefill Section 2: Measurements
          if (record.bmi) {
            setHeightCm(String(record.bmi.heightCm));
            setWeightKg(String(record.bmi.weightKg));
          }

          // Prefill from existing clinicalIntake if present (e.g. Draft status)
          if (record.clinicalIntake && record.clinicalIntake.answers) {
            const ans = record.clinicalIntake.answers;
            
            setWeightNote(ans.weightNote || "");
            setHasConcern(ans.hasConcern || "");
            setAffectedSide(ans.affectedSide || "");
            setMainConcern(ans.mainConcern || []);
            setDuration(ans.duration || "");
            setProgression(ans.progression || "");
            setSeverity(ans.severity || "");
            setFrequency(ans.frequency || "");
            setHasFever(ans.hasFever || "");
            setHasInjury(ans.hasInjury || "");
            setSymptomNotes(ans.symptomNotes || "");

            // Left Symptoms
            setLeftLump(ans.leftLump || "");
            setLeftArmpit(ans.leftArmpit || "");
            setLeftShoulderNeck(ans.leftShoulderNeck || "");
            setLeftNippleChanges(ans.leftNippleChanges || "");
            setLeftSkinChanges(ans.leftSkinChanges || "");
            setLeftTenderness(ans.leftTenderness || "");

            // Right Symptoms
            setRightLump(ans.rightLump || "");
            setRightArmpit(ans.rightArmpit || "");
            setRightShoulderNeck(ans.rightShoulderNeck || "");
            setRightNippleChanges(ans.rightNippleChanges || "");
            setRightSkinChanges(ans.rightSkinChanges || "");
            setRightTenderness(ans.rightTenderness || "");

            // Reproductive History
            setMenstrualStatus(ans.menstrualStatus || "");
            setMenarcheAge(ans.menarcheAge || "");
            setMenopauseStatus(ans.menopauseStatus || "");
            setMenopauseAge(ans.menopauseAge || "");
            setPregnancyCount(ans.pregnancyCount || "");
            setBreastfeedingDuration(ans.breastfeedingDuration || "");
            setCurrentPregnancyStatus(ans.currentPregnancyStatus || "");
            setContraceptiveUse(ans.contraceptiveUse || "");
            setHrtUse(ans.hrtUse || "");
            setFertilityTreatment(ans.fertilityTreatment || "");

            // Medical History
            setPrevConditions(ans.prevConditions || []);
            setPrevSurgeries(ans.prevSurgeries || []);
            setPrevBiopsy(ans.prevBiopsy || "");
            setPrevBenignLump(ans.prevBenignLump || "");
            setPrevCancer(ans.prevCancer || "");
            setChestRadiation(ans.chestRadiation || "");
            setDiabetes(ans.diabetes || "");
            setHypertension(ans.hypertension || "");
            setThyroid(ans.thyroid || "");
            setCurrentMeds(ans.currentMeds || "");
            setAllergies(ans.allergies || "");

            // Family History
            setFamilyCancerBreast(ans.familyCancerBreast || "");
            setFamilyCancerOvarian(ans.familyCancerOvarian || "");
            setFamilyRelation(ans.familyRelation || "");
            setFamilyDiagnosisAge(ans.familyDiagnosisAge || "");
            setFamilyMultipleAffected(ans.familyMultipleAffected || "");
            setBrcaTested(ans.brcaTested || "");

            // Lifestyle Details
            setPhysicalActivity(ans.physicalActivity || "");
            setSmoking(ans.smoking || "");
            setAlcohol(ans.alcohol || "");
            setSleepQuality(ans.sleepQuality || "");
            setNutritionPattern(ans.nutritionPattern || "");
            setRecentWeightChange(ans.recentWeightChange || "");
            setStressLevel(ans.stressLevel || "");

            // Screenings
            setMammogramHistory(ans.mammogramHistory || "");
            setUltrasoundHistory(ans.ultrasoundHistory || "");
            setMriHistory(ans.mriHistory || "");
            setLastScreeningDate(ans.lastScreeningDate || "");
            setScreeningFacility(ans.screeningFacility || "");
            setUploadedFiles(record.clinicalIntake.uploadedDocuments || []);

            // Consent
            if (record.clinicalIntake.consent) {
              const consent = record.clinicalIntake.consent;
              setConsentCareTeam(consent.careTeamAccess);
              setConsentReportStorage(consent.reportStorage);
              setConsentResearch(consent.researchUse);
              setConfirmAccurate(consent.answersAccurate);
              setNurseVerifyId(consent.nurseVerified);
              setNurseSignName(consent.nurseName);
            }
          }
        }
      }
    };
    loadIntakeData();
    return () => { active = false; };
  }, [patientId]);

  // Live BMI calculation
  useEffect(() => {
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (h > 0 && w > 0) {
      const value = PatientService.calculateBmi(w, h);
      setLiveBmi(value);
      const classification = PatientService.classifyBmi(value, age || patient?.age || 30);
      setBmiCategory(classification);
    } else {
      setLiveBmi(0);
      setBmiCategory({ category: "", description: "" });
    }
  }, [heightCm, weightKg, age]);

  // Gather current answers state into a flat key-value object
  const compileAnswers = () => {
    return {
      // Identity
      name,
      age,
      dob,
      phone,
      email,
      address,
      preferredLanguage,
      preferredContact,
      emergencyContact,
      emergencyRelationship,

      // Vitals
      heightCm,
      weightKg,
      weightNote,

      // Concern
      hasConcern,
      affectedSide,
      mainConcern,
      duration,
      progression,
      severity,
      frequency,
      hasFever,
      hasInjury,
      symptomNotes,

      // Left
      leftLump,
      leftArmpit,
      leftShoulderNeck,
      leftNippleChanges,
      leftSkinChanges,
      leftTenderness,

      // Right
      rightLump,
      rightArmpit,
      rightShoulderNeck,
      rightNippleChanges,
      rightSkinChanges,
      rightTenderness,

      // Reproductive
      menstrualStatus,
      menarcheAge,
      menopauseStatus,
      menopauseAge,
      pregnancyCount,
      breastfeedingDuration,
      currentPregnancyStatus,
      contraceptiveUse,
      hrtUse,
      fertilityTreatment,

      // Medical History
      prevConditions,
      prevSurgeries,
      prevBiopsy,
      prevBenignLump,
      prevCancer,
      chestRadiation,
      diabetes,
      hypertension,
      thyroid,
      currentMeds,
      allergies,

      // Family History
      familyCancerBreast,
      familyCancerOvarian,
      familyRelation,
      familyDiagnosisAge,
      familyMultipleAffected,
      brcaTested,

      // Lifestyle
      physicalActivity,
      smoking,
      alcohol,
      sleepQuality,
      nutritionPattern,
      recentWeightChange,
      stressLevel,

      // Screenings
      mammogramHistory,
      ultrasoundHistory,
      mriHistory,
      lastScreeningDate,
      screeningFacility
    };
  };

  // AUTOSAVE IMPLEMENTATION
  useEffect(() => {
    if (!patientId || !patient) return;
    
    setSaveStatus("Saving...");
    const timeout = setTimeout(async () => {
      const answers = compileAnswers();
      const consentRecord: ConsentRecord = {
        careTeamAccess: consentCareTeam,
        reportStorage: consentReportStorage,
        researchUse: consentResearch,
        answersAccurate: confirmAccurate,
        nurseVerified: nurseVerifyId,
        nurseName: nurseSignName,
        timestamp: new Date().toISOString()
      };
      
      try {
        await PatientService.saveIntakeDraft(
          patientId,
          answers,
          consentRecord,
          uploadedFiles,
          user?.id,
          user?.name
        );
        setSaveStatus("Saved");
      } catch (err) {
        console.error(err);
        setSaveStatus("Error");
      }
    }, 1500); // 1.5s debounce to limit localStorage calls

    return () => clearTimeout(timeout);
  }, [
    name, age, dob, phone, email, address, preferredLanguage, preferredContact, emergencyContact, emergencyRelationship,
    heightCm, weightKg, weightNote,
    hasConcern, affectedSide, mainConcern, duration, progression, severity, frequency, hasFever, hasInjury, symptomNotes,
    leftLump, leftArmpit, leftShoulderNeck, leftNippleChanges, leftSkinChanges, leftTenderness,
    rightLump, rightArmpit, rightShoulderNeck, rightNippleChanges, rightSkinChanges, rightTenderness,
    menstrualStatus, menarcheAge, menopauseStatus, menopauseAge, pregnancyCount, breastfeedingDuration, currentPregnancyStatus, contraceptiveUse, hrtUse, fertilityTreatment,
    prevConditions, prevSurgeries, prevBiopsy, prevBenignLump, prevCancer, chestRadiation, diabetes, hypertension, thyroid, currentMeds, allergies,
    familyCancerBreast, familyCancerOvarian, familyRelation, familyDiagnosisAge, familyMultipleAffected, brcaTested,
    physicalActivity, smoking, alcohol, sleepQuality, nutritionPattern, recentWeightChange, stressLevel,
    mammogramHistory, ultrasoundHistory, mriHistory, lastScreeningDate, screeningFacility,
    consentCareTeam, consentReportStorage, consentResearch, confirmAccurate, nurseVerifyId, nurseSignName,
    uploadedFiles
  ]);

  // Document attachments mockup
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newDoc: UploadedClinicalDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        type: file.name.split(".").pop()?.toUpperCase() === "PDF" ? "pathology" : "mammogram",
        date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        progress: 100
      };
      setUploadedFiles(prev => [...prev, newDoc]);
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Section toggle helpers
  const nextSection = () => {
    setCompletedSections(prev => ({ ...prev, [activeSection]: true }));
    setActiveSection(prev => Math.min(prev + 1, 11));
  };

  const prevSection = () => {
    setActiveSection(prev => Math.max(prev - 1, 1));
  };

  // Validation warnings
  const getValidationWarnings = () => {
    const warnings: string[] = [];
    if (!name) warnings.push("Patient Full Name is missing in Section 1");
    if (!dob) warnings.push("Date of Birth is missing in Section 1");
    if (!heightCm || !weightKg) warnings.push("Vitals and height/weight measurements are incomplete in Section 2");
    if (hasConcern === "yes" && !affectedSide) warnings.push("Breast Side Selection is required in Section 3");
    if (!nurseVerifyId || !nurseSignName) warnings.push("Nurse Signature verification is required in Section 10");
    return warnings;
  };

  // SUBMIT HANDLER
  const handleSubmitIntake = async () => {
    const warnings = getValidationWarnings();
    if (warnings.length > 0) {
      alert(`Intake form is incomplete. Please fix the following:\n\n${warnings.join("\n")}`);
      return;
    }

    if (!patientId) return;

    // Log revision logs before submission if it was previously in needs clarification
    if (patient?.status === "Needs Clarification") {
      await PatientService.addIntakeRevision(
        patientId,
        "Re-submission updates",
        "Needs Clarification status",
        "Resubmitted to Doctor workspace",
        user?.name || "Sister Lakshmi"
      );
    }

    const answers = compileAnswers();
    const consentRecord: ConsentRecord = {
      careTeamAccess: consentCareTeam,
      reportStorage: consentReportStorage,
      researchUse: consentResearch,
      answersAccurate: confirmAccurate,
      nurseVerified: nurseVerifyId,
      nurseName: nurseSignName,
      timestamp: new Date().toISOString()
    };

    await PatientService.submitIntake(
      patientId,
      answers,
      consentRecord,
      uploadedFiles,
      user?.id,
      user?.name
    );

    setIsSubmitSuccess(true);
  };

  if (!patient) {
    return (
      <div className="bg-white border border-slate-100 p-8 rounded-3xl text-center text-xs text-slate-400">
        Clinical patient record not found.
      </div>
    );
  }

  if (isSubmitSuccess) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-slate-100 rounded-3xl p-8 text-center space-y-6 shadow-xs text-left">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-slate-800">Patient intake submitted successfully for clinical review.</h1>
          <p className="text-xs text-slate-400">
            The record has been locked and compiled into the case queue. It is now accessible to the assigned doctor.
          </p>
        </div>
        
        <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs space-y-3">
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500">Assigned Doctor:</span>
            <span className="font-bold text-slate-800">Dr. Sarah Iyer</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500">Intake Status:</span>
            <span className="font-bold text-slate-800">Awaiting Doctor Review</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500">Submission Time:</span>
            <span className="font-bold text-slate-800">{new Date().toLocaleTimeString("en-IN", {hour: "2-digit", minute:"2-digit"})}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500">Next Expected Action:</span>
            <span className="font-bold text-slate-800">Clinical Case Reconciliation</span>
          </div>
        </div>

        <button
          onClick={() => router.push("/nurse/dashboard")}
          className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-2xl shadow-xs transition-colors cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // 11 Form Sections definition
  const sectionsList = [
    { num: 1, label: "Patient Identity", icon: FileText },
    { num: 2, label: "Vitals & BMI Calculation", icon: Scale },
    { num: 3, label: "Current Concern", icon: Activity },
    { num: 4, label: "Side Specific Symptoms", icon: Activity },
    { num: 5, label: "Reproductive History", icon: Heart },
    { num: 6, label: "Medical History Checklist", icon: FileText },
    { num: 7, label: "Family Health History", icon: FileText },
    { num: 8, label: "Wellness & Lifestyle", icon: Heart },
    { num: 9, label: "Screening Attachments", icon: FileCheck },
    { num: 10, label: "Consent & Verification", icon: UserCheck },
    { num: 11, label: "Review & Submission", icon: CheckCircle }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left">
      {/* Top Navbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-100 rounded-3xl p-4 md:px-6 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/nurse/dashboard")}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-800">Breast Health Clinical Intake</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Patient: <span className="font-semibold">{name || patient.name}</span> ({patientId})</p>
          </div>
        </div>

        {/* Live Autosave Header status */}
        <div className="flex items-center gap-3 self-end md:self-auto text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Save className="w-3.5 h-3.5" />
            <span>Draft status:</span>
            <span className={`font-semibold ${saveStatus === "Saving..." ? "text-amber-500" : "text-emerald-600"}`}>
              {saveStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left column: Step navigation */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-3xl p-4 space-y-2 hidden lg:block">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-3">Intake Section Steps</h2>
          <nav className="space-y-1">
            {sectionsList.map(sec => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.num;
              const isCompleted = completedSections[sec.num];
              return (
                <button
                  key={sec.num}
                  onClick={() => setActiveSection(sec.num)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                    isActive 
                      ? "bg-primary text-white" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{sec.num}. {sec.label}</span>
                  </div>
                  {isCompleted && !isActive && (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right column: Form section */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
          
          {/* SECTION 1: Patient Identity */}
          {activeSection === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Section 1: Patient Identity Verification</h3>
                <p className="text-xs text-slate-400 mt-1">Cross-check the patient's identity credentials before finalizing.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Patient ID (Auto)</label>
                  <input
                    type="text"
                    value={patientId}
                    disabled
                    className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Age *</label>
                  <input
                    type="number"
                    value={age || ""}
                    onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Preferred Language</label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi / हिन्दी</option>
                    <option value="Marathi">Marathi / मराठी</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Preferred Contact Method</label>
                  <select
                    value={preferredContact}
                    onChange={(e) => setPreferredContact(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring"
                  >
                    <option value="SMS">SMS</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Call">Direct Phone Call</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Emergency Contact Phone *</label>
                  <input
                    type="tel"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Emergency Relationship</label>
                  <input
                    type="text"
                    value={emergencyRelationship}
                    onChange={(e) => setEmergencyRelationship(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Residential Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: Basic Measurements & BMI */}
          {activeSection === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Section 2: Vitals & Body Mass Index</h3>
                <p className="text-xs text-slate-400 mt-1">Record physical measurements. BMI classification updates automatically.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Height (cm) *</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Weight (kg) *</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Notes about recent major weight changes</label>
                  <input
                    type="text"
                    value={weightNote}
                    onChange={(e) => setWeightNote(e.target.value)}
                    placeholder="e.g. Unexplained weight loss of 5kg over 2 months"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring"
                  />
                </div>
              </div>

              {/* BMI Output widget card */}
              {liveBmi > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500">Live BMI Score</span>
                    <span className="text-lg font-extrabold text-primary">{liveBmi}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{bmiCategory.category}</span>
                    <span className="text-[11px] text-slate-400 mt-1 block">{bmiCategory.description}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: Current Breast Concern */}
          {activeSection === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Section 3: Current Breast Concern</h3>
                <p className="text-xs text-slate-400 mt-1">Select the active symptoms reporting by the patient.</p>
              </div>

              <div className="space-y-4">
                {/* Experiencing concern */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Is the patient currently experiencing symptoms? *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                      <input
                        type="radio"
                        name="concern"
                        checked={hasConcern === "yes"}
                        onChange={() => setHasConcern("yes")}
                        className="w-4 h-4 cursor-pointer"
                      />
                      Yes, active concerns
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                      <input
                        type="radio"
                        name="concern"
                        checked={hasConcern === "no"}
                        onChange={() => setHasConcern("no")}
                        className="w-4 h-4 cursor-pointer"
                      />
                      No symptoms reported
                    </label>
                  </div>
                </div>

                {hasConcern === "yes" && (
                  <>
                    {/* Side selection */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">Affected Breast Side *</label>
                      <div className="flex flex-wrap gap-2">
                        {["left", "right", "both", "not_sure"].map(side => (
                          <button
                            key={side}
                            type="button"
                            onClick={() => setAffectedSide(side as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                              affectedSide === side 
                                ? "bg-primary text-white border-primary" 
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {side.replace(/_/g, " ").toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Symptoms selection */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">Primary Symptoms (Select all that apply)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { id: "pain", label: "Pain or discomfort" },
                          { id: "lump", label: "Lump or thickening" },
                          { id: "swelling", label: "Swelling" },
                          { id: "discharge", label: "Nipple discharge" },
                          { id: "inversion", label: "Nipple inversion" },
                          { id: "dimpling", label: "Skin dimpling" },
                          { id: "redness", label: "Redness or warmth" },
                          { id: "size_change", label: "Change in size or shape" },
                          { id: "armpit_swelling", label: "Armpit swelling" },
                          { id: "other", label: "Other" }
                        ].map(symp => {
                          const checked = mainConcern.includes(symp.id);
                          return (
                            <button
                              key={symp.id}
                              type="button"
                              onClick={() => {
                                setMainConcern(prev => 
                                  checked ? prev.filter(c => c !== symp.id) : [...prev, symp.id]
                                );
                              }}
                              className={`px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all border cursor-pointer truncate ${
                                checked 
                                  ? "bg-primary/5 text-primary border-primary/20" 
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <span className="mr-1">{checked ? "✓" : "+"}</span>
                              {symp.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Extra details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Duration</label>
                        <select
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring"
                        >
                          <option value="">Select duration...</option>
                          <option value="few_days">Few Days</option>
                          <option value="1_to_4_weeks">1 to 4 Weeks</option>
                          <option value="1_to_3_months">1 to 3 Months</option>
                          <option value="more_than_3_months">More than 3 Months</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Symptom Progression</label>
                        <select
                          value={progression}
                          onChange={(e) => setProgression(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring"
                        >
                          <option value="">Select progression...</option>
                          <option value="improving">Improving</option>
                          <option value="stable">Stable / Unchanged</option>
                          <option value="worsening">Worsening</option>
                          <option value="fluctuating">Fluctuating</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Severity</label>
                        <select
                          value={severity}
                          onChange={(e) => setSeverity(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring"
                        >
                          <option value="">Select severity...</option>
                          <option value="mild">Mild</option>
                          <option value="moderate">Moderate</option>
                          <option value="severe">Severe / Painful</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Frequency</label>
                        <select
                          value={frequency}
                          onChange={(e) => setFrequency(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring"
                        >
                          <option value="">Select frequency...</option>
                          <option value="constant">Constant</option>
                          <option value="intermittent">Intermittent / Fluctuating</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">Is the patient acutely unwell or has fever?</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-1.5 text-xs text-slate-600">
                            <input
                              type="radio"
                              name="fever"
                              checked={hasFever === "yes"}
                              onChange={() => setHasFever("yes")}
                            />
                            Yes
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-slate-600">
                            <input
                              type="radio"
                              name="fever"
                              checked={hasFever === "no"}
                              onChange={() => setHasFever("no")}
                            />
                            No
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">Recent trauma or chest injury?</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-1.5 text-xs text-slate-600">
                            <input
                              type="radio"
                              name="injury"
                              checked={hasInjury === "yes"}
                              onChange={() => setHasInjury("yes")}
                            />
                            Yes
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-slate-600">
                            <input
                              type="radio"
                              name="injury"
                              checked={hasInjury === "no"}
                              onChange={() => setHasInjury("no")}
                            />
                            No
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Short clinical description</label>
                      <textarea
                        value={symptomNotes}
                        onChange={(e) => setSymptomNotes(e.target.value)}
                        placeholder="Add secondary concern context here..."
                        rows={2}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* SECTION 4: Side-Specific Symptoms Details */}
          {activeSection === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Section 4: Side-Specific Discomfort details</h3>
                <p className="text-xs text-slate-400 mt-1"> Palpation checks. (Discomfort or neck area pain is documented as associated discomfort, not cancer diagnosis).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Side Panel */}
                {(affectedSide === "left" || affectedSide === "both") && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <h4 className="font-bold text-sm text-primary">LEFT Side Discomforts</h4>
                    
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Left Nipple Changes?</label>
                      <select value={leftNippleChanges} onChange={(e)=>setLeftNippleChanges(e.target.value)} className="w-full text-xs p-2 bg-white border rounded-lg">
                        <option value="">Select...</option>
                        <option value="none">No changes</option>
                        <option value="inversion">Inversion / retraction</option>
                        <option value="discharge_bloody">Bloody discharge</option>
                        <option value="discharge_clear">Clear/milky discharge</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Lump palpated on Left?</label>
                      <select value={leftLump} onChange={(e)=>setLeftLump(e.target.value)} className="w-full text-xs p-2 bg-white border rounded-lg">
                        <option value="">Select...</option>
                        <option value="no">No lump</option>
                        <option value="yes_painful">Yes, painful lump</option>
                        <option value="yes_painless">Yes, painless firm lump</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Left Armpit discomfort or swelling?</label>
                      <select value={leftArmpit} onChange={(e)=>setLeftArmpit(e.target.value)} className="w-full text-xs p-2 bg-white border rounded-lg">
                        <option value="">Select...</option>
                        <option value="no">No</option>
                        <option value="swelling">Swelling / enlargement</option>
                        <option value="tenderness">Tenderness only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Left Neck/Shoulder Discomfort?</label>
                      <select value={leftShoulderNeck} onChange={(e)=>setLeftShoulderNeck(e.target.value)} className="w-full text-xs p-2 bg-white border rounded-lg">
                        <option value="">Select...</option>
                        <option value="no">No</option>
                        <option value="yes">Yes, associated stiffness/aches</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Right Side Panel */}
                {(affectedSide === "right" || affectedSide === "both") && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <h4 className="font-bold text-sm text-primary">RIGHT Side Discomforts</h4>
                    
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Right Nipple Changes?</label>
                      <select value={rightNippleChanges} onChange={(e)=>setRightNippleChanges(e.target.value)} className="w-full text-xs p-2 bg-white border rounded-lg">
                        <option value="">Select...</option>
                        <option value="none">No changes</option>
                        <option value="inversion">Inversion / retraction</option>
                        <option value="discharge_bloody">Bloody discharge</option>
                        <option value="discharge_clear">Clear/milky discharge</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Lump palpated on Right?</label>
                      <select value={rightLump} onChange={(e)=>setRightLump(e.target.value)} className="w-full text-xs p-2 bg-white border rounded-lg">
                        <option value="">Select...</option>
                        <option value="no">No lump</option>
                        <option value="yes_painful">Yes, painful lump</option>
                        <option value="yes_painless">Yes, painless firm lump</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Right Armpit discomfort or swelling?</label>
                      <select value={rightArmpit} onChange={(e)=>setRightArmpit(e.target.value)} className="w-full text-xs p-2 bg-white border rounded-lg">
                        <option value="">Select...</option>
                        <option value="no">No</option>
                        <option value="swelling">Swelling / enlargement</option>
                        <option value="tenderness">Tenderness only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Right Neck/Shoulder Discomfort?</label>
                      <select value={rightShoulderNeck} onChange={(e)=>setRightShoulderNeck(e.target.value)} className="w-full text-xs p-2 bg-white border rounded-lg">
                        <option value="">Select...</option>
                        <option value="no">No</option>
                        <option value="yes">Yes, associated stiffness/aches</option>
                      </select>
                    </div>
                  </div>
                )}

                {(!affectedSide || affectedSide === "not_sure") && (
                  <div className="md:col-span-2 text-center py-6 text-slate-400 text-xs bg-slate-50 border rounded-2xl">
                    Side specific question panels will display when left, right, or both sides are active concerns under Section 3.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 5: Menstrual & Reproductive History */}
          {activeSection === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Section 5: Menstrual & Reproductive History</h3>
                <p className="text-xs text-slate-400 mt-1">Record reproductive history details. Choose "Prefer not to answer" if patient declines.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Menstrual Status</label>
                  <select value={menstrualStatus} onChange={(e)=>setMenstrualStatus(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring">
                    <option value="">Select status...</option>
                    <option value="regular">Regular cycle</option>
                    <option value="irregular">Irregular cycles</option>
                    <option value="postmenopausal">Postmenopausal</option>
                    <option value="prefer_not">Prefer not to answer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Age at first period (Menarche)</label>
                  <input type="number" value={menarcheAge} onChange={(e)=>setMenarcheAge(e.target.value)} placeholder="e.g. 12" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring" />
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Menopause Status</label>
                  <select value={menopauseStatus} onChange={(e)=>setMenopauseStatus(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring">
                    <option value="">Select status...</option>
                    <option value="not_applicable">Not applicable</option>
                    <option value="perimenopausal">Perimenopausal</option>
                    <option value="natural">Natural menopause</option>
                    <option value="surgical">Surgical menopause</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Age at menopause (if applicable)</label>
                  <input type="number" value={menopauseAge} onChange={(e)=>setMenopauseAge(e.target.value)} placeholder="e.g. 51" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring" />
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Pregnancy History (Number of pregnancies)</label>
                  <input type="number" value={pregnancyCount} onChange={(e)=>setPregnancyCount(e.target.value)} placeholder="e.g. 2" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring" />
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Total Breastfeeding Duration (Months cumulative)</label>
                  <input type="number" value={breastfeedingDuration} onChange={(e)=>setBreastfeedingDuration(e.target.value)} placeholder="e.g. 18" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring" />
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Current Status</label>
                  <select value={currentPregnancyStatus} onChange={(e)=>setCurrentPregnancyStatus(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring">
                    <option value="">Select status...</option>
                    <option value="none">Neither pregnant nor lactating</option>
                    <option value="pregnant">Currently Pregnant</option>
                    <option value="breastfeeding">Currently Breastfeeding</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Hormonal Contraceptive Use?</label>
                  <select value={contraceptiveUse} onChange={(e)=>setContraceptiveUse(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring">
                    <option value="">Select option...</option>
                    <option value="never">Never used</option>
                    <option value="active">Active current user</option>
                    <option value="past">Past user (stopped)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Hormone Replacement Therapy (HRT)?</label>
                  <select value={hrtUse} onChange={(e)=>setHrtUse(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring">
                    <option value="">Select option...</option>
                    <option value="no">No</option>
                    <option value="yes_estrogen">Yes, estrogen only</option>
                    <option value="yes_combined">Yes, combined estrogen/progesterone</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Previous Fertility Treatments?</label>
                  <select value={fertilityTreatment} onChange={(e)=>setFertilityTreatment(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring">
                    <option value="">Select option...</option>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: Personal Medical History */}
          {activeSection === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Section 6: Personal Medical History Checklist</h3>
                <p className="text-xs text-slate-400 mt-1">Progressive disclosure accordion panels hide dense text.</p>
              </div>

              <div className="space-y-3">
                {/* Accordion 1: Breast specific history */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setHistoryOpen(prev => ({ ...prev, conditions: !prev.conditions }))}
                    className="w-full flex justify-between items-center p-4 bg-slate-50 font-semibold text-xs text-slate-800 cursor-pointer"
                  >
                    <span>1. Prior Breast Conditions, Surgeries & Biopsies</span>
                    {historyOpen.conditions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {historyOpen.conditions && (
                    <div className="p-4 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-500 mb-1">Previous Breast Biopsies?</label>
                        <select value={prevBiopsy} onChange={(e)=>setPrevBiopsy(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg">
                          <option value="">Select...</option>
                          <option value="no">No prior biopsies</option>
                          <option value="yes_benign">Yes, benign results</option>
                          <option value="yes_atypical">Yes, atypical hyperplasia results</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-500 mb-1">Previous Benign Breast Lumps?</label>
                        <select value={prevBenignLump} onChange={(e)=>setPrevBenignLump(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg">
                          <option value="">Select...</option>
                          <option value="no">No</option>
                          <option value="yes_fibroadenoma">Yes, Fibroadenoma</option>
                          <option value="yes_cyst">Yes, Breast Cyst</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-500 mb-1">Prior Breast Surgeries?</label>
                        <select value={prevCancer} onChange={(e)=>setPrevCancer(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg">
                          <option value="">Select...</option>
                          <option value="no">No</option>
                          <option value="lumpectomy">Yes, Lumpectomy</option>
                          <option value="mastectomy">Yes, Mastectomy</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-500 mb-1">Prior Chest Radiation Exposure?</label>
                        <select value={chestRadiation} onChange={(e)=>setChestRadiation(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg">
                          <option value="">Select...</option>
                          <option value="no">No prior chest radiation</option>
                          <option value="yes_hodgkins">Yes, chest radiation therapy</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion 2: Systemic medical conditions */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setHistoryOpen(prev => ({ ...prev, procedures: !prev.procedures }))}
                    className="w-full flex justify-between items-center p-4 bg-slate-50 font-semibold text-xs text-slate-800 cursor-pointer"
                  >
                    <span>2. Chronic Systemic Conditions</span>
                    {historyOpen.procedures ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {historyOpen.procedures && (
                    <div className="p-4 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-500 mb-1">Diabetes Status</label>
                        <select value={diabetes} onChange={(e)=>setDiabetes(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg">
                          <option value="">Select...</option>
                          <option value="no">No</option>
                          <option value="type1">Type 1 Diabetes</option>
                          <option value="type2">Type 2 Diabetes</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block font-semibold text-slate-500 mb-1">Hypertension Status</label>
                        <select value={hypertension} onChange={(e)=>setHypertension(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg">
                          <option value="">Select...</option>
                          <option value="no">No</option>
                          <option value="yes_controlled">Yes, medically controlled</option>
                          <option value="yes_uncontrolled">Yes, uncontrolled</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-500 mb-1">Thyroid Condition</label>
                        <select value={thyroid} onChange={(e)=>setThyroid(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg">
                          <option value="">Select...</option>
                          <option value="no">No</option>
                          <option value="hypo">Hypothyroidism</option>
                          <option value="hyper">Hyperthyroidism</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion 3: Medications & Allergies */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setHistoryOpen(prev => ({ ...prev, other: !prev.other }))}
                    className="w-full flex justify-between items-center p-4 bg-slate-50 font-semibold text-xs text-slate-800 cursor-pointer"
                  >
                    <span>3. Meds, Allergies & Others</span>
                    {historyOpen.other ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {historyOpen.other && (
                    <div className="p-4 bg-white border-t border-slate-200 space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-500 mb-1">Current Medications</label>
                        <input
                          type="text"
                          value={currentMeds}
                          onChange={(e)=>setCurrentMeds(e.target.value)}
                          placeholder="e.g. Thyroxine 50mcg daily, Vitamin D3 weekly"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-500 mb-1">Allergies</label>
                        <input
                          type="text"
                          value={allergies}
                          onChange={(e)=>setAllergies(e.target.value)}
                          placeholder="e.g. Penicillin, Latex, None"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: Family History */}
          {activeSection === 7 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Section 7: Family Cancer History</h3>
                <p className="text-xs text-slate-400 mt-1">Gather instances of breast or ovarian cancers in direct maternal or paternal lines.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Breast Cancer in family?</label>
                  <select value={familyCancerBreast} onChange={(e)=>setFamilyCancerBreast(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm">
                    <option value="">Select option...</option>
                    <option value="no">No</option>
                    <option value="yes_first_degree">Yes, First-degree relative (Mother/Sister/Daughter)</option>
                    <option value="yes_second_degree">Yes, Second-degree relative (Grandmother/Aunt)</option>
                    <option value="not_sure">Unknown / Not sure</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Ovarian Cancer in family?</label>
                  <select value={familyCancerOvarian} onChange={(e)=>setFamilyCancerOvarian(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm">
                    <option value="">Select option...</option>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                    <option value="not_sure">Unknown / Not sure</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Specific relationship to affected relative(s)</label>
                  <input type="text" value={familyRelation} onChange={(e)=>setFamilyRelation(e.target.value)} placeholder="e.g. Maternal Grandmother" className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm" />
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Age at diagnosis (if known)</label>
                  <input type="number" value={familyDiagnosisAge} onChange={(e)=>setFamilyDiagnosisAge(e.target.value)} placeholder="e.g. 45" className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm" />
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Multiple family members affected?</label>
                  <select value={familyMultipleAffected} onChange={(e)=>setFamilyMultipleAffected(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm">
                    <option value="">Select...</option>
                    <option value="no">No</option>
                    <option value="yes">Yes, multiple relatives</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Known hereditary testing (BRCA1/BRCA2 mutation)?</label>
                  <select value={brcaTested} onChange={(e)=>setBrcaTested(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm">
                    <option value="">Select...</option>
                    <option value="untested">Not tested</option>
                    <option value="negative">Tested, negative</option>
                    <option value="positive_brca1">Tested, BRCA1 positive</option>
                    <option value="positive_brca2">Tested, BRCA2 positive</option>
                  </select>
                </div>
              </div>

              {/* Family history summary card widget */}
              {(familyCancerBreast === "yes_first_degree" || familyCancerBreast === "yes_second_degree") && (
                <div className="p-4 bg-rose-50/20 border border-rose-100 rounded-2xl flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-700 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-rose-800">Family Risk Flagged</span>
                    <p className="text-slate-500 mt-1">Patient reports breast cancer history in direct lineage ({familyRelation || "relative"}). This will be highlighted on the doctor case overview.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 8: Lifestyle and General Wellness */}
          {activeSection === 8 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Section 8: Lifestyle and General Wellness Context</h3>
                <p className="text-xs text-slate-400 mt-1">These answers capture lifestyle baseline data. They do not calculate cancer risks.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Physical Activity Frequency</label>
                  <select value={physicalActivity} onChange={(e)=>setPhysicalActivity(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm">
                    <option value="">Select...</option>
                    <option value="none">Sedentary / rare</option>
                    <option value="light">1-2 times weekly</option>
                    <option value="regular">3+ times weekly</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Smoking History</label>
                  <select value={smoking} onChange={(e)=>setSmoking(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm">
                    <option value="">Select...</option>
                    <option value="never">Never smoked</option>
                    <option value="past">Former smoker</option>
                    <option value="active">Active current smoker</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Alcohol Consumption</label>
                  <select value={alcohol} onChange={(e)=>setAlcohol(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm">
                    <option value="">Select...</option>
                    <option value="none">None / occasional</option>
                    <option value="moderate">Moderate consumption</option>
                    <option value="heavy">Frequent / heavy</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Sleep Quality</label>
                  <select value={sleepQuality} onChange={(e)=>setSleepQuality(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm">
                    <option value="">Select...</option>
                    <option value="good">Good (7-8 hours restful)</option>
                    <option value="fair">Fair / disrupted</option>
                    <option value="poor">Poor (frequent insomnia)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Stress Level</label>
                  <select value={stressLevel} onChange={(e)=>setStressLevel(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm">
                    <option value="">Select...</option>
                    <option value="low">Low stress</option>
                    <option value="moderate">Moderate daily stress</option>
                    <option value="high">High chronic stress</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Nutrition Pattern</label>
                  <select value={nutritionPattern} onChange={(e)=>setNutritionPattern(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm">
                    <option value="">Select...</option>
                    <option value="balanced">Balanced / diverse diet</option>
                    <option value="high_fat">High processed fat content</option>
                    <option value="vegetarian">Vegetarian / plant-based</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 9: Previous Screening and Reports */}
          {activeSection === 9 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Section 9: Prior Screening Reports & Uploads</h3>
                <p className="text-xs text-slate-400 mt-1">Attach historic diagnostic documentation.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Previous Mammogram?</label>
                  <select value={mammogramHistory} onChange={(e)=>setMammogramHistory(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm">
                    <option value="">Select...</option>
                    <option value="never">Never</option>
                    <option value="yes_normal">Yes, normal findings</option>
                    <option value="yes_abnormal">Yes, abnormal findings</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Previous Ultrasound?</label>
                  <select value={ultrasoundHistory} onChange={(e)=>setUltrasoundHistory(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm">
                    <option value="">Select...</option>
                    <option value="never">Never</option>
                    <option value="yes_normal">Yes, normal</option>
                    <option value="yes_abnormal">Yes, abnormal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Date of most recent screening</label>
                  <input type="date" value={lastScreeningDate} onChange={(e)=>setLastScreeningDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm" />
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Screening Facility / Hospital</label>
                  <input type="text" value={screeningFacility} onChange={(e)=>setScreeningFacility(e.target.value)} placeholder="e.g. IIT Indore Imaging Lab" className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm" />
                </div>
              </div>

              {/* Upload Files Section */}
              <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-4">
                <div className="mx-auto w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer inline-block transition-colors">
                    Upload Clinical Document (PDF / Image)
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                    />
                  </label>
                  <span className="block text-[10px] text-slate-400 mt-2">Maximum file size: 10MB</span>
                </div>
              </div>

              {/* File list with preview/remove */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">Uploaded Documents ({uploadedFiles.length})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {uploadedFiles.map(file => (
                      <div key={file.id} className="p-3 border border-slate-200 rounded-xl flex justify-between items-center gap-4 bg-slate-50">
                        <div className="truncate text-xs">
                          <span className="font-semibold text-slate-800 block truncate">{file.name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{file.date} • {file.type.toUpperCase()}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 10: Consent and Verification */}
          {activeSection === 10 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Section 10: Clinical Consent & Identity Verification</h3>
                <p className="text-xs text-slate-400 mt-1">Verify identity and record permissions. Research consent is separate and optional.</p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Consent 1 */}
                <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentCareTeam}
                    onChange={(e) => setConsentCareTeam(e.target.checked)}
                    className="w-4 h-4 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Consent for Care-Team Access</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">Authorizes the clinical team at {user?.hospitalName || "Hospital"} to review this medical assessment.</span>
                  </div>
                </label>

                {/* Consent 2 */}
                <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentReportStorage}
                    onChange={(e) => setConsentReportStorage(e.target.checked)}
                    className="w-4 h-4 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Consent for Report Storage</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">Allows files, images, and reports to be stored securely in the patient's record.</span>
                  </div>
                </label>

                {/* Consent 3 */}
                <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentResearch}
                    onChange={(e) => setConsentResearch(e.target.checked)}
                    className="w-4 h-4 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Consent for Anonymized Research Use (Optional)</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">Allows completely de-identified data to support clinical research at IIT Indore.</span>
                  </div>
                </label>

                <hr className="border-slate-100" />

                {/* Nurse verify check */}
                <label className="flex items-start gap-3 p-3 bg-rose-50/20 border border-rose-100 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nurseVerifyId}
                    onChange={(e) => setNurseVerifyId(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-primary"
                  />
                  <div>
                    <span className="font-semibold text-rose-900 block">Nurse Verification of Patient Identity *</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">I confirm that I have cross-verified the patient's identity against standard hospital registrations.</span>
                  </div>
                </label>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nurse Signature Confirmation *</label>
                  <input
                    type="text"
                    value={nurseSignName}
                    onChange={(e) => setNurseSignName(e.target.value)}
                    placeholder="Type your full name to sign, e.g. Sister Lakshmi"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-ring"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 11: Review & Submit */}
          {activeSection === 11 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Section 11: Intake Review & Submission</h3>
                <p className="text-xs text-slate-400 mt-1">Review the clinical intake summary before locking the record for review.</p>
              </div>

              {/* Validation Warnings Summary Box */}
              {getValidationWarnings().length > 0 ? (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-red-700 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Intake cannot be submitted due to missing fields:</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] text-red-600 space-y-1">
                    {getValidationWarnings().map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-emerald-800">Ready for submission</span>
                    <p className="text-slate-500 mt-1">All validation criteria have been met. You can now save draft or submit to Dr. Sarah Iyer.</p>
                  </div>
                </div>
              )}

              {/* Patient Intake Summary Table card preview */}
              <div className="p-4 border border-slate-200 rounded-2xl text-xs space-y-4">
                <h4 className="font-bold text-slate-800 border-b pb-2">Structured Intake Summary</h4>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div><span className="font-semibold text-slate-400">Name:</span> <span className="text-slate-800 font-medium">{name}</span></div>
                  <div><span className="font-semibold text-slate-400">DOB:</span> <span className="text-slate-800 font-medium">{dob}</span></div>
                  <div><span className="font-semibold text-slate-400">BMI Categories:</span> <span className="text-slate-800 font-medium">{bmiCategory.category || "Not computed"}</span></div>
                  <div><span className="font-semibold text-slate-400">Affected side:</span> <span className="text-slate-800 font-medium uppercase">{affectedSide || "None"}</span></div>
                  <div className="col-span-2"><span className="font-semibold text-slate-400">Symptoms:</span> <span className="text-slate-800 font-medium">{mainConcern.join(", ") || "None reported"}</span></div>
                  <div><span className="font-semibold text-slate-400">Duration:</span> <span className="text-slate-800 font-medium">{duration.replace(/_/g, " ")}</span></div>
                  <div><span className="font-semibold text-slate-400">Progression:</span> <span className="text-slate-800 font-medium">{progression}</span></div>
                  <div><span className="font-semibold text-slate-400">Uploaded Reports:</span> <span className="text-slate-800 font-medium">{uploadedFiles.length} files</span></div>
                  <div><span className="font-semibold text-slate-400">Verified by:</span> <span className="text-slate-800 font-medium">{nurseSignName || "Not signed"}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer Panel */}
          <div className="pt-6 border-t border-slate-100 flex justify-between gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={prevSection}
              disabled={activeSection === 1}
              className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Previous Section
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push("/nurse/dashboard")}
                className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
              >
                Save as Draft & Exit
              </button>

              {activeSection < 11 ? (
                <button
                  type="button"
                  onClick={nextSection}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl transition-all cursor-pointer focus-ring"
                >
                  Save & Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitIntake}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all cursor-pointer focus-ring"
                >
                  Submit to Doctor Review
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
