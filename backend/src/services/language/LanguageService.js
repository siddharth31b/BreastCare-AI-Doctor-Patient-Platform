const DemoLanguageProvider = require('./DemoLanguageProvider');
const BhashiniLanguageProvider = require('./BhashiniLanguageProvider');

class LanguageService {
  constructor() {
    this.providerType = process.env.LANGUAGE_PROVIDER || 'demo';
    this.initProvider();
  }

  initProvider() {
    if (this.providerType === 'bhashini' && process.env.BHASHINI_API_KEY) {
      console.log('[LanguageService] Initializing BhashiniLanguageProvider');
      this.provider = new BhashiniLanguageProvider();
    } else {
      if (this.providerType === 'bhashini') {
        console.warn('[LanguageService] LANGUAGE_PROVIDER is set to bhashini, but credentials are missing. Falling back to DemoLanguageProvider.');
      }
      this.provider = new DemoLanguageProvider();
    }
  }

  getProviderName() {
    return this.provider.name;
  }

  async getSupportedLanguages() {
    return await this.provider.getSupportedLanguages();
  }

  async translate({ text, sourceLang = 'en', targetLang }) {
    return await this.provider.translate({ text, sourceLang, targetLang });
  }

  async speechToText({ audioBase64, language = 'hi', promptHint = '' }) {
    return await this.provider.speechToText({ audioBase64, language, promptHint });
  }

  async textToSpeech({ text, language = 'hi', gender = 'female' }) {
    return await this.provider.textToSpeech({ text, language, gender });
  }
}

module.exports = new LanguageService();
