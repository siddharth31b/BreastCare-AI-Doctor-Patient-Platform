const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');
const http = require('http');

test('Health endpoint returns 200 and healthy status', async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const response = await fetch(`http://localhost:${port}/api/health`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.status, 'healthy');
    assert.equal(data.system, 'BreastCare AI Platform');
    assert.equal(data.languageProvider, 'demo');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
