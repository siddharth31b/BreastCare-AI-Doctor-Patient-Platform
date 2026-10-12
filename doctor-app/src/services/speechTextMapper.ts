/**
 * Speech Text Mapper for NariSetu Doctor Platform
 *
 * Converts clinical UI strings, abbreviations, and mathematical notation (≥, ≤, <, >, /, &)
 * into natural, fluent spoken text for English and Hindi Orpheus TTS models.
 */

const NUMBER_WORDS_EN = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const NUMBER_WORDS_HI = ['एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस'];

/**
 * Normalizes symbols and notation into spoken words based on language
 */
export function normalizeSpokenText(rawText: string, language: 'en' | 'hi' = 'en'): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText.trim();

  if (language === 'hi') {
    // Hindi mappings
    text = text
      .replace(/आयु\s*≥\s*(\d+)\s*वर्ष/g, 'आयु $1 वर्ष या उससे अधिक')
      .replace(/उम्र\s*≥\s*(\d+)\s*वर्ष/g, 'उम्र $1 वर्ष या उससे अधिक')
      .replace(/≥\s*(\d+)/g, '$1 या उससे अधिक')
      .replace(/आयु\s*<\s*(\d+)\s*वर्ष/g, 'आयु $1 वर्ष से कम')
      .replace(/उम्र\s*<\s*(\d+)\s*वर्ष/g, 'उम्र $1 वर्ष से कम')
      .replace(/<\s*(\d+)\s*वर्ष/g, '$1 वर्ष से कम')
      .replace(/>\s*(\d+)\s*वर्ष/g, '$1 वर्ष से अधिक')
      .replace(/<\s*(\d+)\s*महीने/g, '$1 महीने से कम')
      .replace(/>\s*(\d+)\s*महीने/g, '$1 महीने से अधिक')
      .replace(/<\s*(\d+)\s*वर्ष/g, '$1 वर्ष से कम')
      .replace(/(\d+)\s*[–-]\s*(\d+)\s*वर्ष/g, '$1 से $2 वर्ष')
      .replace(/(\d+)\s*[–-]\s*(\d+)/g, '$1 से $2')
      .replace(/N\/A/gi, 'लागू नहीं')
      .replace(/\s*\/\s*/g, ' या ')
      .replace(/\s*&\s*/g, ' एवं ')
      .replace(/•/g, '')
      .replace(/✓/g, 'सत्यापित')
      .replace(/\s+/g, ' ')
      .trim();

    return text;
  }

  // English mappings
  text = text
    .replace(/Age\s*≥\s*(\d+)\s*years/gi, 'Age $1 years or older')
    .replace(/≥\s*(\d+)\s*years/gi, '$1 years or older')
    .replace(/≥\s*(\d+)/g, '$1 or older')
    .replace(/Age\s*<\s*(\d+)\s*years/gi, 'Age less than $1 years')
    .replace(/<\s*(\d+)\s*years/gi, 'Less than $1 years')
    .replace(/>\s*(\d+)\s*years/gi, 'Greater than $1 years')
    .replace(/<\s*(\d+)\s*months/gi, 'Less than $1 months')
    .replace(/>\s*(\d+)\s*months/gi, 'More than $1 months')
    .replace(/(\d+)\s*[–-]\s*(\d+)\s*years/gi, '$1 to $2 years')
    .replace(/(\d+)\s*[–-]\s*(\d+)/g, '$1 to $2')
    .replace(/N\/A/gi, 'not applicable')
    .replace(/\s*\/\s*/g, ' or ')
    .replace(/\s*&\s*/g, ' and ')
    .replace(/•/g, '')
    .replace(/✓/g, 'verified')
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}

/**
 * Strips leading ordinal/numbering prefixes from option labels (e.g. "1. Left Breast" -> "Left Breast")
 * to guarantee that speech synthesis never speaks duplicate ordinals ("1. 1. Left Breast" or "one 1").
 *
 * Supported patterns stripped:
 * - "1. ", "01. ", "01 ", "1) ", "(1) ", "[1] ", "1: ", "1 - ", "1 – " (ensuring ranges like "30–40" are NOT stripped)
 * - Devanagari numerals: "१. ", "२. ", "१) ", "(१) ", "१: ", "१ - "
 * - Word prefixes: "Option 1:", "Option 1.", "विकल्प 1:", "विकल्प १:"
 * - Letter prefixes: "A. ", "a) ", "(A) ", "A: "
 */
