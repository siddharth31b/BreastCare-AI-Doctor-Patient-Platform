const LanguageProviderInterface = require('./LanguageProviderInterface');

/**
 * Production Bhashini Language Provider
 * Integrates with India National Language Translation Mission (ULCA/DHRUVA APIs)
 * Activated when LANGUAGE_PROVIDER=bhashini and BHASHINI_API_KEY is provided.
 */
class BhashiniLanguageProvider extends LanguageProviderInterface {
  constructor(config = {}) {
    super();
    this.name = 'BhashiniLanguageProvider (Government ULCA/Dhruva Pipeline)';
    this.endpoint = config.endpoint || process.env.BHASHINI_ENDPOINT || 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';
    this.apiKey = config.apiKey || process.env.BHASHINI_API_KEY;
    this.userId = config.userId || process.env.BHASHINI_USER_ID;
  }

  async getSupportedLanguages() {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
      { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
      { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' }
    ];
  }

  async translate({ text, sourceLang = 'en', targetLang }) {
    if (!this.apiKey) {
      throw new Error('BHASHINI_API_KEY not configured. Set LANGUAGE_PROVIDER=demo for mock mode.');
    }
    // Production call to Dhruva translation pipeline
    const payload = {
      pipelineTasks: [{
        taskType: 'translation',
        config: {
          language: {
            sourceLanguage: sourceLang,
            targetLanguage: targetLang
          }
        }
      }],
      inputData: {
        input: [{ source: text }]
      }
    };

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey,
        'userID': this.userId || ''
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`BHASHINI translation failed with HTTP status ${res.status}`);
    }

    const data = await res.json();
    const translatedText = data.pipelineResponse?.[0]?.output?.[0]?.target || text;
    return { translatedText, provider: 'bhashini', sourceLang, targetLang };
  }

  async speechToText({ audioBase64, language = 'hi' }) {
    if (!this.apiKey) {
      throw new Error('BHASHINI_API_KEY not configured.');
    }
    const payload = {
      pipelineTasks: [{
        taskType: 'asr',
        config: {
          language: { sourceLanguage: language },
          audioFormat: 'wav'
        }
      }],
      inputData: {
        audio: [{ audioContent: audioBase64 }]
      }
    };

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey,
        'userID': this.userId || ''
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`BHASHINI ASR failed with HTTP status ${res.status}`);
    }

    const data = await res.json();
    const transcript = data.pipelineResponse?.[0]?.output?.[0]?.source || '';
    return { transcript, language, provider: 'bhashini', isDemo: false };
  }

  async textToSpeech({ text, language = 'hi', gender = 'female' }) {
    if (!this.apiKey) {
      throw new Error('BHASHINI_API_KEY not configured.');
    }
    const payload = {
      pipelineTasks: [{
        taskType: 'tts',
        config: {
          language: { sourceLanguage: language },
          gender
        }
      }],
      inputData: {
        input: [{ source: text }]
      }
    };

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey,
        'userID': this.userId || ''
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`BHASHINI TTS failed with HTTP status ${res.status}`);
    }

    const data = await res.json();
    const audioBase64 = data.pipelineResponse?.[0]?.audio?.[0]?.audioContent || '';
    return { audioBase64, language, provider: 'bhashini', isDemo: false };
  }
}

module.exports = BhashiniLanguageProvider;
