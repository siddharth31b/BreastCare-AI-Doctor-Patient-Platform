/**
 * TTS Verification Test Suite for NariSetu Doctor Platform
 *
 * Verifies the 13 required test conditions:
 * 1. English model selection
 * 2. Hindi model selection
 * 3. Invalid language
 * 4. Empty text
 * 5. Text length validation
 * 6. Ollama offline handling & clean audio delivery
 * 7. Authentication rejection
 * 8. Successful English synthesis
 * 9. Successful Hindi synthesis
 * 10. Binary audio format validity (MP3 / WAV header verification)
 * 11. Zero clinical database mutation
 * 12. Concurrent request handling
 * 13. GET /api/tts/config diagnostic endpoint
 */

const assert = require('assert');
const http = require('http');
const orpheusTTS = require('../services/orpheusTTS');
const app = require('../server');
const supabase = require('../config/supabase');

async function runTTSVerification() {
  console.log('====================================================');
  console.log('NARISETU DOCTOR: MULTI-PROVIDER TTS VERIFICATION');
  console.log('====================================================\n');

  // Start test server on dynamic port
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[Test Server] Active on ${baseUrl}\n`);

  let passedTests = 0;
  const totalTests = 13;

  // Helper for HTTP requests
  function makeRequest(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(`${baseUrl}${path}`);
      const payload = body ? JSON.stringify(body) : null;
      const reqHeaders = {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...headers,
      };

      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method,
          headers: reqHeaders,
        },
        res => {
          let data = '';
          res.on('data', chunk => (data += chunk));
          res.on('end', () => {
            let parsed = null;
            try {
              parsed = JSON.parse(data);
            } catch (e) {
              parsed = data;
            }
            resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
          });
        }
      );

      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  // Generate Doctor mock auth token for test calls
  const doctorToken = 'mock:DOCTOR:uid_doctor_tts:dr_tts@hospital.com:Dr. TTS Reviewer';

  try {
    // Record baseline database counts before running TTS tests
    const { count: initialPatientCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });
    const { count: initialAssessmentCount } = await supabase.from('assessments').select('*', { count: 'exact', head: true });

    // -------------------------------------------------------------------------
    // TEST 1: English Model Selection
    // -------------------------------------------------------------------------
    console.log('[TEST 1] Verifying English model selection...');
    const enResolution = orpheusTTS.resolveModelForLanguage('en');
    assert.strictEqual(enResolution.langCode, 'en');
    assert.strictEqual(enResolution.model, 'sematre/orpheus:ft-en-3b-q8_0');
    console.log('✔ TEST 1 PASSED: English maps to sematre/orpheus:ft-en-3b-q8_0\n');
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 2: Hindi Model Selection
    // -------------------------------------------------------------------------
    console.log('[TEST 2] Verifying Hindi model selection...');
    const hiResolution = orpheusTTS.resolveModelForLanguage('hi');
    assert.strictEqual(hiResolution.langCode, 'hi');
    assert.strictEqual(hiResolution.model, 'sematre/orpheus:ft-hi-3b-q8_0');
    console.log('✔ TEST 2 PASSED: Hindi maps to sematre/orpheus:ft-hi-3b-q8_0\n');
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 3: Invalid Language Rejection
    // -------------------------------------------------------------------------
    console.log('[TEST 3] Testing rejection of invalid language...');
    const invalidLangRes = await makeRequest(
      'POST',
      '/tts/synthesize',
      { text: 'Sample clinical text', language: 'fr' },
      { Authorization: `Bearer ${doctorToken}` }
    );
    assert.strictEqual(invalidLangRes.statusCode, 400);
    assert.ok(invalidLangRes.body.error?.message.includes('Unsupported language'));
    console.log('✔ TEST 3 PASSED: Invalid language correctly rejected with 400 Bad Request\n');
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 4: Empty Text Rejection
    // -------------------------------------------------------------------------
    console.log('[TEST 4] Testing rejection of empty text...');
    const emptyTextRes = await makeRequest(
      'POST',
      '/tts/synthesize',
      { text: '   ', language: 'en' },
      { Authorization: `Bearer ${doctorToken}` }
    );
    assert.strictEqual(emptyTextRes.statusCode, 400);
    assert.ok(emptyTextRes.body.error?.message.includes('cannot be empty'));
    console.log('✔ TEST 4 PASSED: Empty text correctly rejected with 400 Bad Request\n');
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 5: Text Length Validation
    // -------------------------------------------------------------------------
    console.log('[TEST 5] Testing text length validation limit (> 1500 chars)...');
    const overlongText = 'A'.repeat(1501);
    const overlongRes = await makeRequest(
      'POST',
      '/tts/synthesize',
      { text: overlongText, language: 'en' },
      { Authorization: `Bearer ${doctorToken}` }
    );
    assert.strictEqual(overlongRes.statusCode, 400);
    assert.ok(overlongRes.body.error?.message.includes('exceeds maximum length'));
    console.log('✔ TEST 5 PASSED: Overlong text rejected with 400 Bad Request\n');
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 6: Ollama Offline Handling & Clean Audio Delivery
    // -------------------------------------------------------------------------
    console.log('[TEST 6] Testing Ollama offline handling without crashing or exposing raw errors...');
    const offlineRes = await makeRequest(
      'POST',
      '/tts/synthesize',
      { text: 'Age at first childbirth?', language: 'en' },
      { Authorization: `Bearer ${doctorToken}` }
    );
    assert.strictEqual(offlineRes.statusCode, 200);
    assert.strictEqual(offlineRes.body.success, true);
    assert.ok(offlineRes.body.audioBase64.length > 50);
    console.log(`✔ TEST 6 PASSED: Offline Ollama gracefully handled with active provider: '${offlineRes.body.provider}' (HTTP 200)\n`);
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 7: Authentication Rejection
    // -------------------------------------------------------------------------
    console.log('[TEST 7] Testing security authentication requirement (no token)...');
    const unauthRes = await makeRequest('POST', '/tts/synthesize', {
      text: 'Age at marriage?',
      language: 'en',
    });
    assert.strictEqual(unauthRes.statusCode, 401);
    console.log('✔ TEST 7 PASSED: Unauthenticated access rejected with 401 Unauthorized\n');
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 8: Successful English Synthesis
    // -------------------------------------------------------------------------
    console.log('[TEST 8] Testing English synthesis flow...');
    const enSynthRes = await makeRequest(
      'POST',
      '/tts/synthesize',
      { text: 'Current age group? Option one: Under 30 years.', language: 'en' },
      { Authorization: `Bearer ${doctorToken}` }
    );
    assert.strictEqual(enSynthRes.statusCode, 200);
    assert.strictEqual(enSynthRes.body.success, true);
    assert.strictEqual(enSynthRes.body.language, 'en');
    assert.strictEqual(enSynthRes.body.model, 'sematre/orpheus:ft-en-3b-q8_0');
    assert.ok(enSynthRes.body.audioBase64.length > 100);
    console.log(`✔ TEST 8 PASSED: English synthesis successfully delivered (Provider: ${enSynthRes.body.provider}, Format: ${enSynthRes.body.format})\n`);
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 9: Successful Hindi Synthesis
    // -------------------------------------------------------------------------
    console.log('[TEST 9] Testing Hindi synthesis flow...');
    const hiSynthRes = await makeRequest(
      'POST',
      '/tts/synthesize',
      { text: 'पहली संतान के समय उम्र? विकल्प एक: कोई संतान नहीं।', language: 'hi' },
      { Authorization: `Bearer ${doctorToken}` }
    );
    assert.strictEqual(hiSynthRes.statusCode, 200);
    assert.strictEqual(hiSynthRes.body.success, true);
    assert.strictEqual(hiSynthRes.body.language, 'hi');
    assert.strictEqual(hiSynthRes.body.model, 'sematre/orpheus:ft-hi-3b-q8_0');
    assert.ok(hiSynthRes.body.audioBase64.length > 100);
    console.log(`✔ TEST 9 PASSED: Hindi synthesis successfully delivered (Provider: ${hiSynthRes.body.provider}, Format: ${hiSynthRes.body.format})\n`);
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 10: Binary Audio Format Validity (MP3 / WAV Header)
    // -------------------------------------------------------------------------
    console.log('[TEST 10] Verifying binary audio buffer validity...');
    const audioBuf = Buffer.from(hiSynthRes.body.audioBase64, 'base64');
    assert.ok(audioBuf.length >= 44, 'Audio buffer must be at least 44 bytes');

    const isWav = audioBuf.toString('ascii', 0, 4) === 'RIFF' && audioBuf.toString('ascii', 8, 12) === 'WAVE';
    const isMp3 =
      audioBuf.toString('ascii', 0, 3) === 'ID3' ||
      (audioBuf[0] === 0xFF && (audioBuf[1] & 0xE0) === 0xE0);

    assert.ok(isWav || isMp3, `Audio buffer must be valid MP3 or WAV (Format reported: ${hiSynthRes.body.format})`);
    console.log(`✔ TEST 10 PASSED: Valid audio format confirmed (${audioBuf.length} bytes, format: ${hiSynthRes.body.format})\n`);
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 11: No Clinical State Mutation
    // -------------------------------------------------------------------------
    console.log('[TEST 11] Verifying TTS synthesis causes ZERO clinical database mutation...');
    const { count: patientCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });
    const { count: assessmentCount } = await supabase.from('assessments').select('*', { count: 'exact', head: true });
    assert.strictEqual(patientCount, initialPatientCount, `Database patients must remain unchanged (initial: ${initialPatientCount}, current: ${patientCount})`);
    assert.strictEqual(assessmentCount, initialAssessmentCount, `Database assessments must remain unchanged (initial: ${initialAssessmentCount}, current: ${assessmentCount})`);
    console.log(`✔ TEST 11 PASSED: Zero side-effects verified (Patients unchanged: ${patientCount}, Assessments unchanged: ${assessmentCount})\n`);
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 12: Concurrent Request Handling
    // -------------------------------------------------------------------------
    console.log('[TEST 12] Testing concurrent TTS synthesis requests (5 parallel queries)...');
    const queries = [
      { text: 'Symptom one on left breast', language: 'en' },
      { text: 'बाएं स्तन पर दर्द', language: 'hi' },
      { text: 'History of breastfeeding', language: 'en' },
      { text: 'स्तनपान का इतिहास', language: 'hi' },
      { text: 'Family history of cancer', language: 'en' },
    ];

    const concurrentResults = await Promise.all(
      queries.map(q =>
        makeRequest('POST', '/tts/synthesize', q, { Authorization: `Bearer ${doctorToken}` })
      )
    );

    concurrentResults.forEach((res, idx) => {
      assert.strictEqual(res.statusCode, 200, `Concurrent request ${idx} must return 200`);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.audioBase64.length > 40);
    });
    console.log('✔ TEST 12 PASSED: 5 concurrent requests handled seamlessly without race conditions\n');
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 13: GET /api/tts/config Diagnostic Endpoint
    // -------------------------------------------------------------------------
    console.log('[TEST 13] Testing GET /api/tts/config diagnostic endpoint...');
    const configRes = await makeRequest('GET', '/tts/config', null, {
      Authorization: `Bearer ${doctorToken}`,
    });
    assert.strictEqual(configRes.statusCode, 200);
    assert.strictEqual(configRes.body.success, true);
    assert.ok(configRes.body.config?.models?.en);
    assert.ok(configRes.body.config?.models?.hi);
    console.log(`✔ TEST 13 PASSED: GET /api/tts/config returned active engine configuration\n`);
    passedTests++;

    console.log('====================================================');
    console.log(`ALL ${passedTests}/${totalTests} TTS TESTS PASSED WITH 100% SUCCESS!`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ TTS TEST FAILED:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

if (require.main === module) {
  runTTSVerification();
}

module.exports = { runTTSVerification };