export function stripLeadingOptionOrdinal(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';
  let text = rawText.trim();

  let prev = '';
  // Run up to 3 passes to strip any double-prefixes (e.g. "1. 1. Left Breast" -> "Left Breast")
  for (let i = 0; i < 3; i++) {
    prev = text;

    // 1. Remove explicit word prefixes: "Option 1:", "Option 1.", "विकल्प 1:", "विकल्प १:", etc.
    text = text
      .replace(/^(?:option\s+[0-9a-zA-Z]+\s*[\.\:\-–]\s*|विकल्प\s+[0-9०-९ivxlc]+\s*[\.\:\-–।]\s*)/i, '')
      .trim();

    // 2. Remove numeric/letter prefixes like "1. ", "01. ", "01 ", "1) ", "(1) ", "[1] ", "A. ", "a) ", "१. ", "१) ", etc.
    // Note: For dash/hyphen, negative lookahead (?!\d) ensures ranges like "30–40 years" are NEVER matched.
    const cleaned = text
      .replace(
        /^(?:[\(\[]?\s*(?:\d+|[०-९]+|[a-zA-Z])\s*[\.\)\:\]](?:\s*[-–]\s*)?|0\d\s+|[\(\[]?\s*(?:\d+|[०-९]+)\s*[-–]\s*(?!\d))\s*/,
        ''
      )
      .trim();

    if (cleaned.length > 0) {
      text = cleaned;
    }
    if (text === prev) break;
  }

  return text.length > 0 ? text : rawText.trim();
}

/**
 * Formats a single-choice clinical question along with numbered options for speech
 *
 * Example (English):
 * "Which side is experiencing symptoms? 1. Left Breast. 2. Right Breast. 3. Both Breasts. 4. No breast symptoms."
 *
 * Example (Hindi):
 * "किस तरफ लक्षण अनुभव हो रहे हैं? 1. बायां स्तन। 2. दायां स्तन। 3. दोनों स्तन। 4. कोई स्तन लक्षण नहीं।"
 */
export function formatQuestionWithOptionsSpeech(
  prompt: string,
  options?: { label: string }[],
  language: 'en' | 'hi' = 'en'
): string {
  const cleanPrompt = normalizeSpokenText(prompt, language);
  if (!options || options.length === 0) {
    return cleanPrompt;
  }

  const spokenOptions = options.map((opt, idx) => {
    // Intelligently strip any leading ordinal prefix so that one option has exactly one spoken ordinal ("1. Left Breast")
    const deNumbered = stripLeadingOptionOrdinal(opt.label);
    const cleanOpt = normalizeSpokenText(deNumbered, language);
    const optEnd = language === 'hi'
      ? (/[।\?!]$/.test(cleanOpt) ? '' : '।')
      : (/[\.\?!]$/.test(cleanOpt) ? '' : '.');

    return `${idx + 1}. ${cleanOpt}${optEnd}`;
  });

  const promptEnd = language === 'hi'
    ? (/[।\?]$/.test(cleanPrompt) ? ' ' : '। ')
    : (/[\.\?!]$/.test(cleanPrompt) ? ' ' : '. ');

  return `${cleanPrompt}${promptEnd}${spokenOptions.join(' ')}`;
}

/**
 * Formats a checklist clinical category for speech
 */
export function formatChecklistSpeech(
  categoryTitle: string,
  options: { label: string }[],
  language: 'en' | 'hi' = 'en'
): string {
  const cleanTitle = normalizeSpokenText(categoryTitle, language);
  const optionsList = options
    .map(o => normalizeSpokenText(stripLeadingOptionOrdinal(o.label), language))
    .join(language === 'hi' ? ', ' : ', ');

  if (language === 'hi') {
    return `${cleanTitle}। कृपया लागू होने वाले लक्षण बताएं: ${optionsList}।`;
  }
  return `${cleanTitle}. Clinical symptoms checklist: ${optionsList}.`;
}

/**
 * Formats an answered prompt and selected answer for "Listen Assessment" sequential narration
 */
export function formatRecordedAnswerSpeech(
  question: string,
  answer: string,
  language: 'en' | 'hi' = 'en'
): string {
  const cleanQ = normalizeSpokenText(question, language);
  const cleanA = normalizeSpokenText(stripLeadingOptionOrdinal(answer), language);

  if (language === 'hi') {
    return `${cleanQ}। दर्ज उत्तर: ${cleanA}।`;
  }
  return `${cleanQ}. Recorded answer: ${cleanA}.`;
}
