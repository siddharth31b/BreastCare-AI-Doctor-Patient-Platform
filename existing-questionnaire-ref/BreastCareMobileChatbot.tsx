import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Platform,
  StatusBar,
  Share,
  Alert,
} from "react-native";
import {
  calculateClinicalRiskAnalysis,
  ClinicalRiskAnalysisResult,
  RiskProfileData,
  MobileQuestionnaireAnswer,
} from "../services/assessmentEngine";
import questionsData from "../services/symptoms_questions.json";
import { API_URL as DEFAULT_API_URL } from "../config";

export interface MobileChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  type?: "text" | "checklist" | "risk_report" | "profile_option";
  options?: string[];
  category?: any;
  riskResult?: ClinicalRiskAnalysisResult;
  phase?: number;
  timestamp: string;
}

interface BreastCareMobileChatbotProps {
  visible: boolean;
  onClose: () => void;
  currentUser?: { id: string; name: string; email: string } | null;
  onCompleteAssessment?: (answers: MobileQuestionnaireAnswer[], result: ClinicalRiskAnalysisResult) => void;
  onSwitchToManual?: () => void;
  apiUrl?: string;
}

const PHASE_NAMES: Record<number, string> = {
  0: "Phase 0 · Baseline Risk Profile",
  1: "Phase 1 · Primary Breast Screening",
  2: "Phase 2 · Regional Spread Screening",
  3: "Phase 3 · Systemic & Distant Screening",
  4: "Phase 4 · Clinical Risk Analysis",
};

const STATUSBAR_PADDING = Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 6 : 48;

