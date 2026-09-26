export type SupportedLanguage = 'en' | 'hi';

export interface Translations {
  // Brand & Navigation
  brandTitle: string;
  brandSubtitle: string;
  appTitle: string;
  doctorPortal: string;
  tabletId: string;
  station: string;
  statusOnline: string;
  statusLive: string;
  liveSyncActive: string;
  connecting: string;
  offline: string;
  syncedJustNow: string;
  syncedAgo: string;
  signOut: string;
  backToDashboard: string;
  goBack: string;
  cancel: string;
  close: string;
  confirm: string;
  save: string;
  retry: string;
  years: string;
  lastUpdated: string;
  yes: string;
  no: string;
  logoutConfirmTitle: string;
  logoutConfirmMsg: string;
  profile: string;
  settings: string;
  notifications: string;
  search: string;
  filter: string;
  status: string;
  date: string;
  patientCodeHeading: string;
  riskLevel: string;

  // Authentication & Server Config
  doctorEmailLabel: string;
  doctorEmailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  signIn: string;
  signingIn: string;
  secureAccess: string;
  serverLabel: string;
  configure: string;
  configServerTitle: string;
  configServerSub: string;
  apiBaseUrl: string;
  testConnection: string;
  saveAndApply: string;
  authFailed: string;
  authInvalidCredentials: string;
  authTooManyRequests: string;
  authNetworkFailed: string;
  authUserDisabled: string;
  validationEmailPasswordRequired: string;
  sessionExpired: string;
  somethingWentWrong: string;
  serverUnavailable: string;
  networkUnavailable: string;
  serverConfiguredTitle: string;
  serverConfiguredMsg: string;
  saveError: string;

  // Dashboard Stats & CTAs
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  doctor: string;
  drPrefix: string;
  startNewPatient: string;
  startNewPatientSub: string;
  startNewPatientBtn: string;
  activePatients: string;
  activeRegisteredPatients: string;
  pendingReviews: string;
  pendingDoctorReviewSub: string;
  validatedAssessments: string;
  validatedRecords: string;
  priorityClinicalTriage: string;
  urgentHighRisk: string;
  recentPatientsTitle: string;
  recentPatientsSub: string;
  recentPatients: string;
  recentPatientsSubtitle: string;
  emptyDashboardPatients: string;
  pendingIntake: string;
  review: string;
  startAssessment: string;
  viewAssessment: string;
  newPatientAssessment: string;
  newPatientSub: string;
  startCTA: string;
  myPatients: string;
  pendingReview: string;
  validated: string;
  registeredOnStation: string;
  requireClinicalSignoff: string;
  signedByPhysician: string;
  priorityTriageFlags: string;
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
  recently: string;

  // Patient Registration & Profile
  registrationTitle: string;
  registrationSubtitle: string;
  patientRegistration: string;
  newPatientAssessmentHeader: string;
  hospitalIntakeFormSub: string;
  patientIdentification: string;
  verifyHospitalRecord: string;
  patientCodeLabel: string;
  patientCode: string;
  fullNameLabel: string;
  fullName: string;
  enterFullName: string;
  ageLabel: string;
  age: string;
  genderLabel: string;
  gender: string;
  genderFemale: string;
  genderMale: string;
  genderOther: string;
  phoneLabel: string;
  phone: string;
  phoneOptional: string;
  optional: string;
  proceedToPhoto: string;
  captureFacePhoto: string;
  patientRegisteredSuccess: string;
  proceedToCapturePhoto: string;
  savingPatient: string;
  continueToIdentification: string;
  validationNameRequired: string;
  validationAgeRequired: string;
  validationAgeRange: string;
  savePatient: string;
  patientRegistrationFailed: string;
  patientCodeCollision: string;
  patientInfoUnavailable: string;
  idPending: string;

  // Camera & Face Photo
  cameraInit: string;
  cameraPermissionTitle: string;
  cameraPermissionSub: string;
  cameraGrantPermission: string;
  skipPhotoAndProceed: string;
  flash: string;
  flashOn: string;
  flashOff: string;
  alignFaceGuide: string;
  switchCamera: string;
  skipPhoto: string;
  captureError: string;
  captureFailed: string;
  cameraUnavailable: string;
  cameraNotAccessible: string;
  confirmPhotoTitle: string;
  retake: string;
  photoGuidance: string;
  attachingPhoto: string;
  useThisPhoto: string;
  uploadError: string;
  uploadFailed: string;
  imageProcessError: string;

  // Multi-Phase Protocol Card
  patientProfileSummary: string;
  assessmentStartSubtitle: string;
  multiPhaseProtocol: string;
  multiPhaseProtocolTitle: string;
  multiPhaseProtocolSub: string;
  phase01Ready: string;
  phase01BaselineTitle: string;
  phase01BaselineDesc: string;
  phase02PrimaryTitle: string;
  phase02PrimaryDesc: string;
  phase03RegionalTitle: string;
  phase03RegionalDesc: string;
  phase04SystemicTitle: string;
  phase04SystemicDesc: string;
  phase05AnalysisTitle: string;
  phase05AnalysisDesc: string;
  ready: string;
  queued: string;
  initializingSession: string;
  beginAssessment: string;
  initFailed: string;
  couldNotStartSession: string;
  phase0Title: string;
  phase0Desc: string;
  phase1Title: string;
  phase1Desc: string;
  phase2Title: string;
  phase2Desc: string;
  phase3Title: string;
  phase3Desc: string;
  phase4Title: string;
  phase4Desc: string;
  phase0: string;
  phase1: string;
  phase2: string;
  phase3: string;
  phase4: string;
  baselineRiskProfile: string;
  primaryScreening: string;
  regionalSpread: string;
  systemicScreening: string;
  riskAnalysis: string;
  beginGuidedTriage: string;

  // Clinical Questionnaire / Chatbot
  phase01: string;
  phase02: string;
  phase03: string;
  phase04: string;
  phase05: string;
  questionOf: string;
  exitAssessmentTitle: string;
  exitAssessmentMsg: string;
  continueAssessment: string;
  exitToDashboard: string;
  autoTestTitle: string;
  autoTestMsg: string;
  autoTestScenarioA: string;
  autoTestScenarioB: string;
  autoTestScenarioC: string;
  autoTestCompletedMsg: string;
  sideSelection: string;
  whichSideSymptoms: string;
  sideOptionLeft: string;
  sideOptionRight: string;
  sideOptionBoth: string;
  sideOptionNone: string;
  noBreastSymptomsNote: string;
  recordedClinicalResponse: string;
  currentClinicalPrompt: string;
  answered: string;
  selected: string;
  submitSelection: string;
  noneOfTheseApply: string;
  noneOfTheseSummary: string;
  listenAssessment: string;
  autoTest: string;
  listeningQueue: string;
  pauseSpeech: string;
  resumeSpeech: string;
  stopSpeech: string;
  audioPreparing: string;
  retryAudio: string;
  listenPrompt: string;
  speechUnavailableNotice: string;
  noRecordedAnswersYet: string;
  confirmAnswers: string;
  nextQuestion: string;
  completeScreening: string;

  // Clinical Risk Tiers & Recommendations
  riskTierLow: string;
  riskTierModerate: string;
  riskTierHigh: string;
  riskTierUrgent: string;
  riskLow: string;
  riskModerate: string;
  riskHigh: string;
  riskUrgent: string;
  clinicalScore: string;
  reviewStatus: string;
  statusPendingReview: string;
  statusValidated: string;
  statusReassessmentReq: string;
  statusInProgress: string;
  statusCompleted: string;
  statusDoctorValidated: string;
  statusReassessmentRequested: string;
  validatedBy: string;
  recommendationTitle: string;
  recommendationLow: string;
  recommendationModerate: string;
  recommendationHigh: string;
  recommendationUrgent: string;
  keyFindingsTitle: string;
  submitAssessment: string;
  screeningFastTrackGate: string;
  overrideMetastaticPatternTitle: string;
  overrideMetastaticPatternReason: string;
  overrideClassicTriadTitle: string;
  overrideClassicTriadReason: string;
  overrideUlcerativeLesionTitle: string;
  overrideUlcerativeLesionReason: string;
  interpretationUrgentOverride: string;
  interpretationUrgent: string;
  interpretationHigh: string;
  interpretationModerate: string;
  interpretationLow: string;
  autoCompleteTest: string;
  pausePlayback: string;
  resumePlayback: string;
  stopPlayback: string;

  // Assessment Review Screen
  patientClinicalAssessment: string;
  modifyAnswers: string;
  clinicalRiskStratification: string;
  riskTierPrefix: string;
  score: string;
  positiveIndicators: string;
  baselineModifiers: string;
  safetyEscalationOverride: string;
  riskFactorBreakdown: string;
  baselineRiskModifiers: string;
  dietGeneticsSub: string;
  clinicalSymptoms: string;
  positiveFindingsCount: string;
  regionalFindings: string;
  regionalFindingsCount: string;
  systemicFindings: string;
  systemicFindingsCount: string;
  safetyEscalations: string;
  triggered: string;
  standard: string;
  noOverrideTriggered: string;
  clinicalIndicators: string;
  noPositiveFindingsReported: string;
  physicianAction: string;
  submittingToClinicalFile: string;
  submitAssessmentToFile: string;
  submissionFailed: string;
  unableToPersistAssessment: string;
  points: string;

