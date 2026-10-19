const { once } = require('node:events');
const test = require('node:test');
const assert = require('node:assert/strict');
const { app, clearSavedAnalyses, getScoreInvocations } = require('../server');

let server;
let baseUrl;

async function postAnalyze(text) {
  const response = await fetch(`${baseUrl}/api/analyze-sentiment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const body = await response.json();
  return { status: response.status, body };
}

function assertEmotionScores(body) {
  assert.equal(typeof body.emotionScores, 'object');
  assert.ok(body.emotionScores);
  assert.ok(Object.keys(body.emotionScores).length >= 25);
  for (const score of Object.values(body.emotionScores)) {
    assert.equal(typeof score, 'number');
    assert.ok(score >= 0);
  }
}

test.before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  server.closeAllConnections?.();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test.beforeEach(() => {
  clearSavedAnalyses();
});

test('empty text returns emotion scores', async () => {
  const { status, body } = await postAnalyze('');
  assert.equal(status, 200);
  assertEmotionScores(body);
  assert.ok(Object.values(body.emotionScores).every((score) => score === 0));
  assert.deepEqual(body.emotions, []);
  assert.equal(body.sentiment, 'neutral');
  assert.equal(body.cached, false);
  assert.equal(typeof body.latencyMs, 'number');
});

test('mixed emotions returns more than one emotion score', async () => {
  const { status, body } = await postAnalyze('I feel happy and grateful, but also sad and angry.');
  assert.equal(status, 200);
  assertEmotionScores(body);
  assert.ok(body.emotionScores.joy > 0);
  assert.ok(body.emotionScores.sadness > 0);
  assert.ok(body.emotionScores.anger > 0);
  assert.ok(body.emotions.includes('joy'));
  assert.ok(body.emotions.includes('sadness'));
});

test('a very long entry still returns emotion scores', async () => {
  const text = `${'ordinary '.repeat(20000)}I feel happy`;
  const { status, body } = await postAnalyze(text);
  assert.equal(status, 200);
  assertEmotionScores(body);
  assert.ok(body.emotionScores.joy > 0);
  assert.equal(body.cached, false);
  assert.ok(Number.isFinite(body.latencyMs));
  assert.ok(body.latencyMs >= 0);
});

test('punctuation with no words returns empty emotion scores', async () => {
  const { status, body } = await postAnalyze('!!! ??? ... --- ;;;');
  assert.equal(status, 200);
  assertEmotionScores(body);
  assert.ok(Object.values(body.emotionScores).every((score) => score === 0));
  assert.deepEqual(body.emotions, []);
  assert.equal(body.sentiment, 'neutral');
});

test('unchanged text skips scoring and returns the saved result', async () => {
  const text = 'I feel proud of the work and hopeful about tomorrow.';
  const first = await postAnalyze(text);
  assert.equal(first.status, 200);
  assert.equal(first.body.cached, false);
  assert.equal(getScoreInvocations(), 1);

  const second = await postAnalyze(text);
  assert.equal(second.status, 200);
  assert.equal(second.body.cached, true);
  assert.equal(getScoreInvocations(), 1);
  assert.deepEqual(second.body.emotionScores, first.body.emotionScores);
  assert.equal(second.body.sentiment, first.body.sentiment);
  assert.equal(second.body.sentimentScore, first.body.sentimentScore);
  assert.deepEqual(second.body.emotions, first.body.emotions);
});

test('a slow run fails cleanly instead of hanging', async () => {
  const previous = process.env.ANALYSIS_TIMEOUT_MS;
  process.env.ANALYSIS_TIMEOUT_MS = '0';
  try {
    const started = Date.now();
    const { status, body } = await postAnalyze(`timeout check ${Date.now()}`);
    const elapsed = Date.now() - started;
    assert.equal(status, 504);
    assert.equal(body.error, 'Analysis timed out');
    assert.ok(elapsed < 1000);
  } finally {
    if (previous === undefined) delete process.env.ANALYSIS_TIMEOUT_MS;
    else process.env.ANALYSIS_TIMEOUT_MS = previous;
  }
});
