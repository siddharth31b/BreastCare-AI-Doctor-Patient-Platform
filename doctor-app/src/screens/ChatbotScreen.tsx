import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  BackHandler,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, getPatientDisplayName, getPatientCodeDisplay } from '../types';
import questionsData from '../services/symptoms_questions.json';
import {
  calculateClinicalRiskAnalysis,
  RiskProfileData,
} from '../services/assessmentEngine';
import { useLanguage } from '../i18n/LanguageContext';
import {
  PHASE_0_QUESTIONS,
  getCategoryLabel,
  getSymptomLabel,
} from '../i18n/symptomTranslations';
import {
  ClinicalTheme,
  SPACING,
  RADIUS,
  TOUCH_TARGETS,
  TABLET_LAYOUT,
  ACCESSIBILITY,
  INTERACTION,
  useResponsiveLayout,
} from '../theme';
import { SpeechButton } from '../components/SpeechButton';
import { speechService, SpeechPlaybackState } from '../services/speechService';
import {
  formatQuestionWithOptionsSpeech,
  formatChecklistSpeech,
  normalizeSpokenText,
  stripLeadingOptionOrdinal,
} from '../services/speechTextMapper';

type Props = NativeStackScreenProps<RootStackParamList, 'Chatbot'>;

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  secondaryText?: string;
  type?: 'text' | 'profile_choice' | 'phase1_choice' | 'fast_track_choice' | 'checklist';
  options?: { internalValue: string; label: string; secondaryLabel?: string }[];
  category?: any;
  timestamp: string;
  phaseNumber?: number;
  stepInfo?: string;
}