  // Submission Success Screen
  assessmentSubmitted: string;
  assessmentAddedSuccess: string;
  patientLabel: string;
  assessmentLabel: string;
  statusLabel: string;
  pendingPhysicianReview: string;
  stratificationLabel: string;
  returnToDashboard: string;

  // Physician Review Screen
  physicianReviewTitle: string;
  physicianReviewSub: string;
  physicianReviewAndSignoff: string;
  riskTierHeading: string;
  unknownRiskTier: string;
  clinicalRiskScore: string;
  baselineRiskBRM: string;
  recordedResponses: string;
  physicianRecommendation: string;
  completeClinicalFindings: string;
  noIndividualAnswers: string;
  physicianReviewNotes: string;
  physicianReviewNotesSub: string;
  enterPhysicianNotesPlaceholder: string;
  signedAndValidatedBy: string;
  physician: string;
  reassessmentRequestedTitle: string;
  reasonLabel: string;
  confirmReviewCheckbox: string;
  requestReassessment: string;
  validating: string;
  validateAssessment: string;
  requestClinicalReassessmentModalTitle: string;
  requestClinicalReassessmentModalSub: string;
  enterReassessmentReasonPlaceholder: string;
  submitRequest: string;
  reviewRequired: string;
  reviewRequiredMsg: string;
  assessmentValidatedSuccess: string;
  assessmentValidatedSuccessMsg: string;
  validationError: string;
  reasonRequired: string;
  reasonRequiredMsg: string;
  reassessmentRequestedSuccess: string;
  reassessmentRequestedSuccessMsg: string;
  error: string;
  assessmentNotFound: string;
  clinicalNotesLabel: string;
  clinicalNotesPlaceholder: string;
  signoffCheckbox: string;
  validateSignoffButton: string;
  requestReassessmentButton: string;
  reassessmentReasonPlaceholder: string;

  // Assessment History & Patient Details
  assessmentHistoryTitle: string;
  assessmentHistorySub: string;
  assessmentHistory: string;
  allRecords: string;
  noAssessmentRecords: string;
  noAssessmentsOnAccount: string;
  noRecordsMatchingFilter: string;
  assessmentHash: string;
  dateLabel: string;
  reviewedByLabel: string;
  reviewFile: string;
  dateUnavailable: string;
  patientMedicalRecord: string;
  patientRecordNotFound: string;
  patientRecordNotFoundSub: string;
  latestClinicalRiskSummary: string;
  completedDate: string;
  totalScore: string;
  baselineRisk: string;
  workflowStatus: string;
  recommendationLabel: string;
  openCompleteDossier: string;
  noAssessmentsForPatient: string;
  idLabel: string;
  viewArrow: string;

  // States: Loading, Unauthorized, Network, Empty
  loadingPatients: string;
  loadingHistory: string;
  loadingAssessment: string;
  loadingRecords: string;
  loadingDossier: string;
  unauthorizedTitle: string;
  unauthorizedMessage: string;
  signInAgain: string;
  networkErrorTitle: string;
  networkErrorMessage: string;
  networkError: string;
  emptyPatientsTitle: string;
  emptyPatientsSub: string;
  emptyHistoryTitle: string;
  emptyHistorySub: string;
  noPatients: string;
}

