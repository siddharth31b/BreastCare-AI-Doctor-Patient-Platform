const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');

let server;
let baseUrl;

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}/api/language`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('Language API: Supported languages list', async () => {
  const res = await fetch(`${baseUrl}/languages`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.languages.some(l => l.code === 'hi'));
  assert.ok(data.provider.includes('MOCK MODE'));
});

test('Language API: Translation to Hindi', async () => {
  const res = await fetch(`${baseUrl}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Symptoms on Left Breast',
      targetLang: 'hi'
    })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.translatedText, 'बाएं स्तन के लक्षण');
});

test('Language API: Demo STT speech recognition', async () => {
  const res = await fetch(`${baseUrl}/stt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64: 'fake-audio-payload',
      language: 'hi',
      promptHint: 'yes'
    })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.transcript.includes('हाँ'));
  assert.equal(data.isDemo, true);
});

test('Language API: Demo TTS text to speech', async () => {
  const res = await fetch(`${baseUrl}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'क्या आपको स्तन में दर्द है?',
      language: 'hi'
    })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.audioBase64);
  assert.equal(data.isDemo, true);
});