export const ChatbotScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patient, assessmentId } = route.params;
  const { t, language } = useLanguage();
  const { isLandscape } = useResponsiveLayout();
  const isHindi = language === 'hi';

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
  const [selectedChoiceValue, setSelectedChoiceValue] = useState<string | null>(null);

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
  const historyScrollRef = useRef<ScrollView | null>(null);

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

  // When doctor toggles language, stop current playback
  useEffect(() => {
    speechService.stop();
  }, [language]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  const addBotMessage = (
    text: string,
    type: Message['type'] = 'text',
    extra: Partial<Message> = {}
  ) => {
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
    if (
      msg.type === 'profile_choice' ||
      msg.type === 'phase1_choice' ||
      msg.type === 'fast_track_choice'
    ) {
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
  // PHASE 0 — BASELINE RISK PROFILE
  // ----------------------------------------------------
  const askProfileQuestion = (step: number, currentProfile: RiskProfileData) => {
    if (step < PHASE_0_QUESTIONS.length) {
      const q = PHASE_0_QUESTIONS[step];
      const prompt = language === 'hi' ? q.promptHi : q.promptEn;
      const secondaryPrompt = language === 'hi' ? q.promptEn : q.promptHi;

      const opts = q.options.map(o => ({
        internalValue: o.internalValue,
        label: language === 'hi' ? o.labelHi : o.labelEn,
        secondaryLabel: language === 'hi' ? o.labelEn : o.labelHi,
      }));

      const stepText = t('questionOf', {
        current: step + 1,
        total: PHASE_0_QUESTIONS.length,
      });

      setSelectedChoiceValue(null);
      addBotMessage(prompt, 'profile_choice', {
        secondaryText: secondaryPrompt,
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
    setSelectedChoiceValue(opt.internalValue);
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
      const secondaryPrompt =
        language === 'hi'
          ? 'Which side is experiencing symptoms?'
          : 'किस तरफ लक्षण अनुभव हो रहे हैं?';

      const options = [
        {
          internalValue: 'left',
          label: t('sideOptionLeft'),
          secondaryLabel: language === 'hi' ? 'Left Breast' : 'बायां स्तन',
        },
        {
          internalValue: 'right',
          label: t('sideOptionRight'),
          secondaryLabel: language === 'hi' ? 'Right Breast' : 'दायां स्तन',
        },
        {
          internalValue: 'both',
          label: t('sideOptionBoth'),
          secondaryLabel: language === 'hi' ? 'Both Breasts' : 'दोनों स्तन',
        },
        {
          internalValue: 'none',
          label: t('sideOptionNone'),
          secondaryLabel: language === 'hi' ? 'No breast symptoms' : 'कोई स्तन लक्षण नहीं',
        },
      ];

      addBotMessage(prompt, 'phase1_choice', {
        secondaryText: secondaryPrompt,
        options,
        stepInfo: t('sideSelection'),
      });
    }, 400);
  };

  const handlePhase1SideSelect = (opt: { internalValue: string; label: string }) => {
    speechService.stop();
    setSelectedChoiceValue(opt.internalValue);
    addUserMessage(opt.label);
    const side = opt.internalValue;

    if (side === 'none') {
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
      const rightCat = (questionsData as any[]).find(c => c.category === 'Symptoms on Right Breast');
      const newAnswers = { ...collectedAnswers };
      rightCat?.options.forEach((o: any) => { newAnswers[o.converted_name] = 'No'; });
      setCollectedAnswers(newAnswers);

      showPhase1Checklist('left', false, newAnswers);
      return;
    }

    if (side === 'right') {
      const leftCat = (questionsData as any[]).find(c => c.category === 'Symptoms on Left Breast');
      const newAnswers = { ...collectedAnswers };
      leftCat?.options.forEach((o: any) => { newAnswers[o.converted_name] = 'No'; });
      setCollectedAnswers(newAnswers);

      showPhase1Checklist('right', false, newAnswers);
      return;
    }

    if (side === 'both') {
      showPhase1Checklist('left', true, collectedAnswers);
      return;
    }
  };

  const showPhase1Checklist = (
    side: 'left' | 'right',
    isBothMode: boolean,
    accumulated: Record<string, 'Yes' | 'No'>
  ) => {
    setSelectedChoiceValue(null);
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

    const secondaryPrompt =
      language === 'hi'
        ? `[Phase 02] ${sideLabel}: Select all applicable symptoms:`
        : `[चरण 02] ${sideLabelHi}: लागू होने वाले सभी लक्षणों को चुनें:`;

    addBotMessage(prompt, 'checklist', {
      secondaryText: secondaryPrompt,
      category: categoryObj,
      stepInfo:
        side === 'left'
          ? language === 'hi'
            ? 'बायां स्तन'
            : 'Left Breast'
          : language === 'hi'
          ? 'दायां स्तन'
          : 'Right Breast',
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

    const secondaryPrompt =
      language === 'hi'
        ? `[Phase 03 · Step ${stepNumber}/2] ${titleEn}: Select all applicable symptoms:`
        : `[चरण 03 · चरण ${stepNumber}/2] ${titleHi}: लागू होने वाले लक्षण चुनें:`;

    addBotMessage(prompt, 'checklist', {
      secondaryText: secondaryPrompt,
      category: categoryObj,
      stepInfo:
        language === 'hi'
          ? `चरण ${stepNumber}/2: ${titleHi}`
          : `Step ${stepNumber}/2: ${titleEn}`,
    });
  };

  // ----------------------------------------------------
  // PHASE 3 — SYSTEMIC & DISTANT SCREENING
  // ----------------------------------------------------
  const startPhase3 = (accumulated: Record<string, 'Yes' | 'No'>) => {
    setCurrentPhase(3);

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
        const ftPrompt =
          language === 'hi'
            ? 'क्या आपने हाल ही में अस्पष्टीकृत खांसी, सांस फूलना, हड्डी/पीठ दर्द, या लगातार सिरदर्द का अनुभव किया है?'
            : 'Have you experienced any unexplained cough, breathlessness, bone/back pain, or persistent headaches recently?';

        const secondaryPrompt =
          language === 'hi'
            ? 'Have you experienced any unexplained cough, breathlessness, bone/back pain, or persistent headaches recently?'
            : 'क्या आपने हाल ही में अस्पष्टीकृत खांसी, सांस फूलना, हड्डी/पीठ दर्द, या सिरदर्द का अनुभव किया है?';

        const ftOptions = [
          {
            internalValue: 'fast_track_no',
            label: language === 'hi' ? '1. नहीं, इनमें से कोई नहीं' : '1. No, none of these',
            secondaryLabel: language === 'hi' ? 'No, none of these' : 'नहीं, इनमें से कोई नहीं',
          },
          {
            internalValue: 'fast_track_yes',
            label: language === 'hi' ? '2. हां, मुझे कुछ प्रणालीगत लक्षण हैं' : '2. Yes, I have some systemic symptoms',
            secondaryLabel: language === 'hi' ? 'Yes, systemic symptoms present' : 'हां, प्रणालीगत लक्षण हैं',
          },
        ];

        addBotMessage(ftPrompt, 'fast_track_choice', {
          secondaryText: secondaryPrompt,
          options: ftOptions,
          stepInfo: t('screeningFastTrackGate'),
        });
      } else {
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
    setSelectedChoiceValue(opt.internalValue);
    addUserMessage(opt.label);

    if (opt.internalValue === 'fast_track_no') {
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

    const secondaryPrompt =
      language === 'hi'
        ? `[Phase 04 · Part ${index + 1}/3] ${currentCat.nameEn}: Select all applicable symptoms:`
        : `[चरण 04 · भाग ${index + 1}/3] ${currentCat.nameHi}: लागू होने वाले लक्षण चुनें:`;

    addBotMessage(prompt, 'checklist', {
      secondaryText: secondaryPrompt,
      category: categoryObj,
      stepInfo:
        language === 'hi'
          ? `भाग ${index + 1}/3: ${currentCat.nameHi}`
          : `Part ${index + 1}/3: ${currentCat.nameEn}`,
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
          showPhase1Checklist('right', false, newAnswers);
        } else {
          startPhase2(newAnswers);
        }
      } else if (cat.phase === 2) {
        if (cat.stepNumber === 1) {
          showPhase2Checklist('left_arm', 2, newAnswers);
        } else {
          startPhase3(newAnswers);
        }
      } else if (cat.phase === 3) {
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
      const clinicalResult = calculateClinicalRiskAnalysis(riskProfile, finalAnswers);

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

  // Find latest interactive bot prompt
  const interactiveMessages = messages.filter(m => m.type && m.type !== 'text');
  const activePromptMsg =
    interactiveMessages.length > 0
      ? interactiveMessages[interactiveMessages.length - 1]
      : null;

  // Historical items
  const historyItems = activePromptMsg
    ? messages.filter(m => m.id !== activePromptMsg.id)
    : messages;

  const recordedAnswersCount = historyItems.filter(m => m.sender === 'user').length;
  const selectedSymptomsCount = Object.values(selectedChecklist).filter(Boolean).length;

  return (
    <View style={styles.container}>
      {/* ============================================================ */}
      {/* 1. CLINICAL HEADER BAR                                       */}
      {/* ============================================================ */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeftCol}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBackToDashboard}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('backToDashboard')}
            hitSlop={ACCESSIBILITY.hitSlop}
          >
            <Text style={styles.backBtnText}>← {t('backToDashboard')}</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleRow}>
            <View style={styles.monogramBox}>
              <Text style={styles.monogramText}>BC</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>BreastCare AI</Text>
              <Text style={styles.headerSubTitle}>
                {language === 'hi' ? 'नैदानिक मूल्यांकन वर्कस्टेशन' : 'Clinical Assessment Workstation'}
              </Text>
            </View>
          </View>
        </View>

        {/* Header Badges: Patient, Phase, Status */}
        <View style={styles.headerBadgesRow}>
          <View style={styles.headerPhaseBadge}>
            <Text style={styles.headerPhaseBadgeText}>
              {language === 'hi' ? `चरण 0${currentPhase + 1} / 05` : `Phase 0${currentPhase + 1} / 05`}
            </Text>
          </View>
          <View style={styles.headerStatusBadge}>
            <Text style={styles.headerStatusBadgeText}>
              ● {language === 'hi' ? 'सक्रिय' : 'IN PROGRESS'}
            </Text>
          </View>
        </View>
      </View>

      {/* ============================================================ */}
      {/* 2. PATIENT / PROTOCOL CONTEXT STRIP                          */}
      {/* ============================================================ */}
      <View style={styles.patientContextStrip}>
        <View style={styles.contextStripLeft}>
          <View style={styles.contextCodeTag}>
            <Text style={styles.contextCodeText}>{patientCode}</Text>
          </View>
          <Text style={styles.contextPatientText} numberOfLines={1}>
            {displayName} • {patient.age} {t('years')} • {patient.gender === 'Female' ? t('genderFemale') : patient.gender === 'Male' ? t('genderMale') : t('genderOther')}
          </Text>
        </View>

        <View style={styles.contextStripRight}>
          <Text style={styles.contextPhaseNameText} numberOfLines={1}>
            {progress.title}
          </Text>
          <View style={styles.contextStepPill}>
            <Text style={styles.contextStepPillText}>
              {activePromptMsg?.stepInfo || progress.step}
            </Text>
          </View>
        </View>
      </View>

      {/* ============================================================ */}
      {/* 3. WORKSTATION MAIN BODY: 68% / 32% SPLIT                    */}
      {/* ============================================================ */}
      <View style={isLandscape ? styles.bodyLandscape : styles.bodyPortrait}>
        {/* ------------------------------------------------------------ */}
        {/* LEFT / MAIN WORKSTATION: ACTIVE QUESTION (~68%)              */}
        {/* ------------------------------------------------------------ */}
        <View style={isLandscape ? styles.questionColLandscape : styles.questionColPortrait}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.questionScroll}
            contentContainerStyle={styles.questionScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activePromptMsg ? (
              <View style={styles.activeQuestionCard}>
                {/* Hierarchy Header */}
                <View style={styles.questionHierarchyHeader}>
                  <View style={styles.hierarchyBadgeGroup}>
                    <View style={styles.smallQuestionLabelPill}>
                      <Text style={styles.smallQuestionLabelText}>
                        {isHindi ? 'वर्तमान प्रश्न' : 'CURRENT QUESTION'}
                      </Text>
                    </View>
                    <View style={styles.phaseHierarchyPill}>
                      <Text style={styles.phaseHierarchyText}>
                        {isHindi ? `चरण 0${currentPhase + 1}` : `PHASE 0${currentPhase + 1}`}
                      </Text>
                    </View>
                    {activePromptMsg.stepInfo ? (
                      <View style={styles.stepHierarchyPill}>
                        <Text style={styles.stepHierarchyText}>{activePromptMsg.stepInfo}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.timestampBadge}>{activePromptMsg.timestamp}</Text>
                </View>

                {/* Main Question Text (22–26dp, large & readable) */}
                <Text style={[styles.mainQuestionText, isHindi && styles.hindiMainQuestion]}>
                  {activePromptMsg.text}
                </Text>

                {/* Secondary Localized Question (Hindi/English Translation) */}
                {activePromptMsg.secondaryText && activePromptMsg.secondaryText !== activePromptMsg.text ? (
                  <Text style={[styles.secondaryQuestionText, !isHindi && styles.hindiSecondaryQuestion]}>
                    {activePromptMsg.secondaryText}
                  </Text>
                ) : null}

                {/* Question-Level Speech Audio Controller (Listen Prompt) */}
                <View style={styles.speechControllerRow}>
                  <SpeechButton
                    status={speechState.status}
                    onListen={() => handleListenCurrentPrompt(activePromptMsg)}
                    onPause={handlePauseSpeech}
                    onResume={handleResumeSpeech}
                    onStop={handleStopSpeech}
                    language={language}
                  />
                  {speechState.errorMessage ? (
                    <Text style={styles.speechErrorNotice}>
                      {t('speechUnavailableNotice')}
                    </Text>
                  ) : null}
                </View>

                {/* -------------------------------------------------------- */}
                {/* 2-COLUMN OPTION CARDS (Phase 0, Phase 1, Phase 3 Choices) */}
                {/* -------------------------------------------------------- */}
                {(activePromptMsg.type === 'profile_choice' ||
                  activePromptMsg.type === 'phase1_choice' ||
                  activePromptMsg.type === 'fast_track_choice') &&
                  activePromptMsg.options && (
                    <View style={isLandscape ? styles.optionsGridLandscape : styles.optionsGridPortrait}>
                      {activePromptMsg.options.map((opt, idx) => {
                        const isSelected = selectedChoiceValue === opt.internalValue;
                        const isFastTrackNo = opt.internalValue === 'fast_track_no';

                        const handleSelect = () => {
                          if (activePromptMsg.type === 'profile_choice') {
                            handleProfileAnswer(opt);
                          } else if (activePromptMsg.type === 'phase1_choice') {
                            handlePhase1SideSelect(opt);
                          } else if (activePromptMsg.type === 'fast_track_choice') {
                            handleFastTrackChoice(opt);
                          }
                        };

                        const formattedIndex = String(idx + 1).padStart(2, '0');

                        return (
                          <TouchableOpacity
                            key={idx}
                            style={[
                              styles.optionCard,
                              isLandscape && styles.optionCardGrid,
                              isSelected && styles.optionCardSelected,
                              isFastTrackNo && styles.optionCardFastTrackNo,
                            ]}
                            onPress={handleSelect}
                            activeOpacity={INTERACTION.pressOpacity}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected }}
                            accessibilityLabel={`Option ${idx + 1}: ${opt.label}${isSelected ? ', selected' : ''}`}
                          >
                            {/* Card Top Row: Index Badge + Selection Indicator */}
                            <View style={styles.optionCardTopRow}>
                              <View style={[styles.ordinalBadge, isSelected && styles.ordinalBadgeSelected]}>
                                <Text style={[styles.ordinalBadgeText, isSelected && styles.ordinalBadgeTextSelected]}>
                                  {formattedIndex}
                                </Text>
                              </View>

                              <View style={[styles.radioIndicator, isSelected && styles.radioIndicatorSelected]}>
                                {isSelected ? (
                                  <Text style={styles.radioCheckmark}>✓</Text>
                                ) : (
                                  <View style={styles.radioHollowDot} />
                                )}
                              </View>
                            </View>

                            {/* Card Middle: Primary Option Text */}
                            <Text
                              style={[
                                styles.optionCardTitle,
                                isSelected && styles.optionCardTitleSelected,
                                isHindi && styles.hindiOptionTitle,
                              ]}
                            >
                              {stripLeadingOptionOrdinal(opt.label)}
                            </Text>

                            {/* Card Bottom: Secondary Label or Selected State */}
                            {opt.secondaryLabel && opt.secondaryLabel !== opt.label ? (
                              <Text style={styles.optionCardSecondary}>
                                {stripLeadingOptionOrdinal(opt.secondaryLabel)}
                              </Text>
                            ) : null}

                            {isSelected && (
                              <View style={styles.explicitSelectedRow}>
                                <Text style={styles.explicitSelectedText}>
                                  ✓ {isHindi ? 'चयनित (SELECTED)' : 'SELECTED'}
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                {/* -------------------------------------------------------- */}
                {/* MULTI-SELECT CHECKLIST CARDS (Phases 1-3 Symptoms)       */}
                {/* -------------------------------------------------------- */}
                {activePromptMsg.type === 'checklist' && activePromptMsg.category && (
                  <View style={styles.checklistSection}>
                    <View style={styles.checklistInstructionStrip}>
                      <Text style={[styles.checklistInstructionText, isHindi && styles.hindiText]}>
                        {isHindi ? 'लागू होने वाले सभी लक्षणों को चुनें:' : 'SELECT ALL THAT APPLY:'}
                      </Text>
                      <Text style={styles.checklistCategoryTag}>
                        {getCategoryLabel(activePromptMsg.category.category, language)}
                      </Text>
                    </View>

                    <View style={styles.checklistCardsList}>
                      {activePromptMsg.category.options.map((opt: any) => {
                        const isSelected = !!selectedChecklist[opt.converted_name];
                        const optLabel = getSymptomLabel(opt.converted_name, opt.label, language);

                        return (
                          <TouchableOpacity
                            key={opt.converted_name}
                            style={[
                              styles.checklistCard,
                              isSelected && styles.checklistCardActive,
                            ]}
                            onPress={() => toggleChecklistItem(opt.converted_name)}
                            activeOpacity={INTERACTION.pressOpacity}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: isSelected }}
                            accessibilityLabel={`${optLabel}, ${isSelected ? 'selected' : 'unselected'}`}
                          >
                            <View style={[styles.checkboxSquare, isSelected && styles.checkboxSquareActive]}>
                              {isSelected ? (
                                <Text style={styles.checkboxCheckmark}>✓</Text>
                              ) : null}
                            </View>

                            <Text
                              style={[
                                styles.checklistCardLabel,
                                isSelected && styles.checklistCardLabelActive,
                                isHindi && styles.hindiText,
                              ]}
                            >
                              {optLabel}
                            </Text>

                            {isSelected ? (
                              <View style={styles.selectedChecklistPill}>
                                <Text style={styles.selectedChecklistPillText}>
                                  ✓ {isHindi ? 'चयनित' : 'SELECTED'}
                                </Text>
                              </View>
                            ) : null}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.systemStatusCard}>
                <Text style={styles.systemStatusTitle}>
                  {isHindi ? 'मूल्यांकन आरंभ हो रहा है...' : 'Initializing Assessment Session...'}
                </Text>
                <Text style={styles.systemStatusSub}>
                  {isHindi
                    ? 'कृपया प्रतीक्षा करें, क्लिनिकल प्रश्न लोड हो रहे हैं।'
                    : 'Please stand by while the clinical diagnostic sequence loads.'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* ------------------------------------------------------------ */}
        {/* RIGHT / CONTEXT PANEL: SESSION CONTEXT (~32%)                */}
        {/* ------------------------------------------------------------ */}
        <View style={isLandscape ? styles.contextColLandscape : styles.contextColPortrait}>
          {/* Progress Summary Metric Card */}
          <View style={styles.progressSummaryCard}>
            <View style={styles.progressSummaryHead}>
              <Text style={[styles.summaryHeadTitle, isHindi && styles.hindiText]}>
                {isHindi ? 'मूल्यांकन प्रगति' : 'SESSION PROGRESS'}
              </Text>
              <Text style={styles.summaryHeadPercent}>{Math.round(progress.percent)}%</Text>
            </View>

            <View style={styles.summaryBarTrack}>
              <View style={[styles.summaryBarFill, { width: `${progress.percent}%` }]} />
            </View>

            <View style={styles.metricCountsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>{isHindi ? 'दर्ज उत्तर' : 'Answered'}</Text>
                <Text style={styles.metricValue}>{recordedAnswersCount}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>{isHindi ? 'वर्तमान चरण' : 'Phase Status'}</Text>
                <Text style={styles.metricValue}>0{currentPhase + 1} / 05</Text>
              </View>
            </View>
          </View>

          {/* 5-Phase Protocol Timeline Tracker */}
          <View style={styles.protocolTrackerCard}>
            <Text style={[styles.trackerHeadTitle, isHindi && styles.hindiText]}>
              {isHindi ? '5-चरणीय ऑन्कोलॉजी प्रोटोकॉल' : '5-PHASE CLINICAL PROTOCOL'}
            </Text>

            <View style={styles.protocolPhasesList}>
              {[
                { phaseNum: 0, labelEn: '01 Baseline Risk Profile', labelHi: '01 बेसलाइन जोखिम प्रोफाइल' },
                { phaseNum: 1, labelEn: '02 Primary Breast Screening', labelHi: '02 प्राथमिक स्तन परीक्षण' },
                { phaseNum: 2, labelEn: '03 Regional Spread Screening', labelHi: '03 क्षेत्रीय प्रसार परीक्षण' },
                { phaseNum: 3, labelEn: '04 Systemic & Distant', labelHi: '04 प्रणालीगत एवं दूरस्थ' },
                { phaseNum: 4, labelEn: '05 Clinical Risk Analysis', labelHi: '05 समग्र जोखिम विश्लेषण' },
              ].map(p => {
                const isActive = currentPhase === p.phaseNum;
                const isCompleted = currentPhase > p.phaseNum;
                const isQueued = currentPhase < p.phaseNum;

                return (
                  <View
                    key={p.phaseNum}
                    style={[
                      styles.protocolPhaseRow,
                      isActive && styles.protocolPhaseRowActive,
                      isCompleted && styles.protocolPhaseRowCompleted,
                    ]}
                  >
                    <View
                      style={[
                        styles.protocolStatusDot,
                        isActive && styles.protocolStatusDotActive,
                        isCompleted && styles.protocolStatusDotCompleted,
                        isQueued && styles.protocolStatusDotQueued,
                      ]}
                    >
                      {isCompleted ? (
                        <Text style={styles.protocolCheckmark}>✓</Text>
                      ) : null}
                    </View>

                    <Text
                      style={[
                        styles.protocolPhaseTitle,
                        isActive && styles.protocolPhaseTitleActive,
                        isCompleted && styles.protocolPhaseTitleCompleted,
                        isHindi && styles.hindiText,
                      ]}
                      numberOfLines={1}
                    >
                      {isHindi ? p.labelHi : p.labelEn}
                    </Text>

                    <View
                      style={[
                        styles.phaseStatePill,
                        isActive && styles.phaseStatePillActive,
                        isCompleted && styles.phaseStatePillCompleted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.phaseStatePillText,
                          isActive && styles.phaseStatePillTextActive,
                          isCompleted && styles.phaseStatePillTextCompleted,
                        ]}
                      >
                        {isActive
                          ? isHindi ? '● सक्रिय' : '● ACTIVE'
                          : isCompleted
                          ? isHindi ? '✓ पूर्ण' : '✓ DONE'
                          : isHindi ? '○ प्रतीक्षित' : '○ QUEUED'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Historical Recorded Responses Log */}
          <View style={styles.recentHistoryCard}>
            <View style={styles.recentHistoryHead}>
              <Text style={[styles.recentHistoryTitle, isHindi && styles.hindiText]}>
                {isHindi ? 'हाल ही में दर्ज उत्तर' : 'RECENT RESPONSES'}
              </Text>
              <Text style={styles.recentHistoryCounter}>
                {recordedAnswersCount} {isHindi ? 'दर्ज' : 'items'}
              </Text>
            </View>

            <ScrollView
              ref={historyScrollRef}
              style={styles.recentHistoryScroll}
              contentContainerStyle={styles.recentHistoryContent}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
            >
              {historyItems.length === 0 ? (
                <Text style={styles.emptyHistoryMsg}>
                  {isHindi ? 'कोई पूर्व उत्तर दर्ज नहीं है।' : 'No responses recorded yet.'}
                </Text>
              ) : (
                historyItems.map(msg => {
                  if (msg.sender === 'user') {
                    return (
                      <View key={msg.id} style={styles.historyAnswerCard}>
                        <View style={styles.historyAnswerTopRow}>
                          <Text style={styles.historyCheckIcon}>✓</Text>
                          <Text style={styles.historyAnswerTag}>{isHindi ? 'दर्ज उत्तर' : 'Recorded'}</Text>
                          <Text style={styles.historyAnswerTime}>{msg.timestamp}</Text>
                        </View>
                        <Text style={styles.historyAnswerValue}>{msg.text}</Text>
                      </View>
                    );
                  }

                  if (msg.type === 'text') {
                    return (
                      <View key={msg.id} style={styles.historyNoticePill}>
                        <Text style={styles.historyNoticeMsg}>{msg.text}</Text>
                      </View>
                    );
                  }

                  return (
                    <View key={msg.id} style={styles.historyPromptItem}>
                      <Text style={styles.historyPromptLabel} numberOfLines={1}>
                        Q: {msg.stepInfo || 'Prompt'}
                      </Text>
                      <Text style={styles.historyPromptText} numberOfLines={2}>
                        {msg.text}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* ============================================================ */}
      {/* 4. STABLE BOTTOM ACTION BAR (76dp height)                    */}
      {/* ============================================================ */}
      <View style={styles.bottomActionBar}>
        {/* Left: Back Button (56dp) */}
        <TouchableOpacity
          style={styles.bottomBackBtn}
          onPress={handleBackToDashboard}
          activeOpacity={INTERACTION.pressOpacity}
          accessibilityRole="button"
          accessibilityLabel={t('backToDashboard')}
          hitSlop={ACCESSIBILITY.hitSlop}
        >
          <Text style={styles.bottomBackBtnText}>← {isHindi ? 'डैशबोर्ड' : 'Back'}</Text>
        </TouchableOpacity>

        {/* Center: Question Progress & Phase Status */}
        <View style={styles.bottomCenterCol}>
          <Text style={styles.bottomProgressTitle} numberOfLines={1}>
            {progress.title}
          </Text>
          <Text style={styles.bottomProgressSubtitle}>
            {activePromptMsg?.stepInfo || progress.step} • {Math.round(progress.percent)}% {isHindi ? 'पूर्ण' : 'Complete'}
          </Text>
        </View>

        {/* Right: Checklist Actions or Touch Prompt */}
        <View style={styles.bottomRightCol}>
          {activePromptMsg?.type === 'checklist' ? (
            <View style={styles.checklistBottomActions}>
              <TouchableOpacity
                style={styles.noneApplyActionBtn}
                onPress={() => handleConfirmCategory(true)}
                activeOpacity={INTERACTION.pressOpacity}
                accessibilityRole="button"
                accessibilityLabel={isHindi ? 'कोई लागू नहीं' : 'None Apply'}
              >
                <Text style={[styles.noneApplyActionText, isHindi && styles.hindiText]}>
                  {isHindi ? 'कोई लागू नहीं' : 'None Apply'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmSelectionActionBtn}
                onPress={() => handleConfirmCategory(false)}
                activeOpacity={INTERACTION.pressOpacity}
                accessibilityRole="button"
                accessibilityLabel={isHindi ? 'चयन की पुष्टि करें' : 'CONFIRM SELECTION'}
              >
                <Text style={[styles.confirmSelectionActionText, isHindi && styles.hindiText]}>
                  {isHindi ? 'चयन की पुष्टि करें →' : 'CONFIRM SELECTION →'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.selectionGuidePill}>
              <Text style={[styles.selectionGuideText, isHindi && styles.hindiText]}>
                {selectedChoiceValue
                  ? isHindi ? '✓ उत्तर सहेजा जा रहा है...' : '✓ Recording answer...'
                  : isHindi ? 'एक विकल्प चुनें →' : 'Select an option to advance →'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ClinicalTheme.colors.background,
  },

  // -------------------------------------------------------------
  // TOP CLINICAL HEADER BAR
  // -------------------------------------------------------------
  topHeader: {
    backgroundColor: ClinicalTheme.colors.surface,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 10,
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
    gap: 10,
  },
  monogramBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: ClinicalTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monogramText: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 14,
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubTitle: {
    fontSize: 12,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  headerBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerPhaseBadge: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  headerPhaseBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: ClinicalTheme.colors.textSecondary,
  },
  headerStatusBadge: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  headerStatusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
  },

  // -------------------------------------------------------------
  // PATIENT / PROTOCOL CONTEXT STRIP
  // -------------------------------------------------------------
  patientContextStrip: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    paddingHorizontal: 24,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: ClinicalTheme.colors.borderDefault,
  },
  contextStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  contextCodeTag: {
    backgroundColor: ClinicalTheme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  contextCodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
  },
  contextPatientText: {
    fontSize: 13,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
  },
  contextStripRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contextPhaseNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: ClinicalTheme.colors.textSecondary,
  },
  contextStepPill: {
    backgroundColor: ClinicalTheme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  contextStepPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
  },

  // -------------------------------------------------------------
  // MAIN BODY WORKSPACE (68% / 32% SPLIT IN LANDSCAPE)
  // -------------------------------------------------------------
  bodyLandscape: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 16,
  },
  bodyPortrait: {
    flex: 1,
    flexDirection: 'column',
    padding: 12,
    gap: 12,
  },
  questionColLandscape: {
    flex: 0.68,
  },
  questionColPortrait: {
    flex: 1,
  },
  contextColLandscape: {
    flex: 0.32,
    gap: 10,
  },
  contextColPortrait: {
    gap: 10,
  },

  // -------------------------------------------------------------
  // ACTIVE QUESTION WORKSTATION (LEFT COLUMN)
  // -------------------------------------------------------------
  questionScroll: {
    flex: 1,
  },
  questionScrollContent: {
    paddingBottom: 24,
  },
  activeQuestionCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    borderTopWidth: 4,
    borderTopColor: ClinicalTheme.colors.primaryAccent,
    padding: 22,
    ...ClinicalTheme.shadows.elevated,
  },
  questionHierarchyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hierarchyBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  smallQuestionLabelPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  smallQuestionLabelText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  phaseHierarchyPill: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  phaseHierarchyText: {
    fontSize: 11,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
    letterSpacing: 0.3,
  },
  stepHierarchyPill: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  stepHierarchyText: {
    fontSize: 11,
    fontWeight: '700',
    color: ClinicalTheme.colors.textSecondary,
  },
  timestampBadge: {
    fontSize: 11,
    color: ClinicalTheme.colors.textLight,
  },
  mainQuestionText: {
    fontSize: 24,
    lineHeight: 34,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    marginVertical: 10,
    letterSpacing: -0.2,
  },
  hindiMainQuestion: {
    lineHeight: 36,
  },
  secondaryQuestionText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: ClinicalTheme.colors.textSecondary,
    marginBottom: 10,
  },
  hindiSecondaryQuestion: {
    lineHeight: 26,
  },
  speechControllerRow: {
    marginVertical: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: ClinicalTheme.colors.borderSubtle,
  },
  speechErrorNotice: {
    fontSize: 12,
    color: ClinicalTheme.colors.riskUrgent,
    marginTop: 6,
    fontWeight: '600',
  },

  // -------------------------------------------------------------
  // 2-COLUMN OPTION CARDS (80–96dp PREFERRED HEIGHT)
  // -------------------------------------------------------------
  optionsGridLandscape: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  optionsGridPortrait: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 10,
  },
  optionCard: {
    minHeight: 88,
    backgroundColor: ClinicalTheme.colors.surface,
    padding: 16,
    borderRadius: RADIUS.md + 2,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderDefault,
    justifyContent: 'space-between',
    ...ClinicalTheme.shadows.card,
  },
  optionCardGrid: {
    width: '48.5%',
  },
  optionCardSelected: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderColor: ClinicalTheme.colors.primaryAccent,
    borderWidth: 2,
  },
  optionCardFastTrackNo: {
    backgroundColor: ClinicalTheme.colors.riskLowBg,
    borderColor: ClinicalTheme.colors.riskLowBorder,
  },
  optionCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ordinalBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ordinalBadgeSelected: {
    backgroundColor: ClinicalTheme.colors.primaryAccent,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  ordinalBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: ClinicalTheme.colors.textMuted,
  },
  ordinalBadgeTextSelected: {
    color: ClinicalTheme.colors.textWhite,
  },
  radioIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: ClinicalTheme.colors.borderMedium,
    backgroundColor: ClinicalTheme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioIndicatorSelected: {
    borderColor: ClinicalTheme.colors.primaryAccent,
    backgroundColor: ClinicalTheme.colors.primaryAccent,
  },
  radioHollowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  radioCheckmark: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16,
  },
  optionCardTitle: {
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
  },
  hindiOptionTitle: {
    lineHeight: 26,
  },
  optionCardTitleSelected: {
    color: ClinicalTheme.colors.primaryLight,
    fontWeight: '800',
  },
  optionCardSecondary: {
    fontSize: 12.5,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 2,
  },
  explicitSelectedRow: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  explicitSelectedText: {
    fontSize: 11,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
    letterSpacing: 0.5,
  },

  // -------------------------------------------------------------
  // MULTI-SELECT CHECKLIST CARDS
  // -------------------------------------------------------------
  checklistSection: {
    marginTop: 8,
  },
  checklistInstructionStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  checklistInstructionText: {
    fontSize: 12,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
    letterSpacing: 0.5,
  },
  checklistCategoryTag: {
    fontSize: 12,
    fontWeight: '700',
    color: ClinicalTheme.colors.textMuted,
  },
  checklistCardsList: {
    gap: 8,
  },
  checklistCard: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: ClinicalTheme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderDefault,
    ...ClinicalTheme.shadows.card,
  },
  checklistCardActive: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderColor: ClinicalTheme.colors.primaryAccent,
    borderWidth: 2,
  },
  checkboxSquare: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: ClinicalTheme.colors.borderMedium,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ClinicalTheme.colors.surface,
  },
  checkboxSquareActive: {
    backgroundColor: ClinicalTheme.colors.primaryAccent,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  checkboxCheckmark: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16,
  },
  checklistCardLabel: {
    fontSize: 15.5,
    lineHeight: 22,
    color: ClinicalTheme.colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  checklistCardLabelActive: {
    color: ClinicalTheme.colors.textPrimary,
    fontWeight: '800',
  },
  selectedChecklistPill: {
    backgroundColor: ClinicalTheme.colors.primaryAccent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  selectedChecklistPillText: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 11,
    fontWeight: '800',
  },

  // -------------------------------------------------------------
  // RIGHT / CONTEXT PANEL: SESSION CONTEXT (~32%)
  // -------------------------------------------------------------
  progressSummaryCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    ...ClinicalTheme.shadows.card,
  },
  progressSummaryHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryHeadTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: ClinicalTheme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  summaryHeadPercent: {
    fontSize: 13,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
  },
  summaryBarTrack: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  summaryBarFill: {
    height: '100%',
    backgroundColor: ClinicalTheme.colors.primaryAccent,
    borderRadius: 3,
  },
  metricCountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: ClinicalTheme.colors.borderMedium,
  },

  // Protocol Tracker Card (5 Phases)
  protocolTrackerCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    ...ClinicalTheme.shadows.card,
  },
  trackerHeadTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: ClinicalTheme.colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  protocolPhasesList: {
    gap: 6,
  },
  protocolPhaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: RADIUS.xs,
  },
  protocolPhaseRowActive: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
  },
  protocolPhaseRowCompleted: {
    backgroundColor: 'transparent',
  },
  protocolStatusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  protocolStatusDotActive: {
    backgroundColor: ClinicalTheme.colors.primaryAccent,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  protocolStatusDotCompleted: {
    backgroundColor: ClinicalTheme.colors.riskLow,
    borderColor: ClinicalTheme.colors.riskLow,
  },
  protocolStatusDotQueued: {
    backgroundColor: 'transparent',
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  protocolCheckmark: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 8.5,
    fontWeight: '900',
  },
  protocolPhaseTitle: {
    fontSize: 12,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '500',
    flex: 1,
  },
  protocolPhaseTitleActive: {
    color: ClinicalTheme.colors.primaryLight,
    fontWeight: '800',
  },
  protocolPhaseTitleCompleted: {
    color: ClinicalTheme.colors.textPrimary,
    fontWeight: '600',
  },
  phaseStatePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.xs,
  },
  phaseStatePillActive: {
    backgroundColor: ClinicalTheme.colors.surface,
  },
  phaseStatePillCompleted: {
    backgroundColor: ClinicalTheme.colors.riskLowBg,
  },
  phaseStatePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: ClinicalTheme.colors.textLight,
  },
  phaseStatePillTextActive: {
    color: ClinicalTheme.colors.primaryAccent,
  },
  phaseStatePillTextCompleted: {
    color: ClinicalTheme.colors.riskLow,
  },

  // Recent Responses Card
  recentHistoryCard: {
    flex: 1,
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    ...ClinicalTheme.shadows.card,
    minHeight: 180,
  },
  recentHistoryHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: ClinicalTheme.colors.borderSubtle,
    marginBottom: 6,
  },
  recentHistoryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: ClinicalTheme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  recentHistoryCounter: {
    fontSize: 11,
    fontWeight: '600',
    color: ClinicalTheme.colors.textMuted,
  },
  recentHistoryScroll: {
    flex: 1,
  },
  recentHistoryContent: {
    gap: 6,
    paddingBottom: 6,
  },
  emptyHistoryMsg: {
    fontSize: 12,
    color: ClinicalTheme.colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
  historyAnswerCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: RADIUS.xs,
    padding: 8,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  historyAnswerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyCheckIcon: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F766E',
  },
  historyAnswerTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
    flex: 1,
  },
  historyAnswerTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  historyAnswerValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
    marginTop: 2,
  },
  historyNoticePill: {
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.xs,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyNoticeMsg: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  historyPromptItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.xs,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    opacity: 0.85,
  },
  historyPromptLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
  },
  historyPromptText: {
    fontSize: 11.5,
    lineHeight: 16,
    color: '#475569',
    marginTop: 2,
  },

  // Fallback System Status Card
  systemStatusCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    padding: 24,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
    alignItems: 'center',
  },
  systemStatusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
  },
  systemStatusSub: {
    fontSize: 13,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 6,
  },

  // -------------------------------------------------------------
  // STABLE BOTTOM ACTION BAR (76dp HEIGHT)
  // -------------------------------------------------------------
  bottomActionBar: {
    minHeight: 76,
    backgroundColor: ClinicalTheme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: ClinicalTheme.colors.border,
    paddingHorizontal: 24,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    ...ClinicalTheme.shadows.elevated,
  },
  bottomBackBtn: {
    minHeight: 56,
    height: 56,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBackBtnText: {
    color: ClinicalTheme.colors.textPrimary,
    fontSize: 14.5,
    fontWeight: '700',
  },
  bottomCenterCol: {
    flex: 1,
    alignItems: 'center',
  },
  bottomProgressTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    textAlign: 'center',
  },
  bottomProgressSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: ClinicalTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  bottomRightCol: {
    alignItems: 'flex-end',
  },
  checklistBottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noneApplyActionBtn: {
    minHeight: 56,
    height: 56,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    backgroundColor: ClinicalTheme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noneApplyActionText: {
    color: ClinicalTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  confirmSelectionActionBtn: {
    minHeight: 60,
    height: 60,
    paddingHorizontal: 22,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.primaryLight,
    backgroundColor: ClinicalTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...ClinicalTheme.shadows.elevated,
  },
  confirmSelectionActionText: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  selectionGuidePill: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
    minHeight: 56,
    justifyContent: 'center',
  },
  selectionGuideText: {
    color: ClinicalTheme.colors.primaryAccent,
    fontSize: 13,
    fontWeight: '700',
  },

  // Hindi text safeguards
  hindiText: {
    lineHeight: 22,
  },
});
