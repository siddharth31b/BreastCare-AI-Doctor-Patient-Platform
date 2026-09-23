/**
 * Base interface / contract for all Language Providers (Demo, Bhashini, etc.)
 */
class LanguageProviderInterface {
  async getSupportedLanguages() {
    throw new Error('getSupportedLanguages() must be implemented by provider');
  }

  async translate({ text, sourceLang = 'en', targetLang }) {
    throw new Error('translate() must be implemented by provider');
  }

  async speechToText({ audioBase64, language = 'hi' }) {
    throw new Error('speechToText() must be implemented by provider');
  }

  async textToSpeech({ text, language = 'hi', gender = 'female' }) {
    throw new Error('textToSpeech() must be implemented by provider');
  }
}

module.exports = LanguageProviderInterface;