export const BreastCareMobileChatbot: React.FC<BreastCareMobileChatbotProps> = ({
  visible,
  onClose,
  currentUser,
  onCompleteAssessment,
  onSwitchToManual,
  apiUrl = DEFAULT_API_URL,
}) => {
  const [messages, setMessages] = useState<MobileChatMessage[]>([]);
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [profileStep, setProfileStep] = useState<number>(0);
  const [riskProfile, setRiskProfile] = useState<RiskProfileData>({});
  const [collectedAnswers, setCollectedAnswers] = useState<Record<string, "Yes" | "No">>({});
  const [selectedChecklistItems, setSelectedChecklistItems] = useState<Record<string, boolean>>({});
  const [activeChecklistCategory, setActiveChecklistCategory] = useState<any | null>(null);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [finalResult, setFinalResult] = useState<ClinicalRiskAnalysisResult | null>(null);

  const scrollViewRef = useRef<ScrollView | null>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  const addBotMessage = (
    text: string,
    type: MobileChatMessage["type"] = "text",
    extra: Partial<MobileChatMessage> = {}
  ) => {
    const newMsg: MobileChatMessage = {
      id: "bot-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      sender: "bot",
      text,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ...extra,
    };
    setMessages((prev) => [...prev, newMsg]);
    scrollToBottom();
  };

  const addUserMessage = (text: string) => {
    const newMsg: MobileChatMessage = {
      id: "user-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    scrollToBottom();
  };

  // Reset and initialize chatbot
  useEffect(() => {
    if (visible) {
      setMessages([]);
      setCurrentPhase(0);
      setProfileStep(0);
      setRiskProfile({});
      setCollectedAnswers({});
      setSelectedChecklistItems({});
      setActiveChecklistCategory(null);
      setFinalResult(null);

      // Initial welcome message
      setTimeout(() => {
        addBotMessage(
          `Hello ${currentUser?.name ? currentUser.name.split(" ")[0] : "there"}! I am your BreastCare Clinical AI Assistant.`,
          "text"
        );
        addBotMessage(
          "We follow an adaptive, oncology clinical triage flow with 4 phases:\n• **Phase 0:** Risk Profile Intake\n• **Phase 1:** Primary Breast Screening (Diagnostic weight)\n• **Phase 2:** Regional Spread Screening (Neck & Armpit)\n• **Phase 3:** Systemic Screening (Respiratory, CNS, Musculoskeletal)\n• **Phase 4:** Comprehensive Risk Analysis & Clinical Staging",
          "text"
        );
        setTimeout(() => {
          addBotMessage(
            "**Phase 0: Risk Profile Intake**\nWhat is your current age group?",
            "text",
            { phase: 0 }
          );
          setCurrentSuggestions(["< 30 years", "30–40 years", "41–50 years", "> 50 years"]);
        }, 500);
      }, 300);
    }
  }, [visible]);

  // Phase 0: Profile Questions Sequence
  const PROFILE_QUESTIONS = [
    {
      key: "age",
      question: "What is your current age group?",
      options: ["< 30 years", "30–40 years", "41–50 years", "> 50 years"],
    },
    {
      key: "ageAtMarriage",
      question: "What was your age at marriage (if applicable)?",
      options: ["< 20 years", "20–25 years", "26–30 years", "> 30 years", "Not married / N/A"],
    },
    {
      key: "ageAtFirstChild",
      question: "What was your age at first childbirth?",
      options: ["No children", "Age < 30 years", "Age ≥ 30 years"],
    },
    {
      key: "numberOfChildren",
      question: "How many children do you have?",
      options: ["0", "1", "2", "3 or more"],
    },
    {
      key: "breastfeeding",
      question: "Do you have a history of breastfeeding?",
      options: ["Yes (> 6 months)", "Yes (< 6 months)", "No / Never breastfed"],
    },
    {
      key: "contraceptives",
      question: "Have you used hormonal oral contraceptives?",
      options: ["Never used", "Used < 1 year", "Used 1–5 years", "Used > 5 years (Long-term)"],
    },
    {
      key: "familyHistory",
      question: "Do you have a family history of breast or ovarian cancer?",
      options: [
        "Yes (Mother / Sister / Daughter)",
        "Yes (Aunt / Grandmother)",
        "No family history",
        "Not sure",
      ],
    },
    {
      key: "smoking",
      question: "What is your smoking status?",
      options: ["Never smoked", "Former smoker", "Current smoker"],
    },
    {
      key: "diet",
      question: "What best describes your general diet?",
      options: ["Vegetarian", "Non-vegetarian", "High-fat diet"],
    },
  ];

  const promptProfileQuestion = (stepIdx: number) => {
    if (stepIdx < PROFILE_QUESTIONS.length) {
      const q = PROFILE_QUESTIONS[stepIdx];
      addBotMessage(q.question, "text", { phase: 0 });
      setCurrentSuggestions(q.options);
    } else {
      // Phase 0 Complete -> Move to Phase 1
      setCurrentPhase(1);
      addBotMessage(
        "**Phase 0 Completed.** Baseline Risk Modifier calculated.\nNow proceeding to **Phase 1: Primary Breast Screening** (Highest diagnostic weight).\nWhich side is experiencing symptoms?",
        "text",
        { phase: 1 }
      );
      setCurrentSuggestions(["Left Breast", "Right Breast", "Both Breasts", "No breast symptoms"]);
    }
  };

  const handleProfileAnswer = (ans: string) => {
    addUserMessage(ans);
    const q = PROFILE_QUESTIONS[profileStep];
    let updatedProfile = { ...riskProfile, [q.key]: ans };
    let nextStep = profileStep + 1;

    if (q.key === "ageAtMarriage") {
      const isUnmarried = ans.toLowerCase().includes("not married") || ans.toLowerCase().includes("n/a") || ans.toLowerCase().includes("single");
      if (isUnmarried) {
        updatedProfile = {
          ...updatedProfile,
          ageAtFirstChild: "No children",
          numberOfChildren: "0",
          breastfeeding: "Never breastfed / N/A"
        };
        // Jump directly to contraceptives (index 5)
        nextStep = 5;
      }
    } else if (q.key === "ageAtFirstChild") {
      const hasNoChildren = ans.toLowerCase().includes("no children");
      if (hasNoChildren) {
        updatedProfile = {
          ...updatedProfile,
          ageAtFirstChild: "No children",
          numberOfChildren: "0",
          breastfeeding: "Never breastfed / N/A"
        };
        // Jump directly to contraceptives (index 5)
        nextStep = 5;
      }
    }

    setRiskProfile(updatedProfile);
    setProfileStep(nextStep);

    setTimeout(() => {
      promptProfileQuestion(nextStep);
    }, 400);
  };

  // Phase 1: Breast Screening
  const startPhase1Checklist = (side: "Left" | "Right" | "Both" | "None") => {
    if (side === "None") {
      addUserMessage("No breast symptoms");
      // Mark all phase 1 answers as No
      const phase1Cats = questionsData.filter((c: any) => c.phase === 1);
      const newAnswers = { ...collectedAnswers };
      phase1Cats.forEach((c: any) => {
        c.options.forEach((opt: any) => {
          newAnswers[opt.converted_name] = "No";
        });
      });
      setCollectedAnswers(newAnswers);

      addBotMessage("No primary breast symptoms reported. Moving to Phase 2: Regional Spread Screening.", "text", {
        phase: 2,
      });
      setTimeout(() => {
        startPhase2Neck();
      }, 600);
      return;
    }

    addUserMessage(`${side} Breast`);
    let categoryName = side === "Left" ? "Symptoms on Left Breast" : "Symptoms on Right Breast";
    if (side === "Both") categoryName = "Symptoms on Left Breast"; // Start with left, then right

    const cat = questionsData.find((c: any) => c.category === categoryName);
    if (cat) {
      showChecklistForCategory(cat, side === "Both" ? "Both_Step1" : "Single");
    }
  };

  const showChecklistForCategory = (cat: any, mode: string = "Single") => {
    setActiveChecklistCategory({ ...cat, mode });
    setSelectedChecklistItems({});
    addBotMessage(
      `Please select all that apply for **${cat.category}** (Ordered by clinical relevance):`,
      "checklist",
      { category: cat, phase: cat.phase }
    );
    setCurrentSuggestions(["Submit Selection", "None of these apply"]);
  };

  const toggleChecklistItem = (optName: string) => {
    setSelectedChecklistItems((prev) => ({
      ...prev,
      [optName]: !prev[optName],
    }));
  };

  const submitCurrentChecklist = (noneSelected: boolean = false) => {
    if (!activeChecklistCategory) return;

    const cat = activeChecklistCategory;
    const newAnswers = { ...collectedAnswers };
    const selectedLabels: string[] = [];

    cat.options.forEach((opt: any) => {
      if (!noneSelected && selectedChecklistItems[opt.converted_name]) {
        newAnswers[opt.converted_name] = "Yes";
        selectedLabels.push(opt.label);
      } else {
        newAnswers[opt.converted_name] = "No";
      }
    });

    setCollectedAnswers(newAnswers);

    if (noneSelected || selectedLabels.length === 0) {
      addUserMessage("None of these apply");
    } else {
      addUserMessage(`Selected: ${selectedLabels.join(", ")}`);
    }

    const currentMode = cat.mode;
    setActiveChecklistCategory(null);
    setCurrentSuggestions([]);

    setTimeout(() => {
      if (currentMode === "Both_Step1") {
        // Show Right Breast
        const rightCat = questionsData.find((c: any) => c.category === "Symptoms on Right Breast");
        if (rightCat) {
          showChecklistForCategory(rightCat, "Both_Step2");
        }
      } else if (cat.phase === 1) {
        // Proceed to Phase 2
        setCurrentPhase(2);
        addBotMessage(
          "**Phase 2: Regional Spread Screening**\nWe will now screen regional lymph node territories (Neck and Armpit).",
          "text",
          { phase: 2 }
        );
        setTimeout(() => {
          startPhase2Neck();
        }, 500);
      } else if (cat.category === "Symptoms on Neck") {
        // Proceed to Arm symptoms
        const armCat = questionsData.find((c: any) => c.category === "Symptoms on Left Arm");
        if (armCat) {
          addBotMessage("Screening axillary & arm region:", "text", { phase: 2 });
          showChecklistForCategory(armCat, "Arm");
        }
      } else if (cat.phase === 2) {
        // Proceed to Phase 3
        startPhase3(newAnswers);
      } else if (cat.phase === 3) {
        // Next phase 3 category or finish
        handleNextPhase3Category(cat, newAnswers);
      }
    }, 500);
  };

  const startPhase2Neck = () => {
    const neckCat = questionsData.find((c: any) => c.category === "Symptoms on Neck");
    if (neckCat) {
      showChecklistForCategory(neckCat, "Neck");
    }
  };

  const startPhase3 = (answers: Record<string, "Yes" | "No">) => {
    setCurrentPhase(3);

    // Check if any Phase 1 or Phase 2 findings are positive
    const hasP1orP2 = Object.entries(answers).some(([k, v]) => {
      return (
        v === "Yes" &&
        (k.includes("Breast") || k.includes("Neck") || k.includes("Arm"))
      );
    });

    if (!hasP1orP2) {
      // Fast-track triage question
      addBotMessage(
        "**Phase 3: Systemic Check**\nHave you experienced any unexplained cough, breathlessness, bone/back pain, or persistent headaches recently?",
        "text",
        { phase: 3 }
      );
      setCurrentSuggestions(["No, none of these", "Yes, I have some systemic symptoms"]);
    } else {
      addBotMessage(
        "**Phase 3: Systemic & Distant Screening**\nBecause regional or breast symptoms were noted, we will now check systemic areas (Respiratory, CNS, Musculoskeletal).",
        "text",
        { phase: 3 }
      );
      setTimeout(() => {
        const respCat = questionsData.find((c: any) => c.category === "Respiratory Symptoms");
        if (respCat) showChecklistForCategory(respCat, "Resp");
      }, 500);
    }
  };

  const handleNextPhase3Category = (currentCat: any, answers: Record<string, "Yes" | "No">) => {
    if (currentCat.category === "Respiratory Symptoms") {
      const cnsCat = questionsData.find((c: any) => c.category === "CNS Symptoms");
      if (cnsCat) {
        addBotMessage("Checking Central Nervous System (CNS) indicators:", "text", { phase: 3 });
        showChecklistForCategory(cnsCat, "CNS");
      }
    } else if (currentCat.category === "CNS Symptoms") {
      const umsCat = questionsData.find((c: any) => c.category === "Under Muscular Skeleton");
      if (umsCat) {
        addBotMessage("Checking Musculoskeletal indicators:", "text", { phase: 3 });
        showChecklistForCategory(umsCat, "UMS");
      }
    } else {
      // Phase 3 Complete -> Calculate Phase 4 Risk Report
      generatePhase4Report(answers);
    }
  };

  const generatePhase4Report = (answers: Record<string, "Yes" | "No">) => {
    setCurrentPhase(4);
    const result = calculateClinicalRiskAnalysis(riskProfile, answers);
    setFinalResult(result);

    addBotMessage(
      "**Phase 4: Risk Scoring & Clinical Analysis Complete**\nHere is your clinical risk analysis based on the Clinical Oncology Triage Algorithm:",
      "risk_report",
      { phase: 4, riskResult: result }
    );

    setCurrentSuggestions([
      "Finish & Save Assessment",
      "Share / Export Summary",
      "Re-evaluate Symptoms",
      ...(onSwitchToManual ? ["Switch to Manual Questionnaire"] : []),
    ]);
  };

  const handleSuggestionPress = (text: string) => {
    if (text === "Submit Selection") {
      submitCurrentChecklist(false);
      return;
    }

    if (text === "None of these apply") {
      submitCurrentChecklist(true);
      return;
    }

    if (currentPhase === 0 && profileStep < PROFILE_QUESTIONS.length) {
      handleProfileAnswer(text);
      return;
    }

    if (currentPhase === 1 && currentSuggestions.includes(text)) {
      if (text === "Left Breast") startPhase1Checklist("Left");
      else if (text === "Right Breast") startPhase1Checklist("Right");
      else if (text === "Both Breasts") startPhase1Checklist("Both");
      else if (text === "No breast symptoms") startPhase1Checklist("None");
      return;
    }

    if (currentPhase === 3 && (text === "No, none of these" || text === "No systemic symptoms")) {
      addUserMessage(text);
      const p3Cats = questionsData.filter((c: any) => c.phase === 3);
      const newAnswers = { ...collectedAnswers };
      p3Cats.forEach((c: any) => {
        c.options.forEach((opt: any) => {
          newAnswers[opt.converted_name] = "No";
        });
      });
      setCollectedAnswers(newAnswers);
      generatePhase4Report(newAnswers);
      return;
    }

    if (currentPhase === 3 && text === "Yes, I have some systemic symptoms") {
      addUserMessage("Yes, I have some systemic symptoms");
      const respCat = questionsData.find((c: any) => c.category === "Respiratory Symptoms");
      if (respCat) showChecklistForCategory(respCat, "Resp");
      return;
    }

    if (text === "Finish & Save Assessment") {
      handleSaveAndTransmit();
      return;
    }

    if (text === "Share / Export Summary") {
      handleShareSummary();
      return;
    }

    if (text === "Re-evaluate Symptoms") {
      addUserMessage("Re-evaluate Symptoms");
      setCurrentPhase(1);
      addBotMessage("**Phase 1: Primary Breast Screening**\nWhich breast is affected by symptoms?", "text", {
        phase: 1,
      });
      setCurrentSuggestions(["Left Breast", "Right Breast", "Both Breasts", "No breast symptoms"]);
      return;
    }

    if (text === "Switch to Manual Questionnaire" && onSwitchToManual) {
      onSwitchToManual();
      return;
    }

    addUserMessage(text);
  };

  const handleSaveAndTransmit = async () => {
    if (!finalResult) return;
    setSubmitting(true);

    const answersList: MobileQuestionnaireAnswer[] = Object.entries(collectedAnswers).map(([k, v]) => ({
      questionId: k,
      value: v,
      label: `${k}: ${v}`,
      answeredAt: new Date().toISOString(),
    }));

    try {
      const payload = {
        userId: currentUser?.id || "demo-patient",
        userName: currentUser?.name || "Demo Patient",
        answers: answersList,
        riskProfile,
        riskAnalysis: finalResult,
        status: "SUBMITTED",
        completedAt: new Date().toISOString(),
      };

      await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((e) => console.warn("Backend API sync notice:", e));

      if (onCompleteAssessment) {
        onCompleteAssessment(answersList, finalResult);
      }

      Alert.alert(
        "Assessment Saved",
        "Your clinical symptom intake has been transmitted to your doctor portal.",
        [{ text: "OK", onPress: onClose }]
      );
    } catch (e) {
      console.error("Save error", e);
      Alert.alert("Notice", "Assessment recorded locally.", [{ text: "OK", onPress: onClose }]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareSummary = async () => {
    if (!finalResult) return;
    const text = `BreastCare AI Screening Report\nPriority Tier: ${finalResult.tier}\nTotal Score: ${finalResult.totalScore} pts\nKey Findings: ${finalResult.keyFindings.join(", ") || "None"}\nRecommendation: ${finalResult.recommendation}`;
    try {
      await Share.share({ message: text });
    } catch (e) {
      console.error(e);
    }
  };

  const renderFormattedText = (text: string, isBot: boolean) => {
    const lines = text.split("\n");
    return (
      <View style={{ gap: 3 }}>
        {lines.map((line, lIdx) => {
          if (!line.trim()) return <View key={lIdx} style={{ height: 4 }} />;

          // Parse **bold** tokens
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const isBullet = line.trim().startsWith("•");

          return (
            <Text
              key={lIdx}
              style={[
                styles.msgText,
                isBot ? styles.botMsgText : styles.userMsgText,
                isBullet && { paddingLeft: 4 },
              ]}
            >
              {parts.map((part, pIdx) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  const boldContent = part.slice(2, -2);
                  return (
                    <Text
                      key={pIdx}
                      style={{
                        fontWeight: "800",
                        color: isBot ? "#0F172A" : "#FFFFFF",
                      }}
                    >
                      {boldContent}
                    </Text>
                  );
                }
                return <Text key={pIdx}>{part}</Text>;
              })}
            </Text>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
      statusBarTranslucent={false}
    >
      <View style={styles.modalRoot}>
        <StatusBar barStyle="light-content" backgroundColor="#005F56" />

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.botAvatar}>
              <Text style={styles.botAvatarText}>🧠</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>BreastCare Assistant</Text>
              <Text style={styles.headerSub}>
                {PHASE_NAMES[currentPhase] || "Clinical Phased Triage"}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* MESSAGES LIST */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => {
            const isBot = msg.sender === "bot";
            return (
              <View
                key={msg.id}
                style={[
                  styles.msgRow,
                  isBot ? styles.botMsgRow : styles.userMsgRow,
                ]}
              >
                {isBot && (
                  <View style={styles.msgAvatar}>
                    <Text style={{ fontSize: 13 }}>🩺</Text>
                  </View>
                )}

                <View
                  style={[
                    styles.msgBubble,
                    isBot ? styles.botBubble : styles.userBubble,
                  ]}
                >
                  {renderFormattedText(msg.text, isBot)}

                  {/* CHECKLIST VIEW EMBEDDED */}
                  {msg.type === "checklist" && msg.category && (
                    <View style={styles.checklistContainer}>
                      {msg.category.options.map((opt: any) => {
                        const isChecked = !!selectedChecklistItems[opt.converted_name];
                        return (
                          <TouchableOpacity
                            key={opt.converted_name}
                            style={[
                              styles.checkItemRow,
                              isChecked && styles.checkItemRowActive,
                            ]}
                            onPress={() => toggleChecklistItem(opt.converted_name)}
                            activeOpacity={0.7}
                          >
                            <View
                              style={[
                                styles.checkboxBox,
                                isChecked && styles.checkboxBoxActive,
                              ]}
                            >
                              {isChecked && <Text style={styles.checkboxCheck}>✓</Text>}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.checkItemLabel,
                                  isChecked && styles.checkItemLabelActive,
                                ]}
                              >
                                {opt.label}
                              </Text>
                              {opt.relevance && (
                                <View style={styles.relevanceTag}>
                                  <Text style={styles.relevanceTagText}>
                                    {opt.relevance === "high"
                                      ? "High Relevance · 3 pts"
                                      : opt.relevance === "medium"
                                      ? "Moderate Relevance · 2 pts"
                                      : "Low Relevance · 1 pt"}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* CLINICAL REPORT VIEW EMBEDDED */}
                  {msg.type === "risk_report" && msg.riskResult && (
                    <View style={styles.reportCard}>
                      {/* Priority Tier Header */}
                      <View
                        style={[
                          styles.tierBanner,
                          msg.riskResult.tier === "Urgent"
                            ? styles.tierUrgent
                            : msg.riskResult.tier === "High"
                            ? styles.tierHigh
                            : msg.riskResult.tier === "Moderate"
                            ? styles.tierModerate
                            : styles.tierLow,
                        ]}
                      >
                        <Text style={styles.tierBannerTitle}>
                          {msg.riskResult.tier.toUpperCase()} PRIORITY SCREENING
                        </Text>
                        <Text style={styles.tierBannerScore}>
                          Clinical Risk Score: {msg.riskResult.totalScore} pts
                        </Text>
                      </View>

                      {/* Escalation Override Alert */}
                      {msg.riskResult.override.triggered && (
                        <View style={styles.overrideAlert}>
                          <Text style={styles.overrideAlertTitle}>
                            ⚠️ Safety Override Escalation
                          </Text>
                          <Text style={styles.overrideAlertText}>
                            {msg.riskResult.override.ruleName}: {msg.riskResult.override.reason}
                          </Text>
                        </View>
                      )}

                      {/* 4-Phase Score Breakdown */}
                      <View style={styles.breakdownGrid}>
                        <View style={styles.breakdownItem}>
                          <Text style={styles.breakdownLabel}>Phase 0 (BRM)</Text>
                          <Text style={styles.breakdownVal}>
                            +{msg.riskResult.brm.score} pts
                          </Text>
                        </View>
                        <View style={styles.breakdownItem}>
                          <Text style={styles.breakdownLabel}>Phase 1 (Breast)</Text>
                          <Text style={styles.breakdownVal}>
                            {msg.riskResult.symptomScoring.phase1Score} pts
                          </Text>
                        </View>
                        <View style={styles.breakdownItem}>
                          <Text style={styles.breakdownLabel}>Phase 2 (Regional)</Text>
                          <Text style={styles.breakdownVal}>
                            {msg.riskResult.symptomScoring.phase2Score} pts
                          </Text>
                        </View>
                        <View style={styles.breakdownItem}>
                          <Text style={styles.breakdownLabel}>Phase 3 (Systemic)</Text>
                          <Text style={styles.breakdownVal}>
                            {msg.riskResult.symptomScoring.phase3Score} pts
                          </Text>
                        </View>
                      </View>

                      {/* Key Findings List */}
                      {msg.riskResult.keyFindings.length > 0 && (
                        <View style={styles.findingsBox}>
                          <Text style={styles.findingsHeading}>Key Positive Findings:</Text>
                          {msg.riskResult.keyFindings.map((f, fIdx) => (
                            <Text key={fIdx} style={styles.findingItem}>
                              • {f}
                            </Text>
                          ))}
                        </View>
                      )}

                      {/* Recommendation & Action */}
                      <View style={styles.clinicalRecBox}>
                        <Text style={styles.recHeading}>Clinical Recommendation:</Text>
                        <Text style={styles.recBody}>{msg.riskResult.recommendation}</Text>
                      </View>
                    </View>
                  )}

                  <Text
                    style={[
                      styles.msgTime,
                      isBot ? styles.botMsgTime : styles.userMsgTime,
                    ]}
                  >
                    {msg.timestamp}
                  </Text>
                </View>
              </View>
            );
          })}

          {submitting && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#005F56" />
              <Text style={styles.loadingText}>Saving clinical assessment...</Text>
            </View>
          )}
        </ScrollView>

        {/* SUGGESTIONS & ACTION BUTTONS STRIP */}
        {currentSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <View style={styles.suggestionsHeaderRow}>
              <Text style={styles.suggestionsHeader}>Choose an option:</Text>
              <Text style={styles.suggestionsCountBadge}>
                {currentSuggestions.length} options
              </Text>
            </View>

            <View style={styles.suggestionsWrap}>
              {currentSuggestions.map((sug, idx) => {
                const isPrimary =
                  sug === "Submit Selection" ||
                  sug === "Finish & Save Assessment" ||
                  sug.includes("Breast");
                const isFullWidth = currentSuggestions.length === 1 || sug.length > 28;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.suggestionBtn,
                      isPrimary && styles.suggestionBtnPrimary,
                      isFullWidth && styles.suggestionBtnFull,
                    ]}
                    onPress={() => handleSuggestionPress(sug)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.suggestionBtnText,
                        isPrimary && styles.suggestionBtnTextPrimary,
                      ]}
                      numberOfLines={2}
                    >
                      {sug}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    width: "100%",
    height: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#005F56",
    paddingTop: STATUSBAR_PADDING,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#004840",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  botAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  botAvatarText: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 11,
    color: "#A7F3D0",
    fontWeight: "500",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 14,
    paddingBottom: 24,
  },
  msgRow: {
    flexDirection: "row",
    marginBottom: 14,
    alignItems: "flex-end",
  },
  botMsgRow: {
    justifyContent: "flex-start",
  },
  userMsgRow: {
    justifyContent: "flex-end",
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E6F4F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    marginBottom: 4,
  },
  msgBubble: {
    maxWidth: "85%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  botBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  userBubble: {
    backgroundColor: "#005F56",
    borderBottomRightRadius: 4,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 19,
  },
  botMsgText: {
    color: "#1E293B",
  },
  userMsgText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  msgTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  botMsgTime: {
    color: "#94A3B8",
  },
  userMsgTime: {
    color: "rgba(255,255,255,0.75)",
  },
  checklistContainer: {
    marginTop: 10,
    gap: 8,
  },
  checkItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  checkItemRowActive: {
    backgroundColor: "#E6F4F1",
    borderColor: "#005F56",
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxBoxActive: {
    backgroundColor: "#005F56",
    borderColor: "#005F56",
  },
  checkboxCheck: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  checkItemLabel: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "600",
  },
  checkItemLabelActive: {
    color: "#005F56",
    fontWeight: "700",
  },
  badgePill: {
    marginTop: 3,
  },
  badgePillText: {
    fontSize: 9,
    color: "#64748B",
    fontWeight: "500",
  },
  reportCard: {
    marginTop: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tierBanner: {
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  tierUrgent: {
    backgroundColor: "#FFE4E6",
  },
  tierHigh: {
    backgroundColor: "#FEF3C7",
  },
  tierModerate: {
    backgroundColor: "#DBEAFE",
  },
  tierLow: {
    backgroundColor: "#D1FAE5",
  },
  tierBannerTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1E293B",
  },
  tierBannerScore: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    marginTop: 2,
  },
  overrideAlert: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FECDD3",
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  overrideAlertTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#BE123C",
  },
  overrideAlertText: {
    fontSize: 10,
    color: "#9F1239",
    marginTop: 2,
  },
  breakdownGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginVertical: 6,
  },
  breakdownItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  breakdownLabel: {
    fontSize: 9,
    color: "#64748B",
    fontWeight: "600",
  },
  breakdownVal: {
    fontSize: 11,
    color: "#0F172A",
    fontWeight: "800",
    marginTop: 2,
  },
  findingsBox: {
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  findingsHeading: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  findingItem: {
    fontSize: 10,
    color: "#475569",
    marginBottom: 2,
  },
  clinicalRecBox: {
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  recHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: "#005F56",
  },
  recBody: {
    fontSize: 11,
    color: "#334155",
    marginTop: 3,
    lineHeight: 16,
  },
  relevanceTag: {
    backgroundColor: "#E6F4F1",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  relevanceTagText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#005F56",
  },
  suggestionsContainer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 12,
    paddingHorizontal: 14,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  suggestionsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  suggestionsHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  suggestionsCountBadge: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  suggestionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  suggestionBtn: {
    width: "48%",
    paddingHorizontal: 10,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionBtnFull: {
    width: "100%",
  },
  suggestionBtnPrimary: {
    backgroundColor: "#005F56",
    borderColor: "#004D40",
  },
  suggestionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
  },
  suggestionBtnTextPrimary: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginVertical: 10,
  },
  loadingText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
});
