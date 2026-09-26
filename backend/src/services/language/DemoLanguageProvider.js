const LanguageProviderInterface = require('./LanguageProviderInterface');

// Common clinical question and phrase dictionaries in Indian languages
const CLINICAL_TRANSLATIONS = {
  hi: {
    'Symptoms on Left Breast': 'बाएं स्तन के लक्षण',
    'Symptoms on Right Breast': 'दाएं स्तन के लक्षण',
    'Symptoms on Neck': 'गर्दन के लक्षण',
    'Symptoms on Left Arm': 'बाईं बांह के लक्षण',
    'Symptoms on Right Arm': 'दाईं बांह के लक्षण',
    'Respiratory Symptoms': 'श्वसन संबंधी लक्षण',
    'CNS Symptoms': 'केंद्रीय तंत्रिका तंत्र के लक्षण',
    'Under Muscular Skeleton': 'मांसपेशी एवं कंकाल प्रणाली के लक्षण',
    'Palpable Lump / Abnormality': 'महसूस होने वाली गांठ / असामान्यता',
    'Nipple Retraction / Inversion': 'निपल का अंदर धंसना',
    'Nipple Discharge': 'निपल से स्राव (डिस्चार्ज)',
    'Skin Dimpling': 'त्वचा पर गड्ढे पड़ना',
    'Skin Thickening': 'त्वचा का मोटा होना',
    'Itching of the Nipple Area': 'निपल क्षेत्र में खुजली',
    'Redness': 'लालिमा / लाल चकत्ते',
    'Ulcer / Open Sore': 'अल्सर / खुला घाव',
    'Pain': 'दर्द',
    'Swelling': 'सूजन',
    'Lump': 'गांठ',
    'Bleeding': 'खून बहना',
    'Axillary (Armpit) Lump': 'कांख (आर्मपिट) में गांठ',
    'Cough': 'खांसी',
    'Breathlessness': 'सांस फूलना',
    'Chest Pain': 'सीने में दर्द',
    'Headache': 'सिरदर्द',
    'Giddiness': 'चक्कर आना',
    'Back Pain': 'पीठ में दर्द',
    'Yes': 'हाँ',
    'No': 'नहीं',
    'Listen': 'सुनें',
    'Speak': 'बोलें',
    'Listening...': 'सुन रहे हैं...'
  },
  mr: {
    'Symptoms on Left Breast': 'डाव्या स्तनावरील लक्षणे',
    'Symptoms on Right Breast': 'उजव्या स्तनावरील लक्षणे',
    'Symptoms on Neck': 'मानेवरील लक्षणे',
    'Palpable Lump / Abnormality': 'हाताला जाणवणारी गाठ / विकृती',
    'Pain': 'वेदना / त्रास',
    'Swelling': 'सूज',
    'Yes': 'होय',
    'No': 'नाही'
  },
  bn: {
    'Symptoms on Left Breast': 'বাম স্তনের উপসর্গ',
    'Symptoms on Right Breast': 'ডান স্তনের উপসর্গ',
    'Palpable Lump / Abnormality': 'হাতে অনুভূত পিণ্ড / চাকা',
    'Pain': 'ব্যথা',
    'Yes': 'হ্যাঁ',
    'No': 'না'
  },
  ta: {
    'Symptoms on Left Breast': 'இடது மார்பகத்தின் அறிகுறிகள்',
    'Symptoms on Right Breast': 'வலது மார்பகத்தின் அறிகுறிகள்',
    'Palpable Lump / Abnormality': 'தொட்டு உணரக்கூடிய கட்டி',
    'Pain': 'வலி',
    'Yes': 'ஆம்',
    'No': 'இல்லை'
  },
  te: {
    'Symptoms on Left Breast': 'ఎడమ రొమ్ము లక్షణాలు',
    'Symptoms on Right Breast': 'కుడి రొమ్ము లక్షణాలు',
    'Palpable Lump / Abnormality': 'చేతికి తగిలే గడ్డ / అసాధారణత',
    'Pain': 'నొప్పి',
    'Yes': 'అవును',
    'No': 'కాదు'
  }
};

class DemoLanguageProvider extends LanguageProviderInterface {
  constructor() {
    super();
    this.name = 'DemoLanguageProvider (MOCK MODE)';
  }

  async getSupportedLanguages() {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' }
    ];
  }

  async translate({ text, sourceLang = 'en', targetLang }) {
    if (targetLang === 'en' || !targetLang) {
      return { translatedText: text, provider: 'demo', sourceLang, targetLang };
    }

    const dict = CLINICAL_TRANSLATIONS[targetLang] || {};

    // Exact dictionary match
    if (dict[text]) {
      return { translatedText: dict[text], provider: 'demo', sourceLang, targetLang };
    }

    // Partial term match
    for (const [enTerm, localized] of Object.entries(dict)) {
      if (text.includes(enTerm)) {
        const substituted = text.replace(new RegExp(enTerm, 'g'), localized);
        return { translatedText: substituted, provider: 'demo', sourceLang, targetLang };
      }
    }

    // Demo placeholder fallback for unmapped strings
    return {
      translatedText: `[${targetLang.toUpperCase()} Demo] ${text}`,
      provider: 'demo',
      sourceLang,
      targetLang
    };
  }

  async speechToText({ audioBase64, language = 'hi', promptHint = '' }) {
    // In demo mode, simulate recognition based on speech prompt hint or standard affirmations
    let recognizedText = 'हाँ (Yes)';
    let confidence = 0.94;

    if (promptHint && promptHint.toLowerCase().includes('no')) {
      recognizedText = 'नहीं (No)';
    }

    return {
      transcript: recognizedText,
      confidence,
      language,
      provider: 'demo',
      isDemo: true,
      note: 'BHASHINI mock simulation mode. Awaiting production API credentials.'
    };
  }

  async textToSpeech({ text, language = 'hi', gender = 'female' }) {
    try {
      const orpheusTTS = require('../orpheusTTS');
      const result = await orpheusTTS.synthesizeSpeech({ text, language });
      return {
        audioUrl: null,
        audioBase64: result.audioBase64,
        format: result.format || 'mp3',
        language,
        provider: 'demo',
        isDemo: true,
        text
      };
    } catch (err) {
      return {
        audioUrl: null,
        audioBase64: 'UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
        format: 'wav',
        language,
        provider: 'demo',
        isDemo: true,
        text
      };
    }
  }
}

module.exports = DemoLanguageProvider;
