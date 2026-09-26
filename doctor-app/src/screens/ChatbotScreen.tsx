import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, getPatientDisplayName, getPatientCodeDisplay } from '../types';
import questionsData from '../services/symptoms_questions.json';
import {
  calculateClinicalRiskAnalysis,
  RiskProfileData,
} from '../services/assessmentEngine';
import { useLanguage, LanguageSwitcher } from '../i18n/LanguageContext';
import {
  PHASE_0_QUESTIONS,
  getCategoryLabel,
  getSymptomLabel,
} from '../i18n/symptomTranslations';
import { ClinicalTheme } from '../theme/clinicalTheme';
import { SpeechButton } from '../components/SpeechButton';
import { speechService, SpeechPlaybackState, QueueItem } from '../services/speechService';
import {
  formatQuestionWithOptionsSpeech,
  formatChecklistSpeech,
  formatRecordedAnswerSpeech,
  normalizeSpokenText,
} from '../services/speechTextMapper';

type Props = NativeStackScreenProps<RootStackParamList, 'Chatbot'>;

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  type?: 'text' | 'profile_choice' | 'phase1_choice' | 'fast_track_choice' | 'checklist';
  options?: { internalValue: string; label: string }[];
  category?: any;
  timestamp: string;
  phaseNumber?: number;
  stepInfo?: string;
}

