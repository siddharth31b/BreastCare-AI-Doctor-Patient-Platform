const express = require('express');
const router = express.Router();
const languageService = require('../services/language/LanguageService');

/**
 * GET /api/language/languages
 * Get supported languages and provider status
 */
router.get('/languages', async (req, res, next) => {
  try {
    const languages = await languageService.getSupportedLanguages();
    res.status(200).json({
      success: true,
      provider: languageService.getProviderName(),
      languages
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/language/translate
 * Translate text to target language
 */
router.post('/translate', async (req, res, next) => {
  try {
    const { text, targetLang, sourceLang = 'en' } = req.body;
    if (!text || !targetLang) {
      return res.status(400).json({ error: { message: 'text and targetLang are required', status: 400 } });
    }

    const result = await languageService.translate({ text, sourceLang, targetLang });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/language/stt
 * Speech to Text (Speech recognition)
 */
router.post('/stt', async (req, res, next) => {
  try {
    const { audioBase64, language = 'hi', promptHint = '' } = req.body;
    const result = await languageService.speechToText({ audioBase64, language, promptHint });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/language/tts
 * Text to Speech
 */
router.post('/tts', async (req, res, next) => {
  try {
    const { text, language = 'hi', gender = 'female' } = req.body;
    if (!text) {
      return res.status(400).json({ error: { message: 'text is required', status: 400 } });
    }

    const result = await languageService.textToSpeech({ text, language, gender });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
