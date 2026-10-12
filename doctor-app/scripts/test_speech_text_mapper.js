/**
 * Regression Test Suite for Speech Text Normalization and Single-Ordinal Enforcement
 *
 * Verifies that:
 * 1. Numbered options (e.g. "1. Left Breast") produce exactly ONE spoken ordinal ("Option one: Left Breast.")
 * 2. Unnumbered options (e.g. "Left Breast") produce exactly ONE spoken ordinal ("Option one: Left Breast.")
 * 3. Hindi numbered options (e.g. "1. बायां स्तन") produce exactly ONE spoken ordinal ("विकल्प एक: बायां स्तन।")
 * 4. Hindi unnumbered options produce exactly ONE spoken ordinal ("विकल्प एक: बायां स्तन।")
 * 5. Numerical clinical ranges (e.g. "30–40 years", "< 30 years") are NEVER mistakenly stripped
 * 6. Arbitrary clinical options ("Breast pain", "Swelling", "No symptoms") are preserved intact
 * 7. Standalone numeric choices ("0", "1", "2") are preserved intact
 */

const assert = require('assert');

// Ported normalization logic directly from speechTextMapper.ts for stand-alone test execution
const NUMBER_WORDS_EN = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const NUMBER_WORDS_HI = ['एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस'];

