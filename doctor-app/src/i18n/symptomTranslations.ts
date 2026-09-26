export interface Phase0Question {
  key: string;
  promptEn: string;
  promptHi: string;
  options: {
    internalValue: string;
    labelEn: string;
    labelHi: string;
  }[];
}

export const PHASE_0_QUESTIONS: Phase0Question[] = [
  {
    key: 'age',
    promptEn: 'What is your current age group?',
    promptHi: 'रोगी का वर्तमान आयु वर्ग क्या है?',
    options: [
      { internalValue: '< 30 years', labelEn: '< 30 years', labelHi: '< 30 वर्ष' },
      { internalValue: '30–40 years', labelEn: '30–40 years', labelHi: '30–40 वर्ष' },
      { internalValue: '41–50 years', labelEn: '41–50 years', labelHi: '41–50 वर्ष' },
      { internalValue: '> 50 years', labelEn: '> 50 years', labelHi: '> 50 वर्ष' },
    ],
  },
  {
    key: 'ageAtMarriage',
    promptEn: 'What was your age at marriage (if applicable)?',
    promptHi: 'विवाह के समय आयु क्या थी (यदि लागू हो)?',
    options: [
      { internalValue: '< 20 years', labelEn: '< 20 years', labelHi: '< 20 वर्ष' },
      { internalValue: '20–25 years', labelEn: '20–25 years', labelHi: '20–25 वर्ष' },
      { internalValue: '26–30 years', labelEn: '26–30 years', labelHi: '26–30 वर्ष' },
      { internalValue: '> 30 years', labelEn: '> 30 years', labelHi: '> 30 वर्ष' },
      { internalValue: 'Not married / N/A', labelEn: 'Not married / N/A', labelHi: 'अविवाहित / लागू नहीं' },
    ],
  },
  {
    key: 'ageAtFirstChild',
    promptEn: 'What was your age at first childbirth?',
    promptHi: 'प्रथम प्रसव (बच्चे के जन्म) के समय आयु क्या थी?',
    options: [
      { internalValue: 'No children', labelEn: 'No children', labelHi: 'कोई संतान नहीं' },
      { internalValue: 'Age < 30 years', labelEn: 'Age < 30 years', labelHi: 'आयु < 30 वर्ष' },
      { internalValue: 'Age ≥ 30 years', labelEn: 'Age ≥ 30 years', labelHi: 'आयु ≥ 30 वर्ष' },
    ],
  },
  {
    key: 'numberOfChildren',
    promptEn: 'How many children do you have?',
    promptHi: 'रोगी की कुल संतानों की संख्या कितनी है?',
    options: [
      { internalValue: '0', labelEn: '0', labelHi: '0' },
      { internalValue: '1', labelEn: '1', labelHi: '1' },
      { internalValue: '2', labelEn: '2', labelHi: '2' },
      { internalValue: '3 or more', labelEn: '3 or more', labelHi: '3 या अधिक' },
    ],
  },
  {
    key: 'breastfeeding',
    promptEn: 'Do you have a history of breastfeeding?',
    promptHi: 'स्तनपान कराने का इतिहास क्या है?',
    options: [
      { internalValue: 'Yes (> 6 months)', labelEn: 'Yes (> 6 months)', labelHi: 'हाँ (> 6 महीने)' },
      { internalValue: 'Yes (< 6 months)', labelEn: 'Yes (< 6 months)', labelHi: 'हाँ (< 6 महीने)' },
      { internalValue: 'No / Never breastfed', labelEn: 'No / Never breastfed', labelHi: 'नहीं / कभी स्तनपान नहीं कराया' },
    ],
  },
  {
    key: 'contraceptives',
    promptEn: 'Have you used hormonal oral contraceptives?',
    promptHi: 'क्या हार्मोनल ओरल गर्भनिरोधक गोलियों का उपयोग किया है?',
    options: [
      { internalValue: 'Never used', labelEn: 'Never used', labelHi: 'कभी उपयोग नहीं किया' },
      { internalValue: 'Used < 1 year', labelEn: 'Used < 1 year', labelHi: 'उपयोग < 1 वर्ष' },
      { internalValue: 'Used 1–5 years', labelEn: 'Used 1–5 years', labelHi: 'उपयोग 1–5 वर्ष' },
      { internalValue: 'Used > 5 years (Long-term)', labelEn: 'Used > 5 years (Long-term)', labelHi: 'दीर्घकालिक उपयोग (> 5 वर्ष)' },
    ],
  },
  {
    key: 'familyHistory',
    promptEn: 'Do you have a family history of breast or ovarian cancer?',
    promptHi: 'क्या परिवार में स्तन या अंडाशय कैंसर का कोई इतिहास है?',
    options: [
      { internalValue: 'Yes (Mother / Sister / Daughter)', labelEn: 'Yes (Mother / Sister / Daughter)', labelHi: 'हाँ (माता / बहन / पुत्री)' },
      { internalValue: 'Yes (Aunt / Grandmother)', labelEn: 'Yes (Aunt / Grandmother)', labelHi: 'हाँ (मौसी / दादी / नानी)' },
      { internalValue: 'No family history', labelEn: 'No family history', labelHi: 'कोई पारिवारिक इतिहास नहीं' },
      { internalValue: 'Not sure', labelEn: 'Not sure', labelHi: 'निश्चित नहीं' },
    ],
  },
  {
    key: 'smoking',
    promptEn: 'What is your smoking status?',
    promptHi: 'धूम्रपान की स्थिति क्या है?',
    options: [
      { internalValue: 'Never smoked', labelEn: 'Never smoked', labelHi: 'कभी धूम्रपान नहीं किया' },
      { internalValue: 'Former smoker', labelEn: 'Former smoker', labelHi: 'पूर्व धूम्रपानकर्ता' },
      { internalValue: 'Current smoker', labelEn: 'Current smoker', labelHi: 'वर्तमान धूम्रपानकर्ता' },
    ],
  },
  {
    key: 'diet',
    promptEn: 'What best describes your general diet?',
    promptHi: 'सामान्य आहार किस प्रकार का है?',
    options: [
      { internalValue: 'Vegetarian', labelEn: 'Vegetarian', labelHi: 'शाकाहारी' },
      { internalValue: 'Non-vegetarian', labelEn: 'Non-vegetarian', labelHi: 'मांसाहारी' },
      { internalValue: 'High-fat diet', labelEn: 'High-fat diet', labelHi: 'उच्च वसायुक्त आहार' },
    ],
  },
];

