import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import questionsData from '../services/symptoms_questions.json';
import {
  calculateClinicalRiskAnalysis,
  RiskProfileData,
} from '../services/assessmentEngine';
import { ApiService } from '../services/api.service';

type Props = NativeStackScreenProps<RootStackParamList, 'Chatbot'>;

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  type?: 'text' | 'profile_choice' | 'checklist' | 'completion';
  options?: string[];
  category?: any;
  timestamp: string;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
];

export const ChatbotScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patient, assessmentId } = route.params;

  // Questionnaire state
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [profileStep, setProfileStep] = useState<number>(0);
  const [riskProfile, setRiskProfile] = useState<RiskProfileData>({
    age: patient.age,
  });
  const [collectedAnswers, setCollectedAnswers] = useState<Record<string, 'Yes' | 'No'>>({});
  const [selectedChecklist, setSelectedChecklist] = useState<Record<string, boolean>>({});
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number>(0);

  // Language & BHASHINI state
  const [selectedLang, setSelectedLang] = useState<string>('en');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState<boolean>(false);
  const [voiceRecognizedText, setVoiceRecognizedText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);

  const scrollViewRef = useRef<ScrollView | null>(null);

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
    };
    setMessages(prev => [...prev, msg]);
    scrollToBottom();
  };

  // Phase 0 profile questions
  const PROFILE_QUESTIONS = [
    {
      key: 'familyHistory',
      prompt: 'Is there a family history of breast or ovarian cancer (Mother, Sister, Daughter)?',
      options: ['Yes (Mother / Sister / Daughter)', 'Yes (Second-degree relative)', 'No / Unknown'],
    },
    {
      key: 'breastfeeding',
      prompt: 'Has the patient ever breastfed?',
      options: ['Yes (> 1 year cumulative)', 'Yes (< 1 year)', 'Never breastfed / No children'],
    },
    {
      key: 'contraceptives',
      prompt: 'Has the patient used hormonal contraceptives or HRT for more than 5 years?',
      options: ['Yes (> 5 years long-term)', 'Yes (< 5 years)', 'Never used'],
    },
    {
      key: 'numberOfChildren',
      prompt: 'Patient parity (number of full-term pregnancies)?',
      options: ['0 (No children)', '1 or 2 children', '3 or more children'],
    },
  ];

  // Initialize chatbot
  useEffect(() => {
    addBotMessage(`Hello, I am the BreastCare AI clinical assistant. We will evaluate patient ${patient.name} across clinical protocol phases.`, 'text');
    setTimeout(() => {
      askProfileQuestion(0);
    }, 600);
  }, []);

  const askProfileQuestion = (step: number) => {
    if (step < PROFILE_QUESTIONS.length) {
      const q = PROFILE_QUESTIONS[step];
      addBotMessage(`[Phase 0 · Question ${step + 1}/${PROFILE_QUESTIONS.length}]\n${q.prompt}`, 'profile_choice', {
        options: q.options,
      });
      setProfileStep(step);
    } else {
      // Transition to Phase 1 (Symptom Checklists)
      setCurrentPhase(1);
      addBotMessage('Phase 0 complete. We are now entering Phase 1: Primary Breast Screening.', 'text');
      setTimeout(() => {
        presentCategoryChecklist(0);
      }, 500);
    }
  };

  const handleProfileAnswer = (option: string) => {
    addUserMessage(option);
    const q = PROFILE_QUESTIONS[profileStep];
    const updatedProfile = { ...riskProfile, [q.key]: option };
    setRiskProfile(updatedProfile);

    setTimeout(() => {
      askProfileQuestion(profileStep + 1);
    }, 400);
  };

  // Phase 1, 2, 3 checklist presentation
  const presentCategoryChecklist = (catIndex: number) => {
    if (catIndex < questionsData.length) {
      const cat = questionsData[catIndex];
      setActiveCategoryIndex(catIndex);
      setCurrentPhase(cat.phase);
      setSelectedChecklist({});

      addBotMessage(
        `[Phase ${cat.phase} · Screening]\nCategory: ${cat.category}\nSelect any symptoms observed, or tap "No Symptoms in this Category".`,
        'checklist',
        { category: cat }
      );
    } else {
      // Completed all symptom questions -> Phase 4 Review
      finishQuestionnaire();
    }
  };

  const toggleChecklistItem = (convertedName: string) => {
    setSelectedChecklist(prev => ({
      ...prev,
      [convertedName]: !prev[convertedName],
    }));
  };

  const handleConfirmCategory = () => {
    const cat = questionsData[activeCategoryIndex];
    const newAnswers = { ...collectedAnswers };
    const positiveLabels: string[] = [];

    cat.options.forEach((opt: any) => {
      if (selectedChecklist[opt.converted_name]) {
        newAnswers[opt.converted_name] = 'Yes';
        positiveLabels.push(opt.label);
      } else {
        newAnswers[opt.converted_name] = 'No';
      }
    });

    setCollectedAnswers(newAnswers);

    if (positiveLabels.length > 0) {
      addUserMessage(`Reported positive findings:\n• ${positiveLabels.join('\n• ')}`);
    } else {
      addUserMessage(`No symptoms reported for ${cat.category}.`);
    }

    setTimeout(() => {
      presentCategoryChecklist(activeCategoryIndex + 1);
    }, 500);
  };

  const finishQuestionnaire = () => {
    addBotMessage('Clinical questionnaire completed. Calculating weighted diagnostic score and safety net overrides...', 'text');

    const result = calculateClinicalRiskAnalysis(riskProfile, collectedAnswers);

    setTimeout(() => {
      navigation.navigate('AssessmentReview', {
        patient,
        assessmentId,
        clinicalResult: result,
        answersMap: collectedAnswers,
        riskProfile,
      });
    }, 800);
  };

  // BHASHINI Demo Voice Handler
  const handleListenText = async (text: string) => {
    try {
      await ApiService.requestTTS(text, selectedLang);
      Alert.alert('🔊 BHASHINI Voice Output (Demo)', `Synthesized clinical audio prompt:\n"${text}"`);
    } catch (err: any) {
      Alert.alert('TTS Note', err.message || 'Demo audio active.');
    }
  };

  const handleStartVoiceRecognition = () => {
    setVoiceModalVisible(true);
    setIsListening(true);
    setVoiceRecognizedText('');

    // Simulate voice detection after 1.5s
    setTimeout(() => {
      setIsListening(false);
      setVoiceRecognizedText('हाँ / Yes, confirmed symptom observed');
    }, 1500);
  };

  const handleConfirmVoice = () => {
    setVoiceModalVisible(false);
    addUserMessage(`🎤 [Voice Input]: ${voiceRecognizedText}`);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Exit</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>BreastCare Guided Assessment</Text>
          <Text style={styles.headerPatient}>
            Patient: {patient.name} ({patient.patient_code})
          </Text>
        </View>

        {/* BHASHINI Language & Demo Bar */}
        <View style={styles.langArea}>
          <View style={styles.bhashiniBadge}>
            <Text style={styles.bhashiniText}>BHASHINI: DEMO MODE</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll}>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langChip, selectedLang === lang.code && styles.langChipActive]}
                onPress={() => setSelectedLang(lang.code)}
              >
                <Text style={[styles.langChipText, selectedLang === lang.code && styles.langChipTextActive]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
      >
        {messages.map(msg => (
          <View
            key={msg.id}
            style={[styles.messageRow, msg.sender === 'user' ? styles.msgRowUser : styles.msgRowBot]}
          >
            {msg.sender === 'bot' && (
              <View style={styles.botAvatar}>
                <Text style={{ fontSize: 18 }}>🤖</Text>
              </View>
            )}

            <View
              style={[
                styles.messageBubble,
                msg.sender === 'user' ? styles.bubbleUser : styles.bubbleBot,
              ]}
            >
              <Text style={msg.sender === 'user' ? styles.textUser : styles.textBot}>
                {msg.text}
              </Text>

              {/* Bot Voice Listen Button */}
              {msg.sender === 'bot' && (
                <TouchableOpacity
                  style={styles.listenBtn}
                  onPress={() => handleListenText(msg.text)}
                >
                  <Text style={styles.listenBtnText}>🔊 Listen (BHASHINI)</Text>
                </TouchableOpacity>
              )}

              {/* Phase 0 Profile Options */}
              {msg.type === 'profile_choice' && msg.options && (
                <View style={styles.optionsArea}>
                  {msg.options.map((opt, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.optionButton}
                      onPress={() => handleProfileAnswer(opt)}
                    >
                      <Text style={styles.optionButtonText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Phase 1-3 Checklist */}
              {msg.type === 'checklist' && msg.category && (
                <View style={styles.checklistArea}>
                  <Text style={styles.checklistTitle}>Select observed symptoms:</Text>
                  {msg.category.options.map((opt: any, idx: number) => {
                    const isSelected = !!selectedChecklist[opt.converted_name];
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.checkItem, isSelected && styles.checkItemActive]}
                        onPress={() => toggleChecklistItem(opt.converted_name)}
                      >
                        <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                          {isSelected && <Text style={styles.checkMark}>✓</Text>}
                        </View>
                        <Text style={[styles.checkLabel, isSelected && styles.checkLabelActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  <View style={styles.confirmRow}>
                    <TouchableOpacity
                      style={styles.voiceMicBtn}
                      onPress={handleStartVoiceRecognition}
                    >
                      <Text style={styles.voiceMicText}>🎤 Speak (Demo)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.confirmChecklistBtn}
                      onPress={handleConfirmCategory}
                    >
                      <Text style={styles.confirmChecklistBtnText}>Confirm Findings →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <Text style={styles.timestamp}>{msg.timestamp}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* BHASHINI Voice Demo Modal */}
      <Modal visible={voiceModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>BHASHINI Voice Assistant (Demo Mode)</Text>
            <Text style={styles.modalSub}>
              Simulating Indian Language Speech-to-Text inference layer.
            </Text>

            <View style={styles.micCircle}>
              {isListening ? (
                <ActivityIndicator size="large" color="#ffffff" />
              ) : (
                <Text style={{ fontSize: 40 }}>🎙️</Text>
              )}
            </View>

            <Text style={styles.statusText}>
              {isListening ? 'Listening to patient...' : 'Voice recognized:'}
            </Text>
            <Text style={styles.recognizedResult}>
              {isListening ? 'Please speak now' : voiceRecognizedText}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setVoiceModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, isListening && { opacity: 0.5 }]}
                onPress={handleConfirmVoice}
                disabled={isListening}
              >
                <Text style={styles.modalConfirmText}>Use Answer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    backgroundColor: '#1e293b',
    paddingTop: 44,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerLeft: {
    marginBottom: 10,
  },
  backBtn: {
    marginBottom: 4,
  },
  backBtnText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
  },
  headerPatient: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  langArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bhashiniBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  bhashiniText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '700',
  },
  langScroll: {
    flexGrow: 0,
  },
  langChip: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  langChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  langChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  langChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
    paddingBottom: 40,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  msgRowBot: {
    justifyContent: 'flex-start',
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 16,
  },
  bubbleBot: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  bubbleUser: {
    backgroundColor: '#0284c7',
  },
  textBot: {
    color: '#f8fafc',
    fontSize: 15,
    lineHeight: 22,
  },
  textUser: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  listenBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
  },
  listenBtnText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  optionsArea: {
    marginTop: 14,
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#0284c7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  optionButtonText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  checklistArea: {
    marginTop: 14,
  },
  checklistTitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  checkItemActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#1e293b',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#64748b',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#0284c7',
  },
  checkMark: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
  },
  checkLabel: {
    color: '#cbd5e1',
    fontSize: 14,
    flex: 1,
  },
  checkLabelActive: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  voiceMicBtn: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
  },
  voiceMicText: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmChecklistBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmChecklistBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  timestamp: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'center',
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  recognizedResult: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  modalCancel: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  modalConfirm: {
    flex: 1,
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
