const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const orpheusTTS = require('../services/orpheusTTS');

/**
 * GET /api/tts/config
 * Diagnostic endpoint for TTS engine configuration
 */
router.get('/config', authenticate, (req, res) => {
  const config = orpheusTTS.getTTSConfig();
  res.status(200).json({
    success: true,
    config,
  });
});

/**
 * POST /api/tts/synthesize
 * Protected speech synthesis endpoint using Ollama / Orpheus
 *
 * Request body:
 * {
 *   "text": "Clinical question or option text",
 *   "language": "en" | "hi"
 * }
 */
router.post('/synthesize', authenticate, async (req, res, next) => {
  try {
    const { text, language } = req.body;

    // 1. Validate text presence and type
    if (text === undefined || text === null || typeof text !== 'string') {
      return res.status(400).json({
        error: {
          message: "Validation Error: 'text' is required and must be a string.",
          status: 400,
        },
      });
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      return res.status(400).json({
        error: {
          message: "Validation Error: 'text' cannot be empty.",
          status: 400,
        },
      });
    }

    if (trimmedText.length > 1500) {
      return res.status(400).json({
        error: {
          message: "Validation Error: 'text' exceeds maximum length of 1500 characters.",
          status: 400,
        },
      });
    }

    // 2. Validate language
    if (!language || typeof language !== 'string') {
      return res.status(400).json({
        error: {
          message: "Validation Error: 'language' is required (expected 'en' or 'hi').",
          status: 400,
        },
      });
    }

    const normalizedLang = language.toLowerCase().trim();
    if (normalizedLang !== 'en' && normalizedLang !== 'hi') {
      return res.status(400).json({
        error: {
          message: `Validation Error: Unsupported language '${language}'. Supported languages are 'en' and 'hi'.`,
          status: 400,
        },
      });
    }

    // 3. Synthesize via Orpheus TTS Service
    const result = await orpheusTTS.synthesizeSpeech({
      text: trimmedText,
      language: normalizedLang,
    });

    // 4. Safe technical logging (no sensitive clinical data or patient names)
    console.log(
      `[TTS] Generated speech | Lang: ${result.language} | Model: ${result.model} | Format: ${result.format} | Fallback: ${result.isFallback} | Duration: ${result.durationMs}ms`
    );

    return res.status(200).json({
      success: true,
      audioBase64: result.audioBase64,
      audio: result.audioBase64,
      format: result.format,
      mimeType: result.format === 'wav' ? 'audio/wav' : 'audio/mpeg',
      language: result.language,
      model: result.model,
      provider: result.provider,
      isFallback: result.isFallback,
      durationMs: result.durationMs,
    });
  } catch (err) {
    console.error('[TTS Error]', err.message);
    return res.status(500).json({
      error: {
        message: 'Speech synthesis failed. Please try again.',
        status: 500,
      },
    });
  }
});

module.exports = router;