export const translations: Record<SupportedLanguage, Translations> = {
  en: {
    // Brand & Navigation
    brandTitle: 'NariSetu',
    brandSubtitle: 'Clinical Assessment Station',
    appTitle: 'NariSetu Doctor',
    doctorPortal: 'Clinical Doctor Portal',
    tabletId: 'Station ID',
    station: 'STATION',
    statusOnline: 'Online Clinical',
    statusLive: 'Live',
    liveSyncActive: 'Live Sync Active',
    connecting: 'Connecting...',
    offline: 'Offline',
    syncedJustNow: 'Synced just now',
    syncedAgo: 'Synced recently',
    signOut: 'Sign Out',
    backToDashboard: 'Back to Dashboard',
    goBack: 'Go Back',
    cancel: 'Cancel',
    close: 'Close',
    confirm: 'Confirm',
    save: 'Save',
    retry: 'Retry',
    years: 'years',
    lastUpdated: 'Last Updated',
    yes: 'Yes',
    no: 'No',
    logoutConfirmTitle: 'Sign Out / Logout',
    logoutConfirmMsg: 'Are you sure you want to sign out from this station?',
    profile: 'Profile',
    settings: 'Settings',
    notifications: 'Notifications',
    search: 'Search',
    filter: 'Filter',
    status: 'Status',
    date: 'Date',
    patientCodeHeading: 'Patient Code',
    riskLevel: 'Risk Level',

    // Authentication & Server Config
    doctorEmailLabel: 'Doctor Email / Medical ID',
    doctorEmailPlaceholder: 'doctor@hospital.in',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••••••',
    signIn: 'SIGN IN',
    signingIn: 'Signing in...',
    secureAccess: 'Secure Clinical Access • Firebase Authentication',
    serverLabel: 'Server:',
    configure: 'Configure',
    configServerTitle: 'Configure Clinical API Server',
    configServerSub: 'For a physical Android tablet, enter your development machine\'s Wi-Fi IP or production URL.',
    apiBaseUrl: 'API Base URL',
    testConnection: 'Test Connection',
    saveAndApply: 'Save & Apply',
    authFailed: 'Unable to authenticate doctor account. Please verify credentials.',
    authInvalidCredentials: 'Invalid email or password. Please check and try again.',
    authTooManyRequests: 'Too many unsuccessful attempts. Please try again later.',
    authNetworkFailed: 'Network connection failed. Please check your internet connection.',
    authUserDisabled: 'This doctor account has been disabled. Contact administrator.',
    validationEmailPasswordRequired: 'Please enter your clinical email and password.',
    sessionExpired: 'Your session has expired. Please sign in again.',
    somethingWentWrong: 'Something went wrong. Please try again.',
    serverUnavailable: 'Clinical server is unavailable. Please check your network connection.',
    networkUnavailable: 'Network unavailable. Please reconnect.',
    serverConfiguredTitle: 'Server Configured',
    serverConfiguredMsg: 'API URL updated to:\n',
    saveError: 'Save Error',

    // Dashboard Stats & CTAs
    greetingMorning: 'Good morning',
    greetingAfternoon: 'Good afternoon',
    greetingEvening: 'Good evening',
    doctor: 'Doctor',
    drPrefix: 'Dr.',
    startNewPatient: 'START NEW PATIENT',
    startNewPatientSub: 'Begin a new clinical assessment',
    startNewPatientBtn: '+ START NEW PATIENT',
    activePatients: 'Active Patients',
    activeRegisteredPatients: 'Active Registered Patients',
    pendingReviews: 'Pending Reviews',
    pendingDoctorReviewSub: 'Pending Doctor Review',
    validatedAssessments: 'Validated Assessments',
    validatedRecords: 'Validated Records',
    priorityClinicalTriage: 'Priority Clinical Triage',
    urgentHighRisk: 'Urgent / High Risk',
    recentPatientsTitle: 'Recent Patients on This Tablet',
    recentPatientsSub: 'Showing latest active records',
    recentPatients: 'Recent Patients',
    recentPatientsSubtitle: 'Recent patient clinical records, risk stratifications, and assessment history',
    emptyDashboardPatients: 'No patients registered on this station yet. Tap the button above to begin an initial patient assessment.',
    pendingIntake: 'Pending Intake',
    review: 'Review',
    startAssessment: 'Start Assessment',
    viewAssessment: 'View Assessment',
    newPatientAssessment: 'Start New Patient Assessment',
    newPatientSub: 'Register patient, capture face photo, and start the NariSetu clinical questionnaire',
    startCTA: 'START ASSESSMENT',
    myPatients: 'My Patients',
    pendingReview: 'Pending Review',
    validated: 'Validated',
    registeredOnStation: 'Registered on station',
    requireClinicalSignoff: 'Require clinical sign-off',
    signedByPhysician: 'Signed by physician',
    priorityTriageFlags: 'Priority triage flags',
    justNow: 'Just now',
    minutesAgo: 'm ago',
    hoursAgo: 'h ago',
    daysAgo: 'd ago',
    recently: 'Recently',

    // Patient Registration & Profile
    registrationTitle: 'Patient Registration',
    registrationSubtitle: 'Enter clinical patient identification details before questionnaire triage.',
    patientRegistration: 'Patient Registration',
    newPatientAssessmentHeader: 'New Patient Assessment',
    hospitalIntakeFormSub: 'Hospital Intake Form • Enter verified demographic details',
    patientIdentification: 'PATIENT IDENTIFICATION',
    verifyHospitalRecord: 'Verify and enter official details per hospital intake record',
    patientCodeLabel: 'Patient Code / Hospital ID',
    patientCode: 'Patient Code / Hospital ID',
    fullNameLabel: 'Full Name',
    fullName: 'Full Name',
    enterFullName: 'Enter patient full name',
    ageLabel: 'Age (Years)',
    age: 'Age',
    genderLabel: 'Gender',
    gender: 'Gender',
    genderFemale: 'Female',
    genderMale: 'Male',
    genderOther: 'Other',
    phoneLabel: 'Phone Number',
    phone: 'Phone Number',
    phoneOptional: '(Optional)',
    optional: 'Optional',
    proceedToPhoto: 'Proceed to Face Photo',
    captureFacePhoto: 'Capture Patient Face Photo',
    patientRegisteredSuccess: 'Patient registered successfully',
    proceedToCapturePhoto: 'Patient clinical file registered. Proceed to capture clinical identification photo.',
    savingPatient: 'Saving Patient...',
    continueToIdentification: 'CONTINUE TO IDENTIFICATION →',
    validationNameRequired: 'Patient full name is required.',
    validationAgeRequired: 'Please enter patient age.',
    validationAgeRange: 'Please enter a valid age between 1 and 125.',
    savePatient: 'Save Patient',
    patientRegistrationFailed: 'Patient registration failed.',
    patientCodeCollision: 'Patient code collision detected. Regenerated code: {code}. Please tap Continue again.',
    patientInfoUnavailable: 'Patient information unavailable',
    idPending: 'ID Pending',

    // Camera & Face Photo
    cameraInit: 'Initializing camera subsystem...',
    cameraPermissionTitle: 'Tablet Camera Access Required',
    cameraPermissionSub: 'Patient identification photo requires camera permission. This photo is securely stored in the clinical patient dossier.',
    cameraGrantPermission: 'Grant Camera Permission',
    skipPhotoAndProceed: 'Skip Photo & Proceed to Assessment',
    flash: 'Flash',
    flashOn: 'ON',
    flashOff: 'OFF',
    alignFaceGuide: 'Align patient\'s face inside guide',
    switchCamera: 'Switch Camera',
    skipPhoto: 'Skip Photo',
    captureError: 'Capture Error',
    captureFailed: 'Failed to capture photo.',
    cameraUnavailable: 'Camera Unavailable',
    cameraNotAccessible: 'Camera hardware is not accessible on this device.',
    confirmPhotoTitle: 'Confirm Identification Photo',
    retake: 'Retake',
    photoGuidance: 'This photo is stored securely in the patient\'s electronic health record for identity verification across triage assessments.',
    attachingPhoto: 'Attaching Photo...',
    useThisPhoto: 'Use This Photo',
    uploadError: 'Upload Error',
    uploadFailed: 'Failed to upload patient face photo.',
    imageProcessError: 'Image data could not be processed. Please tap Retake to capture again.',

    // Multi-Phase Protocol Card
    patientProfileSummary: 'Patient Profile Summary',
    assessmentStartSubtitle: 'Patient verified and profile recorded. Ready to begin guided clinical triage.',
    multiPhaseProtocol: 'NariSetu Multi-Phase Protocol',
    multiPhaseProtocolTitle: 'NariSetu Multi-Phase Clinical Assessment',
    multiPhaseProtocolSub: 'Structured oncology screening protocol & clinical risk stratification',
    phase01Ready: '01 Ready',
    phase01BaselineTitle: '01 Baseline Risk Profile',
    phase01BaselineDesc: 'Age, age at marriage, parity, breastfeeding, contraceptives, family cancer history, smoking, diet',
    phase02PrimaryTitle: '02 Primary Breast Screening',
    phase02PrimaryDesc: 'Symptom laterality (Left/Right/Both) and primary breast lump, skin changes & nipple discharge',
    phase03RegionalTitle: '03 Regional Spread Screening',
    phase03RegionalDesc: 'Sequential regional spread screening: Neck & Left Axillary lymph nodes',
    phase04SystemicTitle: '04 Systemic & Distant Screening',
    phase04SystemicDesc: 'Systemic screening gate: Respiratory, CNS, and Musculoskeletal evaluations',
    phase05AnalysisTitle: '05 Clinical Risk Analysis',
    phase05AnalysisDesc: 'Automated clinical risk stratification (Low / Moderate / High / Urgent) & decision support',
    ready: 'READY',
    queued: 'QUEUED',
    initializingSession: 'Initializing Session...',
    beginAssessment: 'BEGIN ASSESSMENT',
    initFailed: 'Initialization Failed',
    couldNotStartSession: 'Could not start clinical assessment session.',
    phase0Title: 'Phase 0: Baseline Risk Profile',
    phase0Desc: 'Reproductive, lifestyle, and family risk stratification',
    phase1Title: 'Phase 1: Primary Breast Screening',
    phase1Desc: 'Bilateral examination: lumps, inversion, discharge, dimpling',
    phase2Title: 'Phase 2: Regional Spread Screening',
    phase2Desc: 'Axillary and cervical lymphadenopathy',
    phase3Title: 'Phase 3: Systemic & Distant Screening',
    phase3Desc: 'Constitutional, pulmonary, and musculoskeletal signs',
    phase4Title: 'Phase 4: Clinical Risk Analysis',
    phase4Desc: 'Diagnostic multipliers and safety escalation alerts',
    phase0: 'Phase 0',
    phase1: 'Phase 1',
    phase2: 'Phase 2',
    phase3: 'Phase 3',
    phase4: 'Phase 4',
    baselineRiskProfile: 'Baseline Risk Profile',
    primaryScreening: 'Primary Breast Screening',
    regionalSpread: 'Regional Spread Screening',
    systemicScreening: 'Systemic & Distant Screening',
    riskAnalysis: 'Clinical Risk Analysis',
    beginGuidedTriage: 'Begin Clinical Triage',

    // Clinical Questionnaire / Chatbot
    phase01: 'Phase 01',
    phase02: 'Phase 02',
    phase03: 'Phase 03',
    phase04: 'Phase 04',
    phase05: 'Phase 05',
    questionOf: 'Question {current} of {total}',
    exitAssessmentTitle: 'Exit Clinical Assessment?',
    exitAssessmentMsg: 'Clinical answers have been saved as a draft. Do you want to return to the dashboard?',
    continueAssessment: 'Continue Assessment',
    exitToDashboard: 'Exit to Dashboard',
    autoTestTitle: 'Automated Clinical Assessment Test',
    autoTestMsg: 'Select an automated clinical test scenario to complete all questions without manual tapping:',
    autoTestScenarioA: 'Scenario A: Low Risk (Normal 30-40 yrs)',
    autoTestScenarioB: 'Scenario B: Moderate Risk',
    autoTestScenarioC: 'Scenario C: High/Urgent Risk',
    autoTestCompletedMsg: '⚡ [Auto-Test] Completed all assessment questions: {scenario}',
    sideSelection: 'Side Selection',
    whichSideSymptoms: 'Which side is experiencing symptoms?',
    sideOptionLeft: '1. Left Breast',
    sideOptionRight: '2. Right Breast',
    sideOptionBoth: '3. Both Breasts',
    sideOptionNone: '4. No breast symptoms',
    noBreastSymptomsNote: 'No primary breast symptoms recorded. Bypassing breast checklists directly to Phase 2.',
    recordedClinicalResponse: 'RECORDED CLINICAL RESPONSE',
    currentClinicalPrompt: 'CURRENT CLINICAL PROMPT',
    answered: 'ANSWERED',
    selected: 'SELECTED',
    submitSelection: 'SUBMIT SELECTION ✓',
    noneOfTheseApply: 'NONE OF THESE APPLY',
    noneOfTheseSummary: 'None of these apply',
    listenAssessment: 'Listen Assessment',
    autoTest: 'Auto-Test',
    listeningQueue: 'Listening {current} of {total}',
    pauseSpeech: 'Pause',
    resumeSpeech: 'Resume',
    stopSpeech: 'Stop',
    audioPreparing: 'Preparing audio...',
    retryAudio: 'Retry Audio',
    listenPrompt: 'Listen Prompt',
    speechUnavailableNotice: 'Speech service is unavailable or experienced an audio error.',
    noRecordedAnswersYet: 'No clinical answers recorded yet.',
    confirmAnswers: 'Confirm Answers',
    nextQuestion: 'Next',
    completeScreening: 'Complete Screening',

    // Clinical Risk Tiers & Recommendations
    riskTierLow: 'LOW RISK',
    riskTierModerate: 'MODERATE RISK',
    riskTierHigh: 'HIGH RISK',
    riskTierUrgent: 'URGENT RISK',
    riskLow: 'Low Risk',
    riskModerate: 'Moderate Risk',
    riskHigh: 'High Risk',
    riskUrgent: 'Urgent Risk',
    clinicalScore: 'Clinical Score',
    reviewStatus: 'Review Status',
    statusPendingReview: 'Pending Review',
    statusValidated: 'Validated',
    statusReassessmentReq: 'Reassessment Requested',
    statusInProgress: 'In Progress',
    statusCompleted: 'Completed',
    statusDoctorValidated: 'Validated',
    statusReassessmentRequested: 'Reassessment',
    validatedBy: 'Validated by',
    recommendationTitle: 'Clinical Recommendation',
    recommendationLow: 'Routine clinical monitoring. Next screening in 12 months.',
    recommendationModerate: 'Secondary diagnostic follow-up recommended within 30 days.',
    recommendationHigh: 'High priority urgent imaging (Mammography / Ultrasound) advised within 7 days.',
    recommendationUrgent: 'Urgent immediate oncology and biopsy referral within 48-72 hours.',
    keyFindingsTitle: 'Key Positive Findings',
    submitAssessment: 'Submit Assessment',
    screeningFastTrackGate: 'Screening Fast-Track Gate',
    overrideMetastaticPatternTitle: 'Metastatic Pattern Alert',
    overrideMetastaticPatternReason: 'Concomitant primary breast findings and systemic symptoms detected (requires prompt systemic staging).',
    overrideClassicTriadTitle: 'Classic Malignancy Triad',
    overrideClassicTriadReason: 'Co-occurrence of nipple retraction, nipple discharge, and skin dimpling represents a classic clinical cluster requiring immediate evaluation.',
    overrideUlcerativeLesionTitle: 'Ulcerative / Open Skin Lesion Alert',
    overrideUlcerativeLesionReason: 'Ulcer, wound, or active bleeding on breast or neck tissue requires prompt clinical evaluation.',
    interpretationUrgentOverride: 'Safety Escalation: {reason} Total weighted score: {score} points.',
    interpretationUrgent: 'High-acuity symptom cluster detected across multiple screening domains (Total score: {score} pts). Immediate specialist review advised.',
    interpretationHigh: 'Significant clinical symptoms reported with elevated risk weighting (Total score: {score} pts, including Baseline Risk Modifier: +{brm}).',
    interpretationModerate: 'Moderate symptom indicators noted (Total score: {score} pts). Many findings in this range are benign, but timely clinical evaluation ensures complete safety.',
    interpretationLow: 'No high-risk breast symptom clusters identified (Total score: {score} pts). Maintain routine preventive monitoring.',
    autoCompleteTest: 'Auto-Complete Questionnaire Test',
    pausePlayback: 'Pause assessment playback',
    resumePlayback: 'Resume assessment playback',
    stopPlayback: 'Stop assessment playback',

    // Assessment Review Screen
    patientClinicalAssessment: 'Patient Clinical Assessment',
    modifyAnswers: 'Modify Answers',
    clinicalRiskStratification: 'CLINICAL RISK STRATIFICATION',
    riskTierPrefix: 'RISK: ',
    score: 'Score',
    positiveIndicators: 'Positive Indicators',
    baselineModifiers: 'Baseline Modifiers',
    safetyEscalationOverride: '⚠️ Safety Escalation Override:',
    riskFactorBreakdown: 'Risk Factor Breakdown',
    baselineRiskModifiers: 'Baseline Risk Modifiers',
    dietGeneticsSub: 'Diet, Genetics, Contraceptive & Parity',
    clinicalSymptoms: 'Clinical Symptoms',
    positiveFindingsCount: '{count} positive findings',
    regionalFindings: 'Regional Findings',
    regionalFindingsCount: '{count} regional findings',
    systemicFindings: 'Systemic Findings',
    systemicFindingsCount: '{count} systemic findings',
    safetyEscalations: 'Safety Escalations',
    triggered: 'TRIGGERED',
    standard: 'STANDARD',
    noOverrideTriggered: 'No override triggered',
    clinicalIndicators: 'Clinical Indicators',
    noPositiveFindingsReported: 'No positive clinical findings reported across Phase 1 to Phase 3.',
    physicianAction: 'Physician Action',
    submittingToClinicalFile: 'Submitting to Clinical File...',
    submitAssessmentToFile: 'Submit Assessment to Clinical File',
    submissionFailed: 'Submission Failed',
    unableToPersistAssessment: 'Unable to persist assessment to medical database.',
    points: 'pts',

    // Submission Success Screen
    assessmentSubmitted: 'Assessment Submitted',
    assessmentAddedSuccess: 'The assessment has been securely added to the clinical record.',
    patientLabel: 'Patient:',
    assessmentLabel: 'Assessment:',
    statusLabel: 'Status:',
    pendingPhysicianReview: 'Pending Physician Review',
    stratificationLabel: 'Stratification:',
    returnToDashboard: 'Return to Dashboard',

    // Physician Review Screen
    physicianReviewTitle: 'Physician Clinical Validation',
    physicianReviewSub: 'Review clinical questionnaire, face photo, and sign off.',
    physicianReviewAndSignoff: 'Physician Review & Sign-Off',
    riskTierHeading: '{tier} Tier',
    unknownRiskTier: 'Unknown Risk',
    clinicalRiskScore: 'Clinical Risk Score',
    baselineRiskBRM: 'Baseline Risk (BRM)',
    recordedResponses: 'Recorded Responses',
    physicianRecommendation: 'Physician Recommendation:',
    completeClinicalFindings: 'Complete Clinical Findings & Responses',
    noIndividualAnswers: 'No individual questionnaire answers recorded.',
    physicianReviewNotes: 'Physician Clinical Review & Notes',
    physicianReviewNotesSub: 'Confirm clinical findings, provide differential diagnosis, and sign off the file.',
    enterPhysicianNotesPlaceholder: 'Enter physician clinical notes, physical examination observations, or triage remarks...',
    signedAndValidatedBy: '✓ Signed and validated by {doctor} on {date}',
    physician: 'Physician',
    reassessmentRequestedTitle: 'Reassessment Requested',
    reasonLabel: 'Reason:',
    confirmReviewCheckbox: 'I have reviewed the clinical assessment and findings.',
    requestReassessment: 'Request Reassessment',
    validating: 'Validating...',
    validateAssessment: 'Validate Assessment',
    requestClinicalReassessmentModalTitle: 'Request Clinical Reassessment',
    requestClinicalReassessmentModalSub: 'Specify clinical reasons for requesting re-evaluation (e.g. inconsistent symptoms, missing palpation examination).',
    enterReassessmentReasonPlaceholder: 'Enter reason for requesting patient reassessment...',
    submitRequest: 'Submit Request',
    reviewRequired: 'Review Required',
    reviewRequiredMsg: 'Please check the box confirming you have reviewed the patient clinical findings.',
    assessmentValidatedSuccess: 'Assessment Validated',
    assessmentValidatedSuccessMsg: 'The assessment has been successfully signed and marked as DOCTOR_VALIDATED.',
    validationError: 'Validation Error',
    reasonRequired: 'Reason Required',
    reasonRequiredMsg: 'Please provide a clinical reason for requesting reassessment.',
    reassessmentRequestedSuccess: 'Reassessment Requested',
    reassessmentRequestedSuccessMsg: 'Assessment status updated to REASSESSMENT_REQUESTED.',
    error: 'Error',
    assessmentNotFound: 'Clinical assessment #{id} not found.',
    clinicalNotesLabel: 'Doctor Clinical Note',
    clinicalNotesPlaceholder: 'Enter clinical observations, examination findings...',
    signoffCheckbox: 'I have reviewed the patient findings and confirm this evaluation.',
    validateSignoffButton: 'Validate Assessment',
    requestReassessmentButton: 'Request Reassessment',
    reassessmentReasonPlaceholder: 'State reason for requesting re-assessment...',

    // Assessment History & Patient Details
    assessmentHistoryTitle: 'Assessment History',
    assessmentHistorySub: 'All patient triage screenings recorded on this doctor account.',
    assessmentHistory: 'Assessment History',
    allRecords: 'All Records',
    noAssessmentRecords: 'No Assessment Records',
    noAssessmentsOnAccount: 'No assessments completed on this doctor account yet.',
    noRecordsMatchingFilter: 'No clinical records matching filter "{filter}".',
    assessmentHash: 'Assessment #{id}',
    dateLabel: 'Date:',
    reviewedByLabel: 'Reviewed by:',
    reviewFile: 'Review File →',
    dateUnavailable: 'Date unavailable',
    patientMedicalRecord: 'Patient Medical Record',
    patientRecordNotFound: 'Patient Record Not Found',
    patientRecordNotFoundSub: 'The requested patient does not exist in the database or you do not have permission to view it.',
    latestClinicalRiskSummary: 'Latest Clinical Risk Summary',
    completedDate: 'Completed: {date}',
    totalScore: 'Total Score',
    baselineRisk: 'Baseline Risk',
    workflowStatus: 'Workflow Status',
    recommendationLabel: 'Recommendation:',
    openCompleteDossier: 'Open Complete Assessment Dossier →',
    noAssessmentsForPatient: 'No assessments completed for this patient yet.',
    idLabel: 'ID:',
    viewArrow: 'View →',

    // States: Loading, Unauthorized, Network, Empty
    loadingPatients: 'Loading patient records...',
    loadingHistory: 'Loading assessment history...',
    loadingAssessment: 'Loading clinical assessment...',
    loadingRecords: 'Loading patient records...',
    loadingDossier: 'Loading clinical dossier for physician review...',
    unauthorizedTitle: 'Session Expired',
    unauthorizedMessage: 'Please sign in again.',
    signInAgain: 'Sign In Again',
    networkErrorTitle: 'Network Error',
    networkErrorMessage: 'Unable to connect to server. Check connection.',
    networkError: 'Unable to connect to server.',
    emptyPatientsTitle: 'No patients registered yet.',
    emptyPatientsSub: 'Tap "New Patient Assessment" to register your first patient.',
    emptyHistoryTitle: 'No assessment records found.',
    emptyHistorySub: 'Completed assessments will appear here.',
    noPatients: 'No patients registered yet.',
  },
  hi: {
    // Brand & Navigation
    brandTitle: 'नारीसेतु',
    brandSubtitle: 'नैदानिक मूल्यांकन स्टेशन',
    appTitle: 'नारीसेतु डॉक्टर',
    doctorPortal: 'चिकित्सक पोर्टल',
    tabletId: 'स्टेशन आईडी',
    station: 'स्टेशन',
    statusOnline: 'ऑनलाइन क्लीनिकल',
    statusLive: 'लाइव',
    liveSyncActive: 'लाइव सिंक सक्रिय',
    connecting: 'कनेक्ट हो रहा है...',
    offline: 'ऑफ़लाइन',
    syncedJustNow: 'अभी सिंक हुआ',
    syncedAgo: 'हाल ही में सिंक हुआ',
    signOut: 'साइन आउट',
    backToDashboard: 'डैशबोर्ड पर वापस जाएँ',
    goBack: 'वापस जाएँ',
    cancel: 'रद्द करें',
    close: 'बंद करें',
    confirm: 'पुष्टि करें',
    save: 'सहेजें',
    retry: 'पुनः प्रयास करें',
    years: 'वर्ष',
    lastUpdated: 'अंतिम अद्यतन',
    yes: 'हाँ',
    no: 'नहीं',
    logoutConfirmTitle: 'साइन आउट / लॉग आउट',
    logoutConfirmMsg: 'क्या आप निश्चित रूप से इस स्टेशन से साइन आउट करना चाहते हैं?',
    profile: 'प्रोफ़ाइल',
    settings: 'सेटिंग्स',
    notifications: 'सूचनाएं',
    search: 'खोजें',
    filter: 'फ़िल्टर',
    status: 'स्थिति',
    date: 'तारीख',
    patientCodeHeading: 'रोगी कोड',
    riskLevel: 'जोखिम स्तर',

    // Authentication & Server Config
    doctorEmailLabel: 'चिकित्सक ईमेल / मेडिकल आईडी',
    doctorEmailPlaceholder: 'doctor@hospital.in',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: '••••••••••••',
    signIn: 'साइन इन करें',
    signingIn: 'साइन इन हो रहा है...',
    secureAccess: 'सुरक्षित नैदानिक पहुंच • फायरबेस प्रमाणीकरण',
    serverLabel: 'सर्वर:',
    configure: 'कॉन्फ़िगर करें',
    configServerTitle: 'क्लीनिकल एपीआई सर्वर कॉन्फ़िगर करें',
    configServerSub: 'भौतिक एंड्रॉइड टैबलेट के लिए, विकास मशीन का वाई-फाई आईपी या उत्पादन यूआरएल दर्ज करें।',
    apiBaseUrl: 'एपीआई बेस यूआरएल',
    testConnection: 'कनेक्शन जांचें',
    saveAndApply: 'सहेजें और लागू करें',
    authFailed: 'चिकित्सक खाता प्रमाणित करने में असमर्थ। कृपया क्रेडेंशियल सत्यापित करें।',
    authInvalidCredentials: 'अमान्य ईमेल या पासवर्ड। कृपया जांचें और पुनः प्रयास करें।',
    authTooManyRequests: 'अत्यधिक असफल प्रयास। कृपया कुछ समय बाद पुनः प्रयास करें।',
    authNetworkFailed: 'नेटवर्क कनेक्शन विफल रहा। कृपया अपना इंटरनेट कनेक्शन जांचें।',
    authUserDisabled: 'यह चिकित्सक खाता निष्क्रिय कर दिया गया है। व्यवस्थापक से संपर्क करें।',
    validationEmailPasswordRequired: 'कृपया अपना नैदानिक ईमेल और पासवर्ड दर्ज करें।',
    sessionExpired: 'आपका सत्र समाप्त हो गया है। कृपया दोबारा लॉगिन करें।',
    somethingWentWrong: 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।',
    serverUnavailable: 'क्लीनिकल सर्वर उपलब्ध नहीं है। कृपया नेटवर्क कनेक्शन जांचें।',
    networkUnavailable: 'नेटवर्क उपलब्ध नहीं है। कृपया पुनः कनेक्ट करें।',
    serverConfiguredTitle: 'सर्वर कॉन्फ़िगर हो गया',
    serverConfiguredMsg: 'एपीआई यूआरएल इसमें अपडेट किया गया:\n',
    saveError: 'सहेजने में त्रुटि',

    // Dashboard Stats & CTAs
    greetingMorning: 'शुभ प्रभात',
    greetingAfternoon: 'शुभ दोपहर',
    greetingEvening: 'शुभ संध्या',
    doctor: 'चिकित्सक',
    drPrefix: 'डॉ.',
    startNewPatient: 'नया मरीज शुरू करें',
    startNewPatientSub: 'एक नया नैदानिक मूल्यांकन शुरू करें',
    startNewPatientBtn: '+ नया मरीज',
    activePatients: 'सक्रिय मरीज',
    activeRegisteredPatients: 'पंजीकृत नैदानिक मरीज',
    pendingReviews: 'लंबित समीक्षाएं',
    pendingDoctorReviewSub: 'चिकित्सक समीक्षा प्रतीक्षारत',
    validatedAssessments: 'सत्यापित मूल्यांकन',
    validatedRecords: 'सत्यापित नैदानिक रिकॉर्ड',
    priorityClinicalTriage: 'प्राथमिकता त्रिएज',
    urgentHighRisk: 'उच्च / अति-आवश्यक जोखिम',
    recentPatientsTitle: 'इस टैबलेट पर हाल के मरीज',
    recentPatientsSub: 'नवीनतम सक्रिय रिकॉर्ड',
    recentPatients: 'हाल के मरीज',
    recentPatientsSubtitle: 'नवीनतम रोगी नैदानिक स्थिति, जोखिम स्तर एवं समीक्षा इतिहास',
    emptyDashboardPatients: 'इस स्टेशन पर अभी कोई मरीज नहीं है। नया मरीज मूल्यांकन शुरू करने के लिए ऊपर दिए गए बटन पर टैप करें।',
    pendingIntake: 'प्रतीक्षारत',
    review: 'समीक्षा',
    startAssessment: 'मूल्यांकन शुरू करें',
    viewAssessment: 'मूल्यांकन देखें',
    newPatientAssessment: 'नया मरीज मूल्यांकन शुरू करें',
    newPatientSub: 'मरीज पंजीकृत करें, चेहरे की फोटो लें और नारीसेतु प्रश्नावली शुरू करें',
    startCTA: 'मूल्यांकन शुरू करें',
    myPatients: 'मेरे मरीज',
    pendingReview: 'समीक्षा लंबित',
    validated: 'सत्यापित',
    registeredOnStation: 'इस स्टेशन पर पंजीकृत',
    requireClinicalSignoff: 'चिकित्सकीय हस्ताक्षर आवश्यक',
    signedByPhysician: 'चिकित्सक द्वारा हस्ताक्षरित',
    priorityTriageFlags: 'प्राथमिकता त्रिएज चेतावनी',
    justNow: 'अभी',
    minutesAgo: 'मि. पहले',
    hoursAgo: 'घंटे पहले',
    daysAgo: 'दिन पहले',
    recently: 'हाल ही में',

    // Patient Registration & Profile
    registrationTitle: 'मरीज पंजीकरण',
    registrationSubtitle: 'मूल्यांकन से पहले मरीज पहचान विवरण दर्ज करें।',
    patientRegistration: 'मरीज पंजीकरण',
    newPatientAssessmentHeader: 'नया रोगी मूल्यांकन',
    hospitalIntakeFormSub: 'अस्पताल अंतर्ग्रहण फॉर्म • नैदानिक विवरण दर्ज करें',
    patientIdentification: 'रोगी पहचान',
    verifyHospitalRecord: 'कृपया मेडिकल रिकॉर्ड के अनुसार विवरण भरें',
    patientCodeLabel: 'रोगी कोड / अस्पताल आईडी',
    patientCode: 'रोगी कोड / अस्पताल आईडी',
    fullNameLabel: 'पूरा नाम',
    fullName: 'पूरा नाम',
    enterFullName: 'रोगी का पूरा नाम दर्ज करें',
    ageLabel: 'आयु (वर्ष)',
    age: 'आयु',
    genderLabel: 'लिंग',
    gender: 'लिंग',
    genderFemale: 'महिला',
    genderMale: 'पुरुष',
    genderOther: 'अन्य',
    phoneLabel: 'फ़ोन नंबर',
    phone: 'फ़ोन नंबर',
    phoneOptional: '(वैकल्पिक)',
    optional: 'वैकल्पिक',
    proceedToPhoto: 'चेहरे की फोटो लें',
    captureFacePhoto: 'रोगी के चेहरे की फोटो लें',
    patientRegisteredSuccess: 'रोगी सफलतापूर्वक पंजीकृत हो गया',
    proceedToCapturePhoto: 'रोगी प्रोफ़ाइल सफलतापूर्वक सहेज ली गई है। कृपया पहचान सत्यापन हेतु रोगी की फोटो लें।',
    savingPatient: 'सहेजा जा रहा है...',
    continueToIdentification: 'पहचान सत्यापन जारी रखें →',
    validationNameRequired: 'रोगी का पूरा नाम आवश्यक है।',
    validationAgeRequired: 'कृपया रोगी की आयु दर्ज करें।',
    validationAgeRange: 'कृपया 1 से 125 के बीच मान्य आयु दर्ज करें।',
    savePatient: 'रोगी सहेजें',
    patientRegistrationFailed: 'रोगी पंजीकरण विफल रहा।',
    patientCodeCollision: 'रोगी कोड पहले से मौजूद था। नया कोड जनरेट किया गया: {code}। कृपया पुनः जारी रखें दबाएं।',
    patientInfoUnavailable: 'मरीज की जानकारी उपलब्ध नहीं है',
    idPending: 'आईडी प्रतीक्षारत',

    // Camera & Face Photo
    cameraInit: 'कैमरा सबसिस्टम प्रारंभ हो रहा है...',
    cameraPermissionTitle: 'टैबलेट कैमरा एक्सेस आवश्यक है',
    cameraPermissionSub: 'रोगी पहचान फोटो के लिए कैमरा अनुमति आवश्यक है। यह फोटो नैदानिक रोगी फ़ाइल में सुरक्षित रूप से संग्रहीत की जाती है।',
    cameraGrantPermission: 'कैमरा अनुमति दें',
    skipPhotoAndProceed: 'फोटो छोड़ें और मूल्यांकन पर आगे बढ़ें',
    flash: 'फ्लैश',
    flashOn: 'चालू',
    flashOff: 'बंद',
    alignFaceGuide: 'रोगी के चेहरे को गाइड के अंदर संरेखित करें',
    switchCamera: 'कैमरा बदलें',
    skipPhoto: 'फोटो छोड़ें',
    captureError: 'कैप्चर त्रुटि',
    captureFailed: 'फोटो लेने में विफल।',
    cameraUnavailable: 'कैमरा अनुपलब्ध',
    cameraNotAccessible: 'इस डिवाइस पर कैमरा हार्डवेयर उपलब्ध नहीं है।',
    confirmPhotoTitle: 'पहचान फोटो की पुष्टि करें',
    retake: 'पुनः लें',
    photoGuidance: 'यह फोटो त्रिएज मूल्यांकन में पहचान सत्यापन के लिए रोगी के इलेक्ट्रॉनिक स्वास्थ्य रिकॉर्ड में सुरक्षित रूप से संग्रहीत की जाती है।',
    attachingPhoto: 'फोटो संलग्न हो रही है...',
    useThisPhoto: 'इस फोटो का उपयोग करें',
    uploadError: 'अपलोड त्रुटि',
    uploadFailed: 'रोगी के चेहरे की फोटो अपलोड करने में विफल।',
    imageProcessError: 'छवि डेटा संसाधित नहीं किया जा सका। कृपया पुनः लेने के लिए टैप करें।',

    // Multi-Phase Protocol Card
    patientProfileSummary: 'रोगी प्रोफाइल सारांश',
    assessmentStartSubtitle: 'रोगी पहचान सत्यापित है। निर्देशित नैदानिक ऑन्कोलॉजी त्रिएज शुरू करें।',
    multiPhaseProtocol: 'नारीसेतु बहु-चरणीय प्रोटोकॉल',
    multiPhaseProtocolTitle: 'नारीसेतु बहु-चरणीय नैदानिक मूल्यांकन',
    multiPhaseProtocolSub: 'संरचित ऑन्कोलॉजी स्क्रीनिंग प्रोटोकॉल एवं जोखिम स्तरीकरण',
    phase01Ready: '01 तैयार',
    phase01BaselineTitle: '01 आधारभूत जोखिम प्रोफाइल',
    phase01BaselineDesc: 'आयु, विवाह आयु, प्रसव इतिहास, स्तनपान, गर्भनिरोधक, पारिवारिक इतिहास, धूम्रपान, आहार',
    phase02PrimaryTitle: '02 प्राथमिक स्तन परीक्षण',
    phase02PrimaryDesc: 'लक्षण पक्ष (बायां/दायां/दोनों) एवं प्राथमिक स्तन गांठ, त्वचा परिवर्तन एवं स्राव',
    phase03RegionalTitle: '03 क्षेत्रीय प्रसार परीक्षण',
    phase03RegionalDesc: 'गर्दन एवं बाईं कांख के लिम्फ नोड्स में सूजन व गांठ परीक्षण',
    phase04SystemicTitle: '04 प्रणालीगत और दूरस्थ परीक्षण',
    phase04SystemicDesc: 'प्रणालीगत मूल्यांकन: श्वसन, केंद्रीय तंत्रिका तंत्र, मांसपेशी एवं अस्थि लक्षण',
    phase05AnalysisTitle: '05 नैदानिक जोखिम विश्लेषण',
    phase05AnalysisDesc: 'स्वचालित नैदानिक जोखिम वर्गीकरण, संवेदी कारक एवं निर्णय सहायता सारांश',
    ready: 'प्रारंभिक',
    queued: 'कतारबद्ध',
    initializingSession: 'सत्र प्रारंभ हो रहा है...',
    beginAssessment: 'मूल्यांकन आरंभ करें',
    initFailed: 'आरंभ विफल',
    couldNotStartSession: 'मूल्यांकन सत्र प्रारंभ नहीं हो सका।',
    phase0Title: 'चरण 0: आधारभूत जोखिम प्रोफाइल',
    phase0Desc: 'प्रजनन, जीवनशैली और पारिवारिक जोखिम स्तरीकरण',
    phase1Title: 'चरण 1: प्राथमिक स्तन परीक्षण',
    phase1Desc: 'द्विपक्षीय परीक्षण: गांठ, निप्पल खिंचाव, स्राव, गड्ढा',
    phase2Title: 'चरण 2: क्षेत्रीय प्रसार परीक्षण',
    phase2Desc: 'कांख और गर्दन में लिम्फ नोड्स',
    phase3Title: 'चरण 3: प्रणालीगत और दूरस्थ परीक्षण',
    phase3Desc: 'फेफड़े, केंद्रीय तंत्रिका तंत्र और अस्थि लक्षण',
    phase4Title: 'चरण 4: नैदानिक जोखिम विश्लेषण',
    phase4Desc: 'नैदानिक गुणक और सुरक्षा वृद्धि चेतावनी',
    phase0: 'चरण 0',
    phase1: 'चरण 1',
    phase2: 'चरण 2',
    phase3: 'चरण 3',
    phase4: 'चरण 4',
    baselineRiskProfile: 'आधारभूत जोखिम प्रोफाइल',
    primaryScreening: 'प्राथमिक स्तन परीक्षण',
    regionalSpread: 'क्षेत्रीय प्रसार परीक्षण',
    systemicScreening: 'प्रणालीगत और दूरस्थ परीक्षण',
    riskAnalysis: 'नैदानिक जोखिम विश्लेषण',
    beginGuidedTriage: 'निर्देशित त्रिएज प्रारंभ करें',

    // Clinical Questionnaire / Chatbot
    phase01: 'चरण 01',
    phase02: 'चरण 02',
    phase03: 'चरण 03',
    phase04: 'चरण 04',
    phase05: 'चरण 05',
    questionOf: 'प्रश्न {current} / {total}',
    exitAssessmentTitle: 'मूल्यांकन से बाहर निकलें?',
    exitAssessmentMsg: 'रोगी के वर्तमान उत्तर ड्राफ्ट के रूप में सुरक्षित हैं। क्या आप डैशबोर्ड पर लौटना चाहते हैं?',
    continueAssessment: 'मूल्यांकन जारी रखें',
    exitToDashboard: 'डैशबोर्ड पर जाएं',
    autoTestTitle: 'नैदानिक परीक्षण ऑटो-फिल',
    autoTestMsg: 'रोगी के लिए एक स्वचालित परीक्षण परिदृश्य चुनें:',
    autoTestScenarioA: 'परिदृश्य A: कम जोखिम (30-40 वर्ष)',
    autoTestScenarioB: 'परिदृश्य B: मध्यम जोखिम',
    autoTestScenarioC: 'परिदृश्य C: तत्काल जोखिम',
    autoTestCompletedMsg: '⚡ [ऑटो-टेस्ट] सभी मूल्यांकन प्रश्न पूरे किए: {scenario}',
    sideSelection: 'पक्ष चयन',
    whichSideSymptoms: 'किस तरफ लक्षण अनुभव हो रहे हैं?',
    sideOptionLeft: '1. बायां स्तन',
    sideOptionRight: '2. दायां स्तन',
    sideOptionBoth: '3. दोनों स्तन',
    sideOptionNone: '4. कोई स्तन लक्षण नहीं',
    noBreastSymptomsNote: 'कोई प्राथमिक स्तन लक्षण दर्ज नहीं। सीधे चरण 03 पर आगे बढ़ रहे हैं।',
    recordedClinicalResponse: 'दर्ज नैदानिक उत्तर',
    currentClinicalPrompt: 'वर्तमान नैदानिक प्रश्न',
    answered: 'उत्तर दिया गया',
    selected: 'चयनित',
    submitSelection: 'चयन सबमिट करें ✓',
    noneOfTheseApply: 'इनमें से कोई नहीं',
    noneOfTheseSummary: 'इनमें से कोई नहीं',
    listenAssessment: 'मूल्यांकन सुनें',
    autoTest: 'ऑटो-टेस्ट',
    listeningQueue: 'वाचन: प्रश्न {current} / {total}',
    pauseSpeech: 'रोकें',
    resumeSpeech: 'पुनः चालू',
    stopSpeech: 'बंद',
    audioPreparing: 'ऑडियो तैयार हो रहा है...',
    retryAudio: 'पुनः प्रयास करें',
    listenPrompt: 'प्रश्न सुनें',
    speechUnavailableNotice: 'वाक् सेवा उपलब्ध नहीं है या ऑडियो त्रुटि हुई।',
    noRecordedAnswersYet: 'अभी तक कोई नैदानिक उत्तर दर्ज नहीं किया गया है।',
    confirmAnswers: 'उत्तरों की पुष्टि करें',
    nextQuestion: 'अगला',
    completeScreening: 'परीक्षण पूरा करें',

    // Clinical Risk Tiers & Recommendations
    riskTierLow: 'कम जोखिम',
    riskTierModerate: 'मध्यम जोखिम',
    riskTierHigh: 'उच्च जोखिम',
    riskTierUrgent: 'तत्काल जोखिम',
    riskLow: 'कम जोखिम',
    riskModerate: 'मध्यम जोखिम',
    riskHigh: 'उच्च जोखिम',
    riskUrgent: 'तत्काल जोखिम',
    clinicalScore: 'नैदानिक स्कोर',
    reviewStatus: 'समीक्षा स्थिति',
    statusPendingReview: 'समीक्षा लंबित',
    statusValidated: 'सत्यापित',
    statusReassessmentReq: 'पुनर्मूल्यांकन अनुरोधित',
    statusInProgress: 'प्रगति पर है',
    statusCompleted: 'पूर्ण',
    statusDoctorValidated: 'सत्यापित',
    statusReassessmentRequested: 'पुनर्मूल्यांकन',
    validatedBy: 'सत्यापित द्वारा',
    recommendationTitle: 'नैदानिक सिफारिश',
    recommendationLow: 'नियमित नैदानिक निगरानी। 12 महीनों में अगली जांच।',
    recommendationModerate: '30 दिनों के भीतर द्वितीयक नैदानिक फॉलो-अप की सिफारिश।',
    recommendationHigh: '7 दिनों के भीतर उच्च प्राथमिकता वाली इमेजिंग (मैमोग्राफी / अल्ट्रासाउंड) की सलाह।',
    recommendationUrgent: '48-72 घंटों के भीतर तत्काल ऑन्कोलॉजी और बायोप्सी रेफरल।',
    keyFindingsTitle: 'प्रमुख सकारात्मक निष्कर्ष',
    submitAssessment: 'मूल्यांकन जमा करें',
    screeningFastTrackGate: 'स्क्रीनिंग फास्ट-ट्रैक',
    overrideMetastaticPatternTitle: 'मेटास्टेटिक पैटर्न चेतावनी',
    overrideMetastaticPatternReason: 'प्राथमिक स्तन निष्कर्षों और प्रणालीगत लक्षणों का सह-अस्तित्व पाया गया (त्वरित प्रणालीगत स्टेजिंग आवश्यक)।',
    overrideClassicTriadTitle: 'क्लासिक दुर्दमता त्रय',
    overrideClassicTriadReason: 'निप्पल का धंसना, निप्पल स्राव और त्वचा में गड्ढा पड़ने का सह-अस्तित्व एक क्लासिक नैदानिक लक्षण समूह है जिसके लिए तत्काल मूल्यांकन आवश्यक है।',
    overrideUlcerativeLesionTitle: 'अल्सरेटिव / खुला घाव चेतावनी',
    overrideUlcerativeLesionReason: 'स्तन या गर्दन के ऊतकों पर अल्सर, घाव, या सक्रिय रक्तस्राव के लिए त्वरित नैदानिक मूल्यांकन आवश्यक है।',
    interpretationUrgentOverride: 'सुरक्षा एस्केलेशन: {reason} कुल भारित स्कोर: {score} अंक।',
    interpretationUrgent: 'कई स्क्रीनिंग क्षेत्रों में उच्च-तीव्रता वाला लक्षण समूह पाया गया (कुल स्कोर: {score} अंक)। तत्काल विशेषज्ञ समीक्षा की सलाह दी जाती है।',
    interpretationHigh: 'उच्च जोखिम भार के साथ महत्वपूर्ण नैदानिक लक्षण दर्ज किए गए (कुल स्कोर: {score} अंक, आधारभूत जोखिम संशोधक सहित: +{brm})।',
    interpretationModerate: 'मध्यम लक्षण संकेतक देखे गए (कुल स्कोर: {score} अंक)। इस सीमा में कई निष्कर्ष गैर-हानिकारक होते हैं, लेकिन समय पर नैदानिक मूल्यांकन पूर्ण सुरक्षा सुनिश्चित करता है।',
    interpretationLow: 'कोई उच्च-जोखिम वाला स्तन लक्षण समूह नहीं पाया गया (कुल स्कोर: {score} अंक)। नियमित निवारक निगरानी बनाए रखें।',
    autoCompleteTest: 'प्रश्नावली स्वतः परीक्षण',
    pausePlayback: 'मूल्यांकन ऑडियो रोकें',
    resumePlayback: 'मूल्यांकन ऑडियो पुनः चालू करें',
    stopPlayback: 'मूल्यांकन ऑडियो बंद करें',

    // Assessment Review Screen
    patientClinicalAssessment: 'रोगी नैदानिक मूल्यांकन',
    modifyAnswers: 'उत्तर संशोधित करें',
    clinicalRiskStratification: 'नैदानिक जोखिम स्तरीकरण',
    riskTierPrefix: 'जोखिम: ',
    score: 'स्कोर',
    positiveIndicators: 'सकारात्मक संकेतक',
    baselineModifiers: 'आधारभूत संशोधक',
    safetyEscalationOverride: '⚠️ सुरक्षा वृद्धि चेतावनी:',
    riskFactorBreakdown: 'जोखिम कारक विवरण',
    baselineRiskModifiers: 'आधारभूत जोखिम संशोधक',
    dietGeneticsSub: 'आहार, आनुवंशिकी, गर्भनिरोधक एवं प्रसव',
    clinicalSymptoms: 'नैदानिक लक्षण',
    positiveFindingsCount: '{count} सकारात्मक निष्कर्ष',
    regionalFindings: 'क्षेत्रीय निष्कर्ष',
    regionalFindingsCount: '{count} क्षेत्रीय निष्कर्ष',
    systemicFindings: 'प्रणालीगत निष्कर्ष',
    systemicFindingsCount: '{count} प्रणालीगत निष्कर्ष',
    safetyEscalations: 'सुरक्षा वृद्धि चेतावनी',
    triggered: 'सक्रिय',
    standard: 'मानक',
    noOverrideTriggered: 'कोई सुरक्षा वृद्धि सक्रिय नहीं',
    clinicalIndicators: 'नैदानिक संकेतक',
    noPositiveFindingsReported: 'कोई सकारात्मक लक्षण दर्ज नहीं किया गया (सभी उत्तर सामान्य/नकारात्मक हैं)।',
    physicianAction: 'चिकित्सक कार्रवाई',
    submittingToClinicalFile: 'क्लीनिकल फाइल में सबमिट किया जा रहा है...',
    submitAssessmentToFile: 'नैदानिक फाइल में मूल्यांकन सबमिट करें',
    submissionFailed: 'जमा विफल',
    unableToPersistAssessment: 'डेटाबेस में मूल्यांकन सहेजने में असमर्थ।',
    points: 'अंक',

    // Submission Success Screen
    assessmentSubmitted: 'मूल्यांकन सबमिट किया गया',
    assessmentAddedSuccess: 'मूल्यांकन सुरक्षित रूप से नैदानिक रिकॉर्ड में जोड़ दिया गया है।',
    patientLabel: 'रोगी:',
    assessmentLabel: 'मूल्यांकन:',
    statusLabel: 'स्थिति:',
    pendingPhysicianReview: 'चिकित्सक समीक्षा लंबित',
    stratificationLabel: 'स्तरीकरण:',
    returnToDashboard: 'डैशबोर्ड पर लौटें',

    // Physician Review Screen
    physicianReviewTitle: 'चिकित्सक नैदानिक सत्यापन',
    physicianReviewSub: 'प्रश्नावली, चेहरे की फोटो की समीक्षा करें और पुष्टि करें।',
    physicianReviewAndSignoff: 'चिकित्सक समीक्षा एवं सत्यापन',
    riskTierHeading: '{tier} श्रेणी',
    unknownRiskTier: 'अज्ञात जोखिम',
    clinicalRiskScore: 'नैदानिक जोखिम स्कोर',
    baselineRiskBRM: 'आधारभूत जोखिम',
    recordedResponses: 'दर्ज प्रतिक्रियाएं',
    physicianRecommendation: 'चिकित्सक सिफारिश:',
    completeClinicalFindings: 'पूर्ण प्रश्नावली नैदानिक उत्तर',
    noIndividualAnswers: 'कोई प्रश्नावली उत्तर दर्ज नहीं है।',
    physicianReviewNotes: 'चिकित्सक नैदानिक समीक्षा टिप्पणी',
    physicianReviewNotesSub: 'मूल्यांकन निष्कर्षों की पुष्टि करें, अतिरिक्त नैदानिक टिप्पणियां जोड़ें।',
    enterPhysicianNotesPlaceholder: 'नैदानिक अवलोकन, शारीरिक परीक्षण निष्कर्ष या त्रिएज टिप्पणियां दर्ज करें...',
    signedAndValidatedBy: '✓ {doctor} द्वारा {date} को हस्ताक्षरित एवं सत्यापित',
    physician: 'चिकित्सक',
    reassessmentRequestedTitle: 'पुनर्मूल्यांकन अनुरोधित',
    reasonLabel: 'कारण:',
    confirmReviewCheckbox: 'मैंने नैदानिक मूल्यांकन और निष्कर्षों की समीक्षा कर ली है।',
    requestReassessment: 'पुनर्मूल्यांकन का अनुरोध करें',
    validating: 'सत्यापित हो रहा है...',
    validateAssessment: 'मूल्यांकन सत्यापित करें',
    requestClinicalReassessmentModalTitle: 'नैदानिक पुनर्मूल्यांकन का अनुरोध करें',
    requestClinicalReassessmentModalSub: 'पुनर्मूल्यांकन के नैदानिक कारण बताएं (उदा. असंगत लक्षण, छूकर देखने की परीक्षा में कमी)।',
    enterReassessmentReasonPlaceholder: 'मरीज के पुनर्मूल्यांकन का कारण दर्ज करें...',
    submitRequest: 'अनुरोध सबमिट करें',
    reviewRequired: 'समीक्षा आवश्यक',
    reviewRequiredMsg: 'कृपया रोगी के नैदानिक निष्कर्षों की समीक्षा की पुष्टि करने वाले बॉक्स को चेक करें।',
    assessmentValidatedSuccess: 'मूल्यांकन सत्यापित',
    assessmentValidatedSuccessMsg: 'मूल्यांकन पर सफलतापूर्वक हस्ताक्षर किए गए और डॉक्टर द्वारा सत्यापित चिह्नित किया गया।',
    validationError: 'सत्यापन त्रुटि',
    reasonRequired: 'कारण आवश्यक',
    reasonRequiredMsg: 'कृपया पुनर्मूल्यांकन का अनुरोध करने के लिए नैदानिक कारण प्रदान करें।',
    reassessmentRequestedSuccess: 'पुनर्मूल्यांकन अनुरोधित',
    reassessmentRequestedSuccessMsg: 'मूल्यांकन स्थिति को पुनर्मूल्यांकन अनुरोधित में अद्यतन किया गया।',
    error: 'त्रुटि',
    assessmentNotFound: 'नैदानिक मूल्यांकन #{id} नहीं मिला।',
    clinicalNotesLabel: 'डॉक्टर नैदानिक टिप्पणी',
    clinicalNotesPlaceholder: 'नैदानिक अवलोकन, परीक्षण निष्कर्ष दर्ज करें...',
    signoffCheckbox: 'मैंने रोगी निष्कर्षों की समीक्षा की है और पुष्टि करता हूँ।',
    validateSignoffButton: 'मूल्यांकन सत्यापित करें',
    requestReassessmentButton: 'पुनर्मूल्यांकन का अनुरोध करें',
    reassessmentReasonPlaceholder: 'पुनर्मूल्यांकन का कारण बताएं...',

    // Assessment History & Patient Details
    assessmentHistoryTitle: 'मूल्यांकन इतिहास',
    assessmentHistorySub: 'इस डॉक्टर खाते पर दर्ज सभी रोगी परीक्षण।',
    assessmentHistory: 'मूल्यांकन इतिहास',
    allRecords: 'सभी रिकॉर्ड',
    noAssessmentRecords: 'कोई मूल्यांकन रिकॉर्ड नहीं',
    noAssessmentsOnAccount: 'इस चिकित्सक खाते पर अभी कोई मूल्यांकन पूर्ण नहीं हुआ है।',
    noRecordsMatchingFilter: 'फ़िल्टर "{filter}" से मेल खाने वाला कोई रिकॉर्ड नहीं मिला।',
    assessmentHash: 'मूल्यांकन #{id}',
    dateLabel: 'दिनांक:',
    reviewedByLabel: 'समीक्षा द्वारा:',
    reviewFile: 'फ़ाइल समीक्षा →',
    dateUnavailable: 'तारीख उपलब्ध नहीं',
    patientMedicalRecord: 'रोगी चिकित्सा रिकॉर्ड',
    patientRecordNotFound: 'मरीज रिकॉर्ड नहीं मिला',
    patientRecordNotFoundSub: 'अनुरोधित मरीज डेटाबेस में मौजूद नहीं है या देखने की अनुमति नहीं है।',
    latestClinicalRiskSummary: 'नवीनतम नैदानिक जोखिम सारांश',
    completedDate: 'पूर्ण: {date}',
    totalScore: 'कुल स्कोर',
    baselineRisk: 'आधारभूत जोखिम',
    workflowStatus: 'कार्यप्रवाह स्थिति',
    recommendationLabel: 'सिफारिश:',
    openCompleteDossier: 'पूर्ण मूल्यांकन फ़ाइल खोलें →',
    noAssessmentsForPatient: 'इस रोगी के लिए अभी कोई मूल्यांकन दर्ज नहीं है।',
    idLabel: 'आईडी:',
    viewArrow: 'देखें →',

    // States: Loading, Unauthorized, Network, Empty
    loadingPatients: 'रोगी रिकॉर्ड लोड हो रहे हैं...',
    loadingHistory: 'मूल्यांकन इतिहास लोड हो रहा है...',
    loadingAssessment: 'नैदानिक मूल्यांकन लोड हो रहा है...',
    loadingRecords: 'रोगी रिकॉर्ड लोड हो रहे हैं...',
    loadingDossier: 'चिकित्सक समीक्षा हेतु नैदानिक फ़ाइल लोड हो रही है...',
    unauthorizedTitle: 'सत्र समाप्त',
    unauthorizedMessage: 'सत्र समाप्त हो गया है। कृपया दोबारा साइन इन करें।',
    signInAgain: 'पुनः साइन इन करें',
    networkErrorTitle: 'नेटवर्क त्रुटि',
    networkErrorMessage: 'सर्वर से कनेक्ट नहीं हो सका। पुनः प्रयास करें।',
    networkError: 'सर्वर से कनेक्ट नहीं हो सका।',
    emptyPatientsTitle: 'अभी तक कोई मरीज पंजीकृत नहीं है।',
    emptyPatientsSub: 'पहला मरीज पंजीकृत करने के लिए "नया मरीज मूल्यांकन शुरू करें" दबाएं।',
    emptyHistoryTitle: 'कोई मूल्यांकन रिकॉर्ड नहीं मिला।',
    emptyHistorySub: 'पूर्ण किए गए मूल्यांकन यहां दिखाई देंगे।',
    noPatients: 'अभी तक कोई मरीज पंजीकृत नहीं है।',
  },
};