export const CATEGORY_TRANSLATIONS: Record<string, { en: string; hi: string }> = {
  'Symptoms on Left Breast': {
    en: 'Symptoms on Left Breast',
    hi: 'बाएं स्तन पर लक्षण',
  },
  'Symptoms on Right Breast': {
    en: 'Symptoms on Right Breast',
    hi: 'दाएं स्तन पर लक्षण',
  },
  'Symptoms on Neck': {
    en: 'Symptoms on Neck',
    hi: 'गर्दन पर लक्षण',
  },
  'Symptoms on Left Arm': {
    en: 'Symptoms on Left Arm (Axilla)',
    hi: 'बाईं कांख पर लक्षण',
  },
  'Symptoms on Right Arm': {
    en: 'Symptoms on Right Arm (Axilla)',
    hi: 'दाईं कांख पर लक्षण',
  },
  'Respiratory Symptoms': {
    en: 'Respiratory Symptoms',
    hi: 'श्वसन तंत्र संबंधी लक्षण',
  },
  'CNS Symptoms': {
    en: 'Central Nervous System (CNS) Symptoms',
    hi: 'केंद्रीय तंत्रिका तंत्र (CNS) लक्षण',
  },
  'Under Muscular Skeleton': {
    en: 'Musculoskeletal Symptoms',
    hi: 'मांसपेशी एवं अस्थि लक्षण',
  },
};