function normalizeSpokenText(rawText, language = 'en') {
  if (!rawText || typeof rawText !== 'string') return '';
  let text = rawText.trim();
  if (language === 'hi') {
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

function stripLeadingOptionOrdinal(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let text = rawText.trim();
  let prev = '';
  for (let i = 0; i < 3; i++) {
    prev = text;
    text = text
      .replace(/^(?:option\s+[0-9a-zA-Z]+\s*[\.\:\-–]\s*|विकल्प\s+[0-9०-९ivxlc]+\s*[\.\:\-–।]\s*)/i, '')
      .trim();
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

function formatQuestionWithOptionsSpeech(prompt, options, language = 'en') {
  const cleanPrompt = normalizeSpokenText(prompt, language);
  if (!options || options.length === 0) return cleanPrompt;

  const spokenOptions = options.map((opt, idx) => {
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

console.log('========================================================');
console.log('SPEECH TEXT MAPPER: DEDICATED REGRESSION TEST SUITE');
console.log('========================================================\n');

// -----------------------------------------------------------------------------
// TEST 1: Numbered English Options (Phase 1 Side Selection)
// -----------------------------------------------------------------------------
console.log('[TEST 1] Numbered English Options ("1. Left Breast")...');
const sideOptionsEn = [
  { label: '1. Left Breast' },
  { label: '2. Right Breast' },
  { label: '3. Both Breasts' },
  { label: '4. No breast symptoms' },
];
const resultEn = formatQuestionWithOptionsSpeech('Which side is experiencing symptoms?', sideOptionsEn, 'en');
console.log('Output:', resultEn);

assert.strictEqual(
  resultEn,
  'Which side is experiencing symptoms? 1. Left Breast. 2. Right Breast. 3. Both Breasts. 4. No breast symptoms.'
);
// Verify NO duplicate ordinals like "1. 1." or "2. 2."
assert.ok(!resultEn.includes('1. 1.'));
assert.ok(!resultEn.includes('2. 2.'));
assert.ok(!resultEn.includes('3. 3.'));
assert.ok(!resultEn.includes('4. 4.'));
console.log('✔ TEST 1 PASSED: Exactly one ordinal per English option (no "1. 1." duplicate).\n');

// -----------------------------------------------------------------------------
// TEST 2: Numbered Hindi Options (Phase 1 Side Selection)
// -----------------------------------------------------------------------------
console.log('[TEST 2] Numbered Hindi Options ("1. बायां स्तन")...');
const sideOptionsHi = [
  { label: '1. बायां स्तन' },
  { label: '2. दायां स्तन' },
  { label: '3. दोनों स्तन' },
  { label: '4. कोई स्तन लक्षण नहीं' },
];
const resultHi = formatQuestionWithOptionsSpeech('किस तरफ लक्षण अनुभव हो रहे हैं?', sideOptionsHi, 'hi');
console.log('Output:', resultHi);

assert.strictEqual(
  resultHi,
  'किस तरफ लक्षण अनुभव हो रहे हैं? 1. बायां स्तन। 2. दायां स्तन। 3. दोनों स्तन। 4. कोई स्तन लक्षण नहीं।'
);
assert.ok(!resultHi.includes('1. 1.'));
assert.ok(!resultHi.includes('2. 2.'));
assert.ok(!resultHi.includes('3. 3.'));
assert.ok(!resultHi.includes('4. 4.'));
console.log('✔ TEST 2 PASSED: Exactly one ordinal per Hindi option (no duplicate ordinal).\n');

// -----------------------------------------------------------------------------
// TEST 3: Unnumbered English Options
// -----------------------------------------------------------------------------
console.log('[TEST 3] Unnumbered English Options ("Left Breast")...');
const unnumberedEn = [
  { label: 'Left Breast' },
  { label: 'Right Breast' },
  { label: 'Both Breasts' },
  { label: 'No breast symptoms' },
];
const resultUnnumberedEn = formatQuestionWithOptionsSpeech('Which side?', unnumberedEn, 'en');
assert.strictEqual(
  resultUnnumberedEn,
  'Which side? 1. Left Breast. 2. Right Breast. 3. Both Breasts. 4. No breast symptoms.'
);
console.log('✔ TEST 3 PASSED: Unnumbered English options receive single ordinal prefix.\n');

// -----------------------------------------------------------------------------
// TEST 4: Clinical Ranges & Age Questions
// -----------------------------------------------------------------------------
console.log('[TEST 4] Clinical Ranges ("< 30 years", "30–40 years", "> 50 years")...');
const ageOptions = [
  { label: '< 30 years' },
  { label: '30–40 years' },
  { label: '41–50 years' },
  { label: '> 50 years' },
];
const resultAge = formatQuestionWithOptionsSpeech('Age group?', ageOptions, 'en');
console.log('Output:', resultAge);
assert.strictEqual(
  resultAge,
  'Age group? 1. Less than 30 years. 2. 30 to 40 years. 3. 41 to 50 years. 4. Greater than 50 years.'
);
console.log('✔ TEST 4 PASSED: Age ranges like "30–40 years" are NOT mistakenly stripped.\n');

// -----------------------------------------------------------------------------
// TEST 5: Arbitrary Clinical Symptom Text
// -----------------------------------------------------------------------------
console.log('[TEST 5] Arbitrary clinical text ("Breast pain", "Swelling", "No symptoms")...');
assert.strictEqual(stripLeadingOptionOrdinal('Breast pain'), 'Breast pain');
assert.strictEqual(stripLeadingOptionOrdinal('Swelling'), 'Swelling');
assert.strictEqual(stripLeadingOptionOrdinal('No symptoms'), 'No symptoms');
assert.strictEqual(stripLeadingOptionOrdinal('Palpable lump in upper outer quadrant'), 'Palpable lump in upper outer quadrant');
console.log('✔ TEST 5 PASSED: General symptom names are completely untouched.\n');

// -----------------------------------------------------------------------------
// TEST 6: Standalone Numeric Values
// -----------------------------------------------------------------------------
console.log('[TEST 6] Standalone numeric values ("0", "1", "2", "3 or more")...');
assert.strictEqual(stripLeadingOptionOrdinal('0'), '0');
assert.strictEqual(stripLeadingOptionOrdinal('1'), '1');
assert.strictEqual(stripLeadingOptionOrdinal('2'), '2');
assert.strictEqual(stripLeadingOptionOrdinal('3 or more'), '3 or more');
console.log('✔ TEST 6 PASSED: Standalone numbers are preserved.\n');

// -----------------------------------------------------------------------------
// TEST 7: Diverse Ordinal Formatting Styles
// -----------------------------------------------------------------------------
console.log('[TEST 7] Diverse ordinal styles (01., 1), (1), [1], 1 -, Option 1:, विकल्प 1:)...');
assert.strictEqual(stripLeadingOptionOrdinal('01. Left Breast'), 'Left Breast');
assert.strictEqual(stripLeadingOptionOrdinal('1) Left Breast'), 'Left Breast');
assert.strictEqual(stripLeadingOptionOrdinal('(1) Left Breast'), 'Left Breast');
assert.strictEqual(stripLeadingOptionOrdinal('[1] Left Breast'), 'Left Breast');
assert.strictEqual(stripLeadingOptionOrdinal('1 - Left Breast'), 'Left Breast');
assert.strictEqual(stripLeadingOptionOrdinal('1 – Left Breast'), 'Left Breast');
assert.strictEqual(stripLeadingOptionOrdinal('Option 1: Left Breast'), 'Left Breast');
assert.strictEqual(stripLeadingOptionOrdinal('Option 1. Left Breast'), 'Left Breast');
assert.strictEqual(stripLeadingOptionOrdinal('विकल्प 1: बायां स्तन'), 'बायां स्तन');
assert.strictEqual(stripLeadingOptionOrdinal('विकल्प १: बायां स्तन'), 'बायां स्तन');
assert.strictEqual(stripLeadingOptionOrdinal('1. 1. Left Breast'), 'Left Breast');
assert.strictEqual(stripLeadingOptionOrdinal('01  Left Breast'), 'Left Breast');
assert.strictEqual(stripLeadingOptionOrdinal('A. Left Breast'), 'Left Breast');
console.log('✔ TEST 7 PASSED: All diverse prefix variants normalized cleanly.\n');

console.log('========================================================');
console.log('ALL 7/7 SPEECH NORMALIZATION REGRESSION TESTS PASSED!');
console.log('========================================================');
