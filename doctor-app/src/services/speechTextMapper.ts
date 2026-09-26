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
 * Formats a single-choice clinical question along with numbered options for speech
 *
 * Example (English):
 * "What was your age at first childbirth?
 * Option one: No children.
 * Option two: Age less than 30 years.
 * Option three: Age 30 years or older."
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
    const cleanOpt = normalizeSpokenText(opt.label, language);
    if (language === 'hi') {
      const numWord = NUMBER_WORDS_HI[idx] || String(idx + 1);
      return `विकल्प ${numWord}: ${cleanOpt}।`;
    }
    const numWord = NUMBER_WORDS_EN[idx] || String(idx + 1);
    return `Option ${numWord}: ${cleanOpt}.`;
  });

  const separator = language === 'hi' ? ' ' : ' ';
  return `${cleanPrompt}${language === 'hi' ? '। ' : ' '} ${spokenOptions.join(separator)}`;
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
  const optionsList = options.map(o => normalizeSpokenText(o.label, language)).join(language === 'hi' ? ', ' : ', ');

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
  const cleanA = normalizeSpokenText(answer, language);

  if (language === 'hi') {
    return `${cleanQ}। दर्ज उत्तर: ${cleanA}।`;
  }
  return `${cleanQ}. Recorded answer: ${cleanA}.`;
}