export const SYMPTOM_TRANSLATIONS: Record<string, { en: string; hi: string }> = {
  // Left Breast
  'Symptoms on Left Breast – Palpable Lump / Abnormality': {
    en: 'Palpable Lump / Abnormality',
    hi: 'स्पर्शनीय गांठ / असामान्य उभार',
  },
  'Symptoms on Left Breast – Nipple Retraction / Inversion': {
    en: 'Nipple Retraction / Inversion',
    hi: 'निप्पल का अंदर धंसना या मुड़ना',
  },
  'Symptoms on Left Breast – Nipple Discharge': {
    en: 'Nipple Discharge',
    hi: 'निप्पल से असामान्य स्राव',
  },
  'Symptoms on Left Breast – Skin Dimpling': {
    en: 'Skin Dimpling',
    hi: 'त्वचा में गड्ढा पड़ना',
  },
  'Symptoms on Left Breast – Skin Thickening': {
    en: 'Skin Thickening',
    hi: 'त्वचा का मोटा होना',
  },
  'Symptoms on Left Breast – Itching of the Nipple Area': {
    en: 'Itching of the Nipple Area',
    hi: 'निप्पल क्षेत्र में खुजली',
  },
  'Symptoms on Left Breast – Redness': {
    en: 'Redness / Erythema',
    hi: 'लालिमा / प्रदाह',
  },
  'Symptoms on Left Breast – Ulcer / Open Sore': {
    en: 'Ulcer / Open Sore',
    hi: 'अल्सर / खुला घाव',
  },
  'Symptoms on Left Breast – Pain': {
    en: 'Localized Breast Pain',
    hi: 'स्तन में स्थानीय दर्द',
  },

  // Right Breast
  'Symptoms on Right Breast – Palpable Lump / Abnormality': {
    en: 'Palpable Lump / Abnormality',
    hi: 'स्पर्शनीय गांठ / असामान्य उभार',
  },
  'Symptoms on Right Breast – Nipple Retraction / Inversion': {
    en: 'Nipple Retraction / Inversion',
    hi: 'निप्पल का अंदर धंसना या मुड़ना',
  },
  'Symptoms on Right Breast – Nipple Discharge': {
    en: 'Nipple Discharge',
    hi: 'निप्पल से असामान्य स्राव',
  },
  'Symptoms on Right Breast – Skin Dimpling': {
    en: 'Skin Dimpling',
    hi: 'त्वचा में गड्ढा पड़ना',
  },
  'Symptoms on Right Breast – Skin Thickening': {
    en: 'Skin Thickening',
    hi: 'त्वचा का मोटा होना',
  },
  'Symptoms on Right Breast – Itching of the Nipple Area': {
    en: 'Itching of the Nipple Area',
    hi: 'निप्पल क्षेत्र में खुजली',
  },
  'Symptoms on Right Breast – Redness': {
    en: 'Redness / Erythema',
    hi: 'लालिमा / प्रदाह',
  },
  'Symptoms on Right Breast – Ulcer / Open Sore': {
    en: 'Ulcer / Open Sore',
    hi: 'अल्सर / खुला घाव',
  },
  'Symptoms on Right Breast – Pain': {
    en: 'Localized Breast Pain',
    hi: 'स्तन में स्थानीय दर्द',
  },

  // Neck
  'Symptoms on Neck – Lump': {
    en: 'Palpable Neck Lump',
    hi: 'गर्दन में गांठ',
  },
  'Symptoms on Neck – Swelling': {
    en: 'Neck Swelling',
    hi: 'गर्दन में सूजन',
  },
  'Symptoms on Neck – Bleeding': {
    en: 'Bleeding',
    hi: 'रक्तस्राव',
  },
  'Symptoms on Neck – Redness': {
    en: 'Redness',
    hi: 'लालिमा',
  },
  'Symptoms on Neck – Discoloration': {
    en: 'Skin Discoloration',
    hi: 'त्वचा का रंग बदलना',
  },
  'Symptoms on Neck – Wound': {
    en: 'Open Wound',
    hi: 'खुला घाव',
  },
  'Symptoms on Neck – Ulcer / Skin Changes': {
    en: 'Ulcer / Skin Changes',
    hi: 'अल्सर / त्वचा में बदलाव',
  },
  'Symptoms on Neck – Pain': {
    en: 'Neck Pain',
    hi: 'गर्दन में दर्द',
  },

  // Left Arm
  'Symptoms on Left Arm – Axillary (Armpit) Lump': {
    en: 'Axillary (Armpit) Lump',
    hi: 'कांख में गांठ',
  },
  'Symptoms on Left Arm – Swelling': {
    en: 'Arm Swelling / Lymphedema',
    hi: 'बांह में सूजन',
  },
  'Symptoms on Left Arm – Restricted Movement': {
    en: 'Restricted Shoulder/Arm Movement',
    hi: 'बांह या कंधे की गतिशीलता में रुकावट',
  },
  'Symptoms on Left Arm – Weakness': {
    en: 'Arm Weakness',
    hi: 'बांह में कमजोरी',
  },
  'Symptoms on Left Arm – Numbness': {
    en: 'Numbness / Tingling',
    hi: 'सुन्नपन / झुनझुनी',
  },
  'Symptoms on Left Arm – Bruising': {
    en: 'Bruising / Discoloration',
    hi: 'खरोंच / नील पड़ना',
  },
  'Symptoms on Left Arm – Pain': {
    en: 'Axillary or Arm Pain',
    hi: 'कांख या बांह में दर्द',
  },

  // Right Arm
  'Symptoms on Right Arm – Axillary (Armpit) Lump': {
    en: 'Axillary (Armpit) Lump',
    hi: 'कांख में गांठ',
  },
  'Symptoms on Right Arm – Swelling': {
    en: 'Arm Swelling / Lymphedema',
    hi: 'बांह में सूजन',
  },
  'Symptoms on Right Arm – Restricted Movement': {
    en: 'Restricted Shoulder/Arm Movement',
    hi: 'बांह या कंधे की गतिशीलता में रुकावट',
  },
  'Symptoms on Right Arm – Weakness': {
    en: 'Arm Weakness',
    hi: 'बांह में कमजोरी',
  },
  'Symptoms on Right Arm – Numbness': {
    en: 'Numbness / Tingling',
    hi: 'सुन्नपन / झुनझुनी',
  },
  'Symptoms on Right Arm – Bruising': {
    en: 'Bruising / Discoloration',
    hi: 'खरोंच / नील पड़ना',
  },
  'Symptoms on Right Arm – Pain': {
    en: 'Axillary or Arm Pain',
    hi: 'कांख या बांह में दर्द',
  },

  // Respiratory
  'Respiratory Symptoms – Cough': {
    en: 'Persistent Cough',
    hi: 'लगातार खांसी',
  },
  'Respiratory Symptoms – Breathlessness': {
    en: 'Breathlessness / Dyspnea',
    hi: 'सांस फूलना / सांस लेने में तकलीफ',
  },
  'Respiratory Symptoms – Chest Pain': {
    en: 'Chest Pain',
    hi: 'सीने में दर्द',
  },
  'Respiratory Symptoms – Wheezing': {
    en: 'Wheezing',
    hi: 'घरघराहट',
  },

  // CNS
  'CNS Symptoms – Headache': {
    en: 'Persistent / Severe Headache',
    hi: 'लगातार या तीव्र सिरदर्द',
  },
  'CNS Symptoms – Blurred Vision': {
    en: 'Blurred Vision / Visual Changes',
    hi: 'धुंधली दृष्टि / दृष्टि में बदलाव',
  },
  'CNS Symptoms – Giddiness': {
    en: 'Giddiness / Dizziness',
    hi: 'चक्कर आना',
  },
  'CNS Symptoms – Nausea': {
    en: 'Nausea',
    hi: 'जी मिचलाना',
  },
  'CNS Symptoms – Vomiting': {
    en: 'Vomiting',
    hi: 'उल्टी आना',
  },
  'CNS Symptoms – Convulsions': {
    en: 'Convulsions / Seizures',
    hi: 'दौरे पड़ना / ऐंठन',
  },

  // Musculoskeletal
  'Under Muscular Skeleton – Back Pain': {
    en: 'Persistent Back Pain',
    hi: 'लगातार पीठ दर्द',
  },
  'Under Muscular Skeleton – Joint Pain': {
    en: 'Joint Pain',
    hi: 'जोड़ों का दर्द',
  },
  'Under Muscular Skeleton – Shoulder Pain': {
    en: 'Shoulder Pain',
    hi: 'कंधे का दर्द',
  },
  'Under Muscular Skeleton – Underarm Pain': {
    en: 'Underarm Pain',
    hi: 'कांख के नीचे दर्द',
  },
  'Under Muscular Skeleton – Muscle Weakness': {
    en: 'Generalized Muscle Weakness',
    hi: 'मांसपेशियों में कमजोरी',
  },
  'Under Muscular Skeleton – Difficulty Moving': {
    en: 'Difficulty in Ambulation / Moving',
    hi: 'चलने-फिरने में कठिनाई',
  },
};

export function getCategoryLabel(categoryKey: string, lang: 'en' | 'hi'): string {
  const item = CATEGORY_TRANSLATIONS[categoryKey];
  if (!item) return categoryKey;
  return lang === 'hi' ? item.hi : item.en;
}

export function getSymptomLabel(convertedName: string, fallback: string, lang: 'en' | 'hi'): string {
  const item = SYMPTOM_TRANSLATIONS[convertedName];
  if (!item) return fallback;
  return lang === 'hi' ? item.hi : item.en;
}