export const ChatbotScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patient, assessmentId } = route.params;
  const { t, language } = useLanguage();

  const displayName = getPatientDisplayName(patient);
  const patientCode = getPatientCodeDisplay(patient);

  // Questionnaire state
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [profileStep, setProfileStep] = useState<number>(0);
  const [riskProfile, setRiskProfile] = useState<RiskProfileData>({
    age: patient.age,
  });
  const [collectedAnswers, setCollectedAnswers] = useState<Record<string, 'Yes' | 'No'>>({});
  const [selectedChecklist, setSelectedChecklist] = useState<Record<string, boolean>>({});
  const [activeChecklistCategory, setActiveChecklistCategory] = useState<any | null>(null);

  // Speech (Orpheus TTS) State
  const [speechState, setSpeechState] = useState<{
    status: SpeechPlaybackState;
    activeText: string | null;
    language: 'en' | 'hi';
    queueIndex?: number;
    queueTotal?: number;
    errorMessage?: string | null;
  }>({
    status: 'idle',
    activeText: null,
    language,
    errorMessage: null,
  });

  const scrollViewRef = useRef<ScrollView | null>(null);

  const draftStorageKey = `breastcare_draft_assessment_${assessmentId}`;

  const persistAssessmentDraft = async (
    answers: Record<string, 'Yes' | 'No'>,
    profile: RiskProfileData,
    phase: number,
    step: number
  ) => {
    try {
      await AsyncStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          assessmentId,
          patientId: patient.id,
          collectedAnswers: answers,
          riskProfile: profile,
          currentPhase: phase,
          profileStep: step,
          savedAt: new Date().toISOString(),
        })
      );
    } catch (err) {}
  };

  const handleBackToDashboard = () => {
    if (profileStep > 0 || currentPhase > 0) {
      Alert.alert(
        t('exitAssessmentTitle'),
        t('exitAssessmentMsg'),
        [
          { text: t('continueAssessment'), style: 'cancel' },
          {
            text: t('exitToDashboard'),
            style: 'destructive',
            onPress: () => navigation.navigate('Dashboard'),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // Hardware back button interceptor for Android tablet
  useEffect(() => {
    const onHardwareBack = () => {
      handleBackToDashboard();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [profileStep, currentPhase, language, collectedAnswers, riskProfile]);

  // Automatically save draft state to AsyncStorage on any clinical answer step
  useEffect(() => {
    if (profileStep > 0 || currentPhase > 0 || Object.keys(collectedAnswers).length > 0) {
      persistAssessmentDraft(collectedAnswers, riskProfile, currentPhase, profileStep);
    }
  }, [collectedAnswers, riskProfile, currentPhase, profileStep]);

  // Subscribe to speech service events & handle unmount cleanup
  useEffect(() => {
    const unsubscribe = speechService.subscribe(state => {
      setSpeechState(state);
    });
    return () => {
      unsubscribe();
      speechService.cleanup();
    };
  }, []);

  // When doctor toggles language, stop current playback and clear audio queue
  useEffect(() => {
    speechService.stop();
  }, [language]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  const addBotMessage = (text: string, type: Message['type'] = 'text', extra: Partial<Message> = {}) => {
    const msg: Message = {
      id: 'bot-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      sender: 'bot',
      text,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      phaseNumber: currentPhase,
      ...extra,
    };
    setMessages(prev => [...prev, msg]);
    scrollToBottom();
  };

  const addUserMessage = (text: string) => {
    const msg: Message = {
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      phaseNumber: currentPhase,
    };
    setMessages(prev => [...prev, msg]);
    scrollToBottom();
  };

  // Helper to determine if an interactive message is the current active prompt
  const isLatestInteractiveMessage = (msgId: string) => {
    const interactive = messages.filter(m => m.type && m.type !== 'text');
    if (interactive.length === 0) return false;
    return interactive[interactive.length - 1].id === msgId;
  };

  // Initialize clinical assessment assistant
  useEffect(() => {
    const welcome =
      language === 'hi'
        ? `नमस्ते डॉक्टर। नारीसेतु क्लीनिकल एआई सहायक सक्रिय है। हम मरीज ${displayName} (${patientCode}) का मानकीकृत 4-चरणीय ऑन्कोलॉजी मूल्यांकन आरंभ कर रहे हैं।`
        : `NariSetu Clinical Assessment Assistant initialized for patient ${displayName} (${patientCode}). Beginning standardized multi-phase clinical triage.`;

    addBotMessage(welcome, 'text');

    const overview =
      language === 'hi'
        ? 'प्रोटोकॉल अनुक्रम:\n• चरण 01: बेसलाइन जोखिम प्रोफाइल (9 प्रश्न)\n• चरण 02: प्राथमिक स्तन परीक्षण (बायां / दायां / दोनों)\n• चरण 03: क्षेत्रीय प्रसार परीक्षण (गर्दन एवं कांख)\n• चरण 04: प्रणालीगत एवं दूरस्थ परीक्षण\n• चरण 05: समग्र नैदानिक विश्लेषण'
        : 'Protocol Execution Sequence:\n• Phase 01: Baseline Risk Profile (9 Questions)\n• Phase 02: Primary Breast Screening (Left / Right / Both)\n• Phase 03: Regional Spread Screening (Neck & Armpit)\n• Phase 04: Systemic & Distant Screening\n• Phase 05: Comprehensive Clinical Risk Analysis';

    setTimeout(() => {
      addBotMessage(overview, 'text');
      setTimeout(() => {
        askProfileQuestion(0, { age: patient.age });
      }, 500);
    }, 400);
  }, []);

  // ----------------------------------------------------
  // SPEECH / TTS AUDIO ENGINE (ORPHEUS)
  // ----------------------------------------------------
  const handleListenCurrentPrompt = (msg: Message) => {
    let spokenText = '';
    if (msg.type === 'profile_choice' || msg.type === 'phase1_choice' || msg.type === 'fast_track_choice') {
      spokenText = formatQuestionWithOptionsSpeech(msg.text, msg.options, language);
    } else if (msg.type === 'checklist' && msg.category) {
      const opts = (msg.category.options || []).map((o: any) => ({
        label: getSymptomLabel(o.converted_name, o.label, language),
      }));
      spokenText = formatChecklistSpeech(msg.text, opts, language);
    } else {
      spokenText = normalizeSpokenText(msg.text, language);
    }

    speechService.speak(spokenText, language);
  };

  const handleListenAssessment = () => {
    if (speechState.queueIndex) {
      if (speechState.status === 'playing') {
        speechService.pause();
      } else if (speechState.status === 'paused') {
        speechService.resume();
      }
      return;
    }

    const queueItems: QueueItem[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (
        msg.sender === 'bot' &&
        (msg.type === 'profile_choice' ||
          msg.type === 'phase1_choice' ||
          msg.type === 'fast_track_choice' ||
          msg.type === 'checklist')
      ) {
        const userReply = messages[i + 1];
        if (userReply && userReply.sender === 'user') {
          const spokenItem = formatRecordedAnswerSpeech(msg.text, userReply.text, language);
          queueItems.push({
            id: msg.id,
            text: spokenItem,
            language,
            label: msg.stepInfo || msg.text,
          });
        }
      }
    }

    if (queueItems.length === 0) {
      speechService.speak(t('noRecordedAnswersYet'), language);
      return;
    }

    speechService.playQueue(queueItems);
  };

  const handlePauseSpeech = () => {
    speechService.pause();
  };

  const handleResumeSpeech = () => {
    speechService.resume();
  };

  const handleStopSpeech = () => {
    speechService.stop();
  };

  // ----------------------------------------------------
  // AUTOMATED TEST ENGINE (CLINICAL TEST SCENARIO FILLER)
  // ----------------------------------------------------
  const handleAutoFillAssessment = (scenario: 'low' | 'moderate' | 'urgent' = 'low') => {
    speechService.stop();
    let targetProfile: RiskProfileData;
    const targetAnswers: Record<string, 'Yes' | 'No'> = {};

    // Initialize all symptom questions to 'No'
    questionsData.forEach((cat: any) => {
      (cat.options || []).forEach((opt: any) => {
        targetAnswers[opt.converted_name] = 'No';
      });
    });

    if (scenario === 'low') {
      // Scenario A: Low / Normal Risk (30–40 years, no family history, normal lifestyle)
      targetProfile = {
        age: patient.age ? (patient.age <= 30 ? '< 30 years' : patient.age <= 40 ? '30–40 years' : '41–50 years') : '30–40 years',
        ageAtMarriage: '26–30 years',
        ageAtFirstChild: 'Age < 30 years',
        numberOfChildren: '2',
        breastfeeding: 'Yes (> 6 months)',
        contraceptives: 'Never used',
        familyHistory: 'No family history',
        smoking: 'Never smoked',
        diet: 'Vegetarian',
      };
    } else if (scenario === 'moderate') {
      // Scenario B: Moderate Risk (41–50 years, long-term contraceptives, former smoker, localized pain & swelling)
      targetProfile = {
        age: '41–50 years',
        ageAtMarriage: '20–25 years',
        ageAtFirstChild: 'Age ≥ 30 years',
        numberOfChildren: '1',
        breastfeeding: 'No / Never breastfed',
        contraceptives: 'Used > 5 years (Long-term)',
        familyHistory: 'No family history',
        smoking: 'Former smoker',
        diet: 'Non-vegetarian',
      };
      targetAnswers['Symptoms on Left Breast – Pain'] = 'Yes';
      targetAnswers['Symptoms on Neck – Swelling'] = 'Yes';
    } else {
      // Scenario C: High / Urgent Risk (Family history, palpable lump, skin dimpling, nipple retraction/discharge, systemic breathlessness)
      targetProfile = {
        age: '> 50 years',
        ageAtMarriage: '20–25 years',
        ageAtFirstChild: 'Age ≥ 30 years',
        numberOfChildren: '1',
        breastfeeding: 'No / Never breastfed',
        contraceptives: 'Used > 5 years (Long-term)',
        familyHistory: 'Yes (Mother / Sister / Daughter)',
        smoking: 'Current smoker',
        diet: 'Non-vegetarian',
      };
      targetAnswers['Symptoms on Left Breast – Palpable Lump / Abnormality'] = 'Yes';
      targetAnswers['Symptoms on Left Breast – Skin Dimpling'] = 'Yes';
      targetAnswers['Symptoms on Left Breast – Nipple Retraction / Inversion'] = 'Yes';
      targetAnswers['Symptoms on Left Breast – Nipple Discharge'] = 'Yes';
      targetAnswers['Respiratory Symptoms – Breathlessness'] = 'Yes';
    }

    setRiskProfile(targetProfile);
    setCollectedAnswers(targetAnswers);

    const scenarioLabel =
      scenario === 'low'
        ? t('autoTestScenarioA')
        : scenario === 'moderate'
        ? t('autoTestScenarioB')
        : t('autoTestScenarioC');

    addUserMessage(t('autoTestCompletedMsg', { scenario: scenarioLabel }));

    // Transition to Phase 4 (Clinical Risk Analysis & Review)
    finishToPhase4(targetAnswers);
  };

  const handleOpenAutoTestModal = () => {
    Alert.alert(
      t('autoTestTitle'),
      t('autoTestMsg'),
      [
        {
          text: t('autoTestScenarioA'),
          onPress: () => handleAutoFillAssessment('low'),
        },
        {
          text: t('autoTestScenarioB'),
          onPress: () => handleAutoFillAssessment('moderate'),
        },
        {
          text: t('autoTestScenarioC'),
          onPress: () => handleAutoFillAssessment('urgent'),
        },
        {
          text: t('cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  // ----------------------------------------------------
  // PHASE 0 — BASELINE RISK PROFILE
  // ----------------------------------------------------
  const askProfileQuestion = (step: number, currentProfile: RiskProfileData) => {
    if (step < PHASE_0_QUESTIONS.length) {
      const q = PHASE_0_QUESTIONS[step];
      const prompt = language === 'hi' ? q.promptHi : q.promptEn;
      const opts = q.options.map(o => ({
        internalValue: o.internalValue,
        label: language === 'hi' ? o.labelHi : o.labelEn,
      }));

      const stepText = t('questionOf', { current: step + 1, total: PHASE_0_QUESTIONS.length });

      addBotMessage(prompt, 'profile_choice', {
        options: opts,
        stepInfo: stepText,
      });
      setProfileStep(step);
      setCurrentPhase(0);
    } else {
      // Phase 0 Complete -> Transition to Phase 1
      startPhase1(currentProfile);
    }
  };

  const handleProfileAnswer = (opt: { internalValue: string; label: string }) => {
    speechService.stop();
    addUserMessage(opt.label);
    const q = PHASE_0_QUESTIONS[profileStep];
    let updatedProfile: RiskProfileData = { ...riskProfile, [q.key]: opt.internalValue };
    let nextStep = profileStep + 1;

    // CONDITIONAL BRANCH 1: Unmarried / Single / NA
    if (q.key === 'ageAtMarriage') {
      const val = opt.internalValue.toLowerCase();
      const isUnmarried =
        val.includes('not married') ||
        val.includes('n/a') ||
        val.includes('single') ||
        val.includes('अविवाहित');

      if (isUnmarried) {
        updatedProfile = {
          ...updatedProfile,
          ageAtFirstChild: 'No children',
          numberOfChildren: '0',
          breastfeeding: 'Never breastfed / N/A',
        };
        // Skip Q3, Q4, Q5 -> Jump directly to Q6 (index 5)
        nextStep = 5;
      }
    }

    // CONDITIONAL BRANCH 2: Married with "No children"
    if (q.key === 'ageAtFirstChild') {
      const val = opt.internalValue.toLowerCase();
      const isNoChildren =
        val.includes('no children') ||
        val.includes('कोई संतान नहीं');

      if (isNoChildren) {
        updatedProfile = {
          ...updatedProfile,
          numberOfChildren: '0',
          breastfeeding: 'Never breastfed / N/A',
        };
        // Skip Q4, Q5 -> Jump directly to Q6 (index 5)
        nextStep = 5;
      }
    }

    setRiskProfile(updatedProfile);
    setTimeout(() => {
      askProfileQuestion(nextStep, updatedProfile);
    }, 350);
  };

  // ----------------------------------------------------
  // PHASE 1 — PRIMARY BREAST SCREENING
  // ----------------------------------------------------
  const startPhase1 = (profile: RiskProfileData) => {
    setCurrentPhase(1);

    const banner =
      language === 'hi'
        ? `✓ ${t('phase01')} पूर्ण।\n\n[${t('phase02')}: ${t('primaryScreening')}]`
        : `✓ ${t('phase01')} Complete.\n\n[${t('phase02')}: ${t('primaryScreening')}]`;
    addBotMessage(banner, 'text');

    setTimeout(() => {
      const prompt = t('whichSideSymptoms');

      const options = [
        {
          internalValue: 'left',
          label: t('sideOptionLeft'),
        },
        {
          internalValue: 'right',
          label: t('sideOptionRight'),
        },
        {
          internalValue: 'both',
          label: t('sideOptionBoth'),
        },
        {
          internalValue: 'none',
          label: t('sideOptionNone'),
        },
      ];

      addBotMessage(prompt, 'phase1_choice', { options, stepInfo: t('sideSelection') });
    }, 400);
  };

  const handlePhase1SideSelect = (opt: { internalValue: string; label: string }) => {
    speechService.stop();
    addUserMessage(opt.label);
    const side = opt.internalValue;

    if (side === 'none') {
      // Set ALL Phase 1 left and right fields to "No"
      const p1Cats = (questionsData as any[]).filter(c => c.phase === 1);
      const newAnswers = { ...collectedAnswers };
      p1Cats.forEach(c => c.options.forEach((o: any) => { newAnswers[o.converted_name] = 'No'; }));
      setCollectedAnswers(newAnswers);

      const note = t('noBreastSymptomsNote');
      addBotMessage(note, 'text');

      setTimeout(() => {
        startPhase2(newAnswers);
      }, 500);
      return;
    }

    if (side === 'left') {
      // Mark all right breast questions as No, show left checklist
      const rightCat = (questionsData as any[]).find(c => c.category === 'Symptoms on Right Breast');
      const newAnswers = { ...collectedAnswers };
      rightCat?.options.forEach((o: any) => { newAnswers[o.converted_name] = 'No'; });
      setCollectedAnswers(newAnswers);

      showPhase1Checklist('left', false, newAnswers);
      return;
    }

    if (side === 'right') {
      // Mark all left breast questions as No, show right checklist
      const leftCat = (questionsData as any[]).find(c => c.category === 'Symptoms on Left Breast');
      const newAnswers = { ...collectedAnswers };
      leftCat?.options.forEach((o: any) => { newAnswers[o.converted_name] = 'No'; });
      setCollectedAnswers(newAnswers);

      showPhase1Checklist('right', false, newAnswers);
      return;
    }

    if (side === 'both') {
      // First Left, then Right
      showPhase1Checklist('left', true, collectedAnswers);
      return;
    }
  };

  const showPhase1Checklist = (
    side: 'left' | 'right',
    isBothMode: boolean,
    accumulated: Record<string, 'Yes' | 'No'>
  ) => {
    const categoryKey = side === 'left' ? 'Symptoms on Left Breast' : 'Symptoms on Right Breast';
    const sideLabel = side === 'left' ? 'Symptoms on Left Breast' : 'Symptoms on Right Breast';
    const sideLabelHi = side === 'left' ? 'बाएं स्तन पर लक्षण' : 'दाएं स्तन पर लक्षण';

    const catObj = (questionsData as any[]).find(c => c.category === categoryKey);
    const options = catObj?.options || [];

    const categoryObj = {
      category: categoryKey,
      phase: 1,
      isBothMode,
      side,
      options,
    };

    setActiveChecklistCategory(categoryObj);
    setSelectedChecklist({});

    const prompt =
      language === 'hi'
        ? `[${t('phase02')}] ${sideLabelHi}: लागू होने वाले सभी लक्षणों को चिह्नित करें:`
        : `[${t('phase02')}] ${sideLabel}: Select all applicable symptoms:`;

    addBotMessage(prompt, 'checklist', {
      category: categoryObj,
      stepInfo: side === 'left' ? (language === 'hi' ? 'बायां स्तन' : 'Left Breast') : (language === 'hi' ? 'दायां स्तन' : 'Right Breast'),
    });
  };

  // ----------------------------------------------------
  // PHASE 2 — REGIONAL SPREAD SCREENING (PHASE 03)
  // ----------------------------------------------------
  const startPhase2 = (accumulated: Record<string, 'Yes' | 'No'>) => {
    setCurrentPhase(2);

    const banner =
      language === 'hi'
        ? `${t('phase03')}: ${t('regionalSpread')}\n(गर्दन एवं कांख के लिम्फ नोड्स)`
        : `${t('phase03')}: ${t('regionalSpread')}\n(Regional Lymphatic Spread Assessment)`;
    addBotMessage(banner, 'text');

    setTimeout(() => {
      // Step 1: Neck symptoms
      showPhase2Checklist('neck', 1, accumulated);
    }, 450);
  };

  const showPhase2Checklist = (
    stepName: 'neck' | 'left_arm',
    stepNumber: number,
    accumulated: Record<string, 'Yes' | 'No'>
  ) => {
    const categoryKey = stepName === 'neck' ? 'Symptoms on Neck' : 'Symptoms on Left Arm';
    const titleEn = stepName === 'neck' ? 'Symptoms on Neck' : 'Symptoms on Left Arm';
    const titleHi = stepName === 'neck' ? 'गर्दन पर लक्षण' : 'बाईं कांख/हाथ पर लक्षण';

    const catObj = (questionsData as any[]).find(c => c.category === categoryKey);
    const options = catObj?.options || [];

    const categoryObj = {
      category: categoryKey,
      phase: 2,
      stepNumber,
      options,
    };

    setActiveChecklistCategory(categoryObj);
    setSelectedChecklist({});

    const prompt =
      language === 'hi'
        ? `[${t('phase03')} · चरण ${stepNumber}/2] ${titleHi}: लागू होने वाले लक्षण चुनें:`
        : `[${t('phase03')} · Step ${stepNumber}/2] ${titleEn}: Select all applicable symptoms:`;

    addBotMessage(prompt, 'checklist', {
      category: categoryObj,
      stepInfo: language === 'hi' ? `चरण ${stepNumber}/2: ${titleHi}` : `Step ${stepNumber}/2: ${titleEn}`,
    });
  };

  // ----------------------------------------------------
  // PHASE 3 — SYSTEMIC & DISTANT SCREENING
  // ----------------------------------------------------
  const startPhase3 = (accumulated: Record<string, 'Yes' | 'No'>) => {
    setCurrentPhase(3);

    // Rule: inspect ALL accumulated Phase 1 + Phase 2 answers
    // hasP1orP2 = any positive "Yes" finding in Left Breast, Right Breast, Neck, Left Arm
    const hasP1orP2 = Object.entries(accumulated).some(([k, v]) => {
      if (v !== 'Yes') return false;
      const isP1 = k.startsWith('lb_') || k.startsWith('rb_');
      const isP2 = k.startsWith('neck_') || k.startsWith('arm_');
      return isP1 || isP2;
    });

    const banner =
      language === 'hi'
        ? `${t('phase04')}: ${t('systemicScreening')}\n(प्रणालीगत एवं दूरस्थ प्रसार परीक्षण)`
        : `${t('phase04')}: ${t('systemicScreening')}\n(Systemic & Metastatic Clinical Screening)`;
    addBotMessage(banner, 'text');

    setTimeout(() => {
      if (!hasP1orP2) {
        // CASE A: NO POSITIVE FINDINGS -> Show Fast-Track Question
        const ftPrompt =
          language === 'hi'
            ? 'क्या आपने हाल ही में अस्पष्टीकृत खांसी, सांस फूलना, हड्डी/पीठ दर्द, या लगातार सिरदर्द का अनुभव किया है?'
            : 'Have you experienced any unexplained cough, breathlessness, bone/back pain, or persistent headaches recently?';

        const ftOptions = [
          {
            internalValue: 'fast_track_no',
            label: language === 'hi' ? '1. नहीं, इनमें से कोई नहीं' : '1. No, none of these',
          },
          {
            internalValue: 'fast_track_yes',
            label: language === 'hi' ? '2. हां, मुझे कुछ प्रणालीगत लक्षण हैं' : '2. Yes, I have some systemic symptoms',
          },
        ];

        addBotMessage(ftPrompt, 'fast_track_choice', {
          options: ftOptions,
          stepInfo: t('screeningFastTrackGate'),
        });
      } else {
        // CASE B: POSITIVE P1/P2 FINDING -> Bypasses fast-track completely
        const alertMsg =
          language === 'hi'
            ? 'प्राथमिक/क्षेत्रीय निष्कर्षों के आधार पर पूर्ण प्रणालीगत जांच प्रारंभ की जा रही है।'
            : 'Positive regional/primary finding detected. Launching complete systemic evaluation sequence.';
        addBotMessage(alertMsg, 'text');

        setTimeout(() => {
          launchPhase3Sequence(0, accumulated);
        }, 400);
      }
    }, 450);
  };

  const handleFastTrackChoice = (opt: { internalValue: string; label: string }) => {
    speechService.stop();
    addUserMessage(opt.label);

    if (opt.internalValue === 'fast_track_no') {
      // Set all Phase 3 detailed symptom fields to "No"
      const p3Cats = (questionsData as any[]).filter(c => c.phase === 3);
      const newAnswers = { ...collectedAnswers };
      p3Cats.forEach(c => c.options.forEach((o: any) => { newAnswers[o.converted_name] = 'No'; }));
      setCollectedAnswers(newAnswers);

      const note =
        language === 'hi'
          ? `प्रणालीगत परीक्षण नकारात्मक। सभी प्रणालीगत लक्षण "नहीं" के रूप में दर्ज। ${t('phase05')} पर आगे बढ़ रहे हैं।`
          : `Negative systemic screen. All detailed ${t('phase04')} symptoms marked "No". Proceeding directly to ${t('phase05')}.`;
      addBotMessage(note, 'text');

      setTimeout(() => {
        finishToPhase4(newAnswers);
      }, 500);
    } else {
      // Yes -> Launch complete Phase 3 sequence
      launchPhase3Sequence(0, collectedAnswers);
    }
  };

  const p3Categories = [
    { key: 'Respiratory Symptoms', nameEn: 'Respiratory Symptoms', nameHi: 'श्वसन संबंधी लक्षण' },
    { key: 'CNS Symptoms', nameEn: 'CNS Symptoms', nameHi: 'केंद्रीय तंत्रिका तंत्र लक्षण' },
    { key: 'Under Muscular Skeleton', nameEn: 'Under Muscular Skeleton', nameHi: 'मांसपेशी एवं अस्थि लक्षण' },
  ];

  const launchPhase3Sequence = (index: number, accumulated: Record<string, 'Yes' | 'No'>) => {
    if (index >= p3Categories.length) {
      // Complete Phase 3 -> Proceed to Phase 4
      finishToPhase4(accumulated);
      return;
    }

    const currentCat = p3Categories[index];
    const catObj = (questionsData as any[]).find(c => c.category === currentCat.key);
    const options = catObj?.options || [];

    const categoryObj = {
      category: currentCat.key,
      phase: 3,
      index,
      options,
    };

    setActiveChecklistCategory(categoryObj);
    setSelectedChecklist({});

    const prompt =
      language === 'hi'
        ? `[${t('phase04')} · भाग ${index + 1}/3] ${currentCat.nameHi}: लागू होने वाले लक्षण चुनें:`
        : `[${t('phase04')} · Part ${index + 1}/3] ${currentCat.nameEn}: Select all applicable symptoms:`;

    addBotMessage(prompt, 'checklist', {
      category: categoryObj,
      stepInfo: language === 'hi' ? `भाग ${index + 1}/3: ${currentCat.nameHi}` : `Part ${index + 1}/3: ${currentCat.nameEn}`,
    });
  };

  // ----------------------------------------------------
  // CHECKLIST SUBMISSION HANDLER
  // ----------------------------------------------------
  const toggleChecklistItem = (convertedName: string) => {
    setSelectedChecklist(prev => ({
      ...prev,
      [convertedName]: !prev[convertedName],
    }));
  };

  const handleConfirmCategory = (noneSelected: boolean = false) => {
    speechService.stop();
    if (!activeChecklistCategory) return;

    const cat = activeChecklistCategory;
    const newAnswers = { ...collectedAnswers };
    const checkedLabels: string[] = [];

    cat.options.forEach((opt: any) => {
      const isChecked = !noneSelected && !!selectedChecklist[opt.converted_name];
      newAnswers[opt.converted_name] = isChecked ? 'Yes' : 'No';
      if (isChecked) {
        checkedLabels.push(getSymptomLabel(opt.converted_name, opt.label, language));
      }
    });

    const userSummary =
      noneSelected || checkedLabels.length === 0
        ? t('noneOfTheseSummary')
        : checkedLabels.join(', ');

    addUserMessage(userSummary);
    setCollectedAnswers(newAnswers);
    setActiveChecklistCategory(null);
    setSelectedChecklist({});

    // Route based on Phase
    setTimeout(() => {
      if (cat.phase === 1) {
        if (cat.isBothMode && cat.side === 'left') {
          // Immediately show Right Breast
          showPhase1Checklist('right', false, newAnswers);
        } else {
          // Phase 1 finished -> start Phase 2
          startPhase2(newAnswers);
        }
      } else if (cat.phase === 2) {
        if (cat.stepNumber === 1) {
          // After Neck -> Left Arm
          showPhase2Checklist('left_arm', 2, newAnswers);
        } else {
          // After Left Arm -> start Phase 3
          startPhase3(newAnswers);
        }
      } else if (cat.phase === 3) {
        // Move to next category in Phase 3
        launchPhase3Sequence(cat.index + 1, newAnswers);
      }
    }, 400);
  };

  // ----------------------------------------------------
  // PHASE 4 — CLINICAL RISK ANALYSIS & REVIEW
  // ----------------------------------------------------
  const finishToPhase4 = (finalAnswers: Record<string, 'Yes' | 'No'>) => {
    speechService.stop();
    setCurrentPhase(4);

    const summaryMsg =
      language === 'hi'
        ? `✓ सभी नैदानिक चरणों के उत्तर एकत्रित कर लिए गए हैं।\n\n[${t('phase05')}: समग्र नैदानिक जोखिम स्कोरिंग इंजन निष्पादित हो रहा है...]`
        : `✓ All clinical phases completed.\n\n[${t('phase05')}: Executing Clinical Risk Scoring Engine...]`;

    addBotMessage(summaryMsg, 'text');

    setTimeout(() => {
      // Authoritative Risk Calculation with COMPLETE accumulated state
      const clinicalResult = calculateClinicalRiskAnalysis(riskProfile, finalAnswers);

      // Navigate to Review Screen
      navigation.navigate('AssessmentReview', {
        patient,
        assessmentId,
        clinicalResult,
        answersMap: finalAnswers,
        riskProfile,
      });
    }, 900);
  };

  // Calculate phase progress text and percentage
  const getPhaseProgress = () => {
    switch (currentPhase) {
      case 0:
        return {
          title: language === 'hi' ? 'बेसलाइन जोखिम प्रोफाइल' : 'BASELINE RISK PROFILE',
          step: t('questionOf', { current: Math.min(profileStep + 1, 9), total: 9 }),
          percent: ((profileStep + 1) / 9) * 100,
        };
      case 1:
        return {
          title: language === 'hi' ? 'प्राथमिक स्तन परीक्षण' : 'PRIMARY BREAST SCREENING',
          step: language === 'hi' ? 'स्तन लक्षण मूल्यांकन' : 'Clinical Symptoms Evaluation',
          percent: 35,
        };
      case 2:
        return {
          title: language === 'hi' ? 'क्षेत्रीय प्रसार परीक्षण' : 'REGIONAL SPREAD SCREENING',
          step: language === 'hi' ? 'गर्दन एवं कांख नोड्स' : 'Neck & Axillary Nodes',
          percent: 65,
        };
      case 3:
        return {
          title: language === 'hi' ? 'प्रणालीगत एवं दूरस्थ परीक्षण' : 'SYSTEMIC & DISTANT SCREENING',
          step: language === 'hi' ? 'मेटास्टेटिक प्रसार मूल्यांकन' : 'Metastatic Spread Evaluation',
          percent: 85,
        };
      default:
        return {
          title: language === 'hi' ? 'नैदानिक जोखिम विश्लेषण' : 'CLINICAL RISK ANALYSIS',
          step: language === 'hi' ? 'विश्लेषण पूर्ण' : 'Synthesizing Result',
          percent: 100,
        };
    }
  };

  const progress = getPhaseProgress();

  return (
    <View style={styles.container}>
      {/* Tablet Clinical Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeftCol}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBackToDashboard}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>← {t('backToDashboard')}</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleRow}>
            <View style={styles.monogramBox}>
              <Text style={styles.monogramText}>NS</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>{t('appTitle')}</Text>
              <Text style={styles.headerSubTitle}>{t('brandSubtitle')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.patientBadgeCard}>
          <Text style={styles.patientBadgeName} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.patientBadgeCode}>
            {patientCode} • {patient.age} {t('years')} • {patient.gender === 'Female' ? t('genderFemale') : patient.gender === 'Male' ? t('genderMale') : t('genderOther')}
          </Text>
        </View>

        <View style={styles.headerRightCol}>
          <LanguageSwitcher />
        </View>
      </View>

      {/* Sticky Phase Progress Bar */}
      <View style={styles.phaseBar}>
        <View style={styles.phaseBarContent}>
          <View style={styles.phaseTitleRow}>
            <View style={styles.phaseTag}>
              <Text style={styles.phaseTagText}>
                {language === 'hi' ? `चरण 0${currentPhase + 1}` : `PHASE 0${currentPhase + 1}`}
              </Text>
            </View>
            <Text style={styles.phaseTitleText} numberOfLines={1}>{progress.title}</Text>
            <Text style={styles.phaseStepText}>{progress.step}</Text>

            {/* Listen Assessment Secondary Action Button */}
            <TouchableOpacity
              style={[
                styles.listenAssessmentBtn,
                speechState.queueIndex ? styles.listenAssessmentBtnActive : null,
              ]}
              onPress={handleListenAssessment}
              activeOpacity={0.8}
              accessibilityLabel={
                language === 'hi'
                  ? 'संपूर्ण मूल्यांकन ऑडियो सुनें'
                  : 'Listen to complete accumulated assessment'
              }
              accessibilityRole="button"
            >
              <View style={styles.listenAssessmentIcon}>
                <View style={[styles.listenWaveBar, { height: 7 }]} />
                <View style={[styles.listenWaveBar, { height: 13 }]} />
                <View style={[styles.listenWaveBar, { height: 9 }]} />
              </View>
              <Text style={styles.listenAssessmentBtnText}>
                {t('listenAssessment')}
              </Text>
            </TouchableOpacity>

            {/* Quick Auto-Complete Test Runner */}
            <TouchableOpacity
              style={styles.autoTestBtn}
              onPress={handleOpenAutoTestModal}
              activeOpacity={0.8}
              accessibilityLabel={t('autoCompleteTest')}
              accessibilityRole="button"
            >
              <Text style={styles.autoTestBtnIcon}>⚡</Text>
              <Text style={styles.autoTestBtnText}>
                {t('autoTest')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress.percent}%` }]} />
          </View>

          {/* Sequential Queue Playback Status Banner (when active) */}
          {speechState.queueIndex ? (
            <View style={styles.queueControlStrip}>
              <View style={styles.queueInfoRow}>
                <View style={styles.queuePulseDot} />
                <Text style={styles.queueStatusText}>
                  {t('listeningQueue', { current: speechState.queueIndex || 1, total: speechState.queueTotal || 1 })}
                </Text>
              </View>
              <View style={styles.queueActionsRow}>
                {speechState.status === 'playing' ? (
                  <TouchableOpacity
                    style={styles.queueMiniBtn}
                    onPress={handlePauseSpeech}
                    accessibilityLabel={t('pausePlayback')}
                    accessibilityRole="button"
                  >
                    <Text style={styles.queueMiniBtnText}>
                      {t('pauseSpeech')}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.queueMiniBtn}
                    onPress={handleResumeSpeech}
                    accessibilityLabel={t('resumePlayback')}
                    accessibilityRole="button"
                  >
                    <Text style={styles.queueMiniBtnText}>
                      {t('resumeSpeech')}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.queueMiniBtn, styles.queueStopBtn]}
                  onPress={handleStopSpeech}
                  accessibilityLabel={t('stopPlayback')}
                  accessibilityRole="button"
                >
                  <Text style={[styles.queueMiniBtnText, styles.queueStopText]}>
                    {t('stopSpeech')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      {/* Main Clinical Assessment Chat Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={scrollToBottom}
      >
        {messages.map(msg => {
          const isBot = msg.sender === 'bot';
          const isInteractive = isLatestInteractiveMessage(msg.id);

          // 1. Doctor/Patient Recorded Response (Replaces user chat bubble)
          if (msg.sender === 'user') {
            return (
              <View key={msg.id} style={styles.recordedResponseContainer}>
                <View style={styles.recordedResponseCard}>
                  <View style={styles.recordedHeaderRow}>
                    <View style={styles.recordedBadge}>
                      <Text style={styles.recordedBadgeText}>{t('recordedClinicalResponse')}</Text>
                    </View>
                    <Text style={styles.recordedTimestamp}>{msg.timestamp}</Text>
                  </View>
                  <Text style={styles.recordedResponseValue}>✓ {msg.text}</Text>
                </View>
              </View>
            );
          }

          // 2. Transitional / System Protocol Notice (e.g. phase completion)
          if (msg.type === 'text') {
            return (
              <View key={msg.id} style={styles.protocolNoticeCard}>
                <Text style={styles.protocolNoticeText}>{msg.text}</Text>
                <Text style={styles.protocolNoticeTime}>{msg.timestamp}</Text>
              </View>
            );
          }

          // 3. Active Clinical Prompt Card (Dominates the screen)
          if (isInteractive) {
            return (
              <View key={msg.id} style={styles.activePromptCard}>
                <View style={styles.activePromptHeader}>
                  <View style={styles.activePromptBadgeRow}>
                    <View style={styles.activePromptTag}>
                      <Text style={styles.activePromptTagText}>{t('currentClinicalPrompt')}</Text>
                    </View>
                    {msg.stepInfo ? (
                      <View style={styles.activeStepTag}>
                        <Text style={styles.activeStepTagText}>{msg.stepInfo}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.promptTimestamp}>{msg.timestamp}</Text>
                </View>

                <Text style={styles.activeQuestionText}>{msg.text}</Text>

                {/* Current Clinical Question Speech Controls */}
                <View style={styles.promptSpeechWrapper}>
                  <SpeechButton
                    status={speechState.queueIndex ? 'idle' : speechState.status}
                    onListen={() => handleListenCurrentPrompt(msg)}
                    onPause={handlePauseSpeech}
                    onResume={handleResumeSpeech}
                    onStop={handleStopSpeech}
                    language={language}
                  />
                  {speechState.errorMessage && !speechState.queueIndex ? (
                    <Text style={styles.speechErrorNotice}>
                      {t('speechUnavailableNotice')}
                    </Text>
                  ) : null}
                </View>

                {/* Phase 0 Choice Buttons */}
                {msg.type === 'profile_choice' && msg.options && (
                  <View style={styles.optionsContainer}>
                    {msg.options.map((opt, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.choiceButton}
                        onPress={() => handleProfileAnswer(opt)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.choiceNumberBadge}>
                          <Text style={styles.choiceNumberText}>
                            {String(idx + 1).padStart(2, '0')}
                          </Text>
                        </View>
                        <Text style={styles.choiceButtonText}>{opt.label}</Text>
                        <View style={styles.choiceRadioDot} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Phase 1 Side Selection Buttons */}
                {msg.type === 'phase1_choice' && msg.options && (
                  <View style={styles.optionsContainer}>
                    {msg.options.map((opt, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.choiceButton}
                        onPress={() => handlePhase1SideSelect(opt)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.choiceNumberBadge}>
                          <Text style={styles.choiceNumberText}>
                            {String(idx + 1).padStart(2, '0')}
                          </Text>
                        </View>
                        <Text style={styles.choiceButtonText}>{opt.label}</Text>
                        <View style={styles.choiceRadioDot} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Phase 3 Fast-Track Selection Buttons */}
                {msg.type === 'fast_track_choice' && msg.options && (
                  <View style={styles.optionsContainer}>
                    {msg.options.map((opt, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.choiceButton,
                          opt.internalValue === 'fast_track_no' && styles.choiceButtonSuccess,
                        ]}
                        onPress={() => handleFastTrackChoice(opt)}
                        activeOpacity={0.8}
                      >
                        <View
                          style={[
                            styles.choiceNumberBadge,
                            opt.internalValue === 'fast_track_no' && styles.choiceNumberSuccess,
                          ]}
                        >
                          <Text
                            style={[
                              styles.choiceNumberText,
                              opt.internalValue === 'fast_track_no' && styles.choiceNumberTextSuccess,
                            ]}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.choiceButtonText,
                            opt.internalValue === 'fast_track_no' && styles.choiceButtonTextSuccess,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Phase 1-3 Symptom Checklist */}
                {msg.type === 'checklist' && msg.category && (
                  <View style={styles.checklistContainer}>
                    <Text style={styles.checklistHeader}>
                      {getCategoryLabel(msg.category.category, language)}
                    </Text>

                    {msg.category.options.map((opt: any) => {
                      const isSelected = !!selectedChecklist[opt.converted_name];
                      const optLabel = getSymptomLabel(opt.converted_name, opt.label, language);
                      return (
                        <TouchableOpacity
                          key={opt.converted_name}
                          style={[styles.checklistItem, isSelected && styles.checklistItemActive]}
                          onPress={() => toggleChecklistItem(opt.converted_name)}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                            {isSelected && <Text style={styles.checkmark}>✓</Text>}
                          </View>
                          <Text
                            style={[
                              styles.checklistLabel,
                              isSelected && styles.checklistLabelActive,
                            ]}
                          >
                            {optLabel}
                          </Text>
                          {isSelected && (
                            <View style={styles.selectedPill}>
                              <Text style={styles.selectedPillText}>{t('selected')}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}

                    <View style={styles.checklistActionsRow}>
                      <TouchableOpacity
                        style={styles.submitChecklistBtn}
                        onPress={() => handleConfirmCategory(false)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.submitChecklistBtnText}>
                          {t('submitSelection')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.noneChecklistBtn}
                        onPress={() => handleConfirmCategory(true)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.noneChecklistBtnText}>
                          {t('noneOfTheseApply')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          }

          // 4. Answered Previous Prompt Card (Visually recedes)
          return (
            <View key={msg.id} style={styles.answeredPromptCard}>
              <View style={styles.answeredHeaderRow}>
                <View style={styles.answeredPromptTag}>
                  <Text style={styles.answeredPromptTagText}>{t('answered')}</Text>
                </View>
                <Text style={styles.answeredTimestamp}>{msg.timestamp}</Text>
              </View>
              <Text style={styles.answeredQuestionText}>{msg.text}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ClinicalTheme.colors.background,
  },
  topHeader: {
    backgroundColor: ClinicalTheme.colors.surface,
    paddingHorizontal: ClinicalTheme.spacing.xl,
    paddingTop: 48,
    paddingBottom: ClinicalTheme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: ClinicalTheme.colors.border,
    ...ClinicalTheme.shadows.card,
  },
  headerLeftCol: {
    flex: 1,
  },
  backBtn: {
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    color: ClinicalTheme.colors.primaryAccent,
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ClinicalTheme.spacing.sm,
  },
  monogramBox: {
    width: 36,
    height: 36,
    borderRadius: ClinicalTheme.radius.sm,
    backgroundColor: ClinicalTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monogramText: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 15,
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  headerSubTitle: {
    fontSize: 12,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '500',
  },
  patientBadgeCard: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
    borderRadius: ClinicalTheme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: ClinicalTheme.spacing.md,
  },
  patientBadgeName: {
    fontSize: 14,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
  },
  patientBadgeCode: {
    fontSize: 12,
    color: ClinicalTheme.colors.primaryAccent,
    fontWeight: '700',
    marginTop: 1,
  },
  headerRightCol: {
    alignItems: 'flex-end',
  },
  phaseBar: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ClinicalTheme.colors.border,
    paddingHorizontal: ClinicalTheme.spacing.xl,
    paddingVertical: ClinicalTheme.spacing.sm,
  },
  phaseBarContent: {
    maxWidth: 860,
    alignSelf: 'center',
    width: '100%',
  },
  phaseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  phaseTag: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  phaseTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryLight,
  },
  phaseTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
    flex: 1,
    marginHorizontal: 10,
  },
  phaseStepText: {
    fontSize: 12,
    fontWeight: '700',
    color: ClinicalTheme.colors.primaryAccent,
  },
  progressTrack: {
    height: 5,
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ClinicalTheme.colors.primaryAccent,
    borderRadius: 3,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: ClinicalTheme.spacing.xl,
    maxWidth: 860,
    alignSelf: 'center',
    width: '100%',
    gap: ClinicalTheme.spacing.md,
  },
  activePromptCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: ClinicalTheme.radius.lg,
    borderWidth: 2,
    borderColor: ClinicalTheme.colors.primaryAccent,
    padding: ClinicalTheme.spacing.xl,
    ...ClinicalTheme.shadows.elevated,
    marginVertical: ClinicalTheme.spacing.sm,
  },
  activePromptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ClinicalTheme.spacing.md,
  },
  activePromptBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  activePromptTag: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: ClinicalTheme.radius.xs,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  activePromptTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryLight,
    letterSpacing: 0.5,
  },
  activeStepTag: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: ClinicalTheme.radius.xs,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  activeStepTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: ClinicalTheme.colors.textSecondary,
    letterSpacing: 0.3,
  },
  promptTimestamp: {
    fontSize: 12,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '500',
  },
  activeQuestionText: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  answeredPromptCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: ClinicalTheme.radius.md,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
    padding: ClinicalTheme.spacing.md,
    marginVertical: 4,
    opacity: 0.85,
  },
  answeredHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  answeredPromptTag: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  answeredPromptTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: ClinicalTheme.colors.textMuted,
    letterSpacing: 0.5,
  },
  answeredTimestamp: {
    fontSize: 11,
    color: ClinicalTheme.colors.textLight,
  },
  answeredQuestionText: {
    fontSize: 14,
    lineHeight: 20,
    color: ClinicalTheme.colors.textSecondary,
    fontWeight: '500',
  },
  recordedResponseContainer: {
    marginVertical: 4,
  },
  recordedResponseCard: {
    backgroundColor: ClinicalTheme.colors.secondarySoft,
    borderRadius: ClinicalTheme.radius.md,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.secondary,
    paddingHorizontal: ClinicalTheme.spacing.lg,
    paddingVertical: ClinicalTheme.spacing.md,
  },
  recordedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recordedBadge: {
    backgroundColor: ClinicalTheme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.secondary,
  },
  recordedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: ClinicalTheme.colors.secondary,
    letterSpacing: 0.5,
  },
  recordedTimestamp: {
    fontSize: 11,
    color: ClinicalTheme.colors.textMuted,
  },
  recordedResponseValue: {
    fontSize: 16,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
  },
  protocolNoticeCard: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderRadius: ClinicalTheme.radius.md,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
    padding: ClinicalTheme.spacing.md,
    marginVertical: 6,
  },
  protocolNoticeText: {
    fontSize: 14,
    lineHeight: 20,
    color: ClinicalTheme.colors.textSecondary,
    fontWeight: '500',
  },
  protocolNoticeTime: {
    fontSize: 11,
    color: ClinicalTheme.colors.textLight,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  selectedPill: {
    backgroundColor: ClinicalTheme.colors.primaryAccent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  selectedPillText: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 23,
  },
  textBot: {
    color: ClinicalTheme.colors.textPrimary,
    fontWeight: '500',
  },
  textBotActive: {
    fontSize: 21,
    lineHeight: 30,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
  },
  textUser: {
    color: ClinicalTheme.colors.textWhite,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 11,
    color: ClinicalTheme.colors.textLight,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  optionsContainer: {
    marginTop: ClinicalTheme.spacing.lg,
    gap: 8,
  },
  choiceButton: {
    minHeight: 58,
    backgroundColor: ClinicalTheme.colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: ClinicalTheme.radius.md,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  choiceNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  choiceNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: ClinicalTheme.colors.textSecondary,
  },
  choiceRadioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  choiceButtonText: {
    color: ClinicalTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  choiceButtonSuccess: {
    backgroundColor: ClinicalTheme.colors.riskLowBg,
    borderColor: ClinicalTheme.colors.riskLowBorder,
  },
  choiceNumberSuccess: {
    backgroundColor: ClinicalTheme.colors.riskLow,
    borderColor: ClinicalTheme.colors.riskLow,
  },
  choiceNumberTextSuccess: {
    color: ClinicalTheme.colors.textWhite,
  },
  choiceButtonTextSuccess: {
    color: ClinicalTheme.colors.riskLow,
    fontWeight: '700',
  },
  checklistContainer: {
    marginTop: ClinicalTheme.spacing.lg,
    gap: 8,
  },
  checklistHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: ClinicalTheme.colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checklistItem: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: ClinicalTheme.colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: ClinicalTheme.radius.md,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  checklistItemActive: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: ClinicalTheme.colors.borderMedium,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ClinicalTheme.colors.surface,
  },
  checkboxActive: {
    backgroundColor: ClinicalTheme.colors.primaryAccent,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  checkmark: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 14,
    fontWeight: '900',
  },
  checklistLabel: {
    fontSize: 15,
    color: ClinicalTheme.colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  checklistLabelActive: {
    color: ClinicalTheme.colors.textPrimary,
    fontWeight: '700',
  },
  checklistActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: ClinicalTheme.spacing.md,
  },
  submitChecklistBtn: {
    flex: 1.5,
    backgroundColor: ClinicalTheme.colors.primary,
    minHeight: 54,
    borderRadius: ClinicalTheme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    ...ClinicalTheme.shadows.card,
  },
  submitChecklistBtnText: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  noneChecklistBtn: {
    flex: 1,
    backgroundColor: ClinicalTheme.colors.surface,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    minHeight: 54,
    borderRadius: ClinicalTheme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  noneChecklistBtnText: {
    color: ClinicalTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  // TTS / Speech Styles
  promptSpeechWrapper: {
    marginBottom: ClinicalTheme.spacing.md,
    marginTop: 4,
  },
  speechErrorNotice: {
    fontSize: 12,
    color: ClinicalTheme.colors.riskUrgent,
    marginTop: 6,
    fontWeight: '600',
  },
  listenAssessmentBtn: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    borderRadius: ClinicalTheme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  listenAssessmentBtnActive: {
    borderColor: ClinicalTheme.colors.secondary,
    backgroundColor: ClinicalTheme.colors.secondarySoft,
  },
  listenAssessmentIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginRight: 6,
    height: 13,
  },
  listenWaveBar: {
    width: 2.5,
    backgroundColor: ClinicalTheme.colors.primaryAccent,
    borderRadius: 1,
  },
  listenAssessmentBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
  },
  queueControlStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.primaryAccent,
    borderRadius: ClinicalTheme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 8,
  },
  queueInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  queuePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ClinicalTheme.colors.secondary,
  },
  queueStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
  },
  queueActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  queueMiniBtn: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: ClinicalTheme.radius.sm,
    backgroundColor: ClinicalTheme.colors.surface,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  queueMiniBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
  },
  queueStopBtn: {
    borderColor: ClinicalTheme.colors.riskUrgent,
    backgroundColor: ClinicalTheme.colors.surface,
  },
  queueStopText: {
    color: ClinicalTheme.colors.riskUrgent,
  },
  autoTestBtn: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.primaryAccent,
    borderRadius: ClinicalTheme.radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginLeft: 6,
  },
  autoTestBtnIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  autoTestBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
    letterSpacing: 0.3,
  },
});
