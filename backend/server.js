const express = require('express');
const cors = require('cors');
const { scoreEntry } = require('./scoreEntry');

const app = express();
const PORT = process.env.PORT || 3001;
const DEFAULT_TIMEOUT_MS = 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const savedResults = new Map();
let scoreInvocations = 0;

function analysisTimeoutMs() {
  const configured = process.env.ANALYSIS_TIMEOUT_MS;
  if (configured === undefined || configured === '') return DEFAULT_TIMEOUT_MS;
  const parsed = Number(configured);
  return Number.isFinite(parsed) ? parsed : DEFAULT_TIMEOUT_MS;
}

function elapsedMs(started) {
  return Number((Number(process.hrtime.bigint() - started) / 1e6).toFixed(3));
}

function scoreWithTimeout(text, timeoutMs) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      const error = new Error('Analysis timed out');
      error.code = 'ETIMEDOUT';
      reject(error);
    }, timeoutMs);

    try {
      scoreInvocations += 1;
      const result = scoreEntry(text, { deadline: Date.now() + timeoutMs });
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    } catch (error) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    }
  });
}

app.post('/api/analyze-sentiment', async (req, res) => {
  const started = process.hrtime.bigint();
  try {
    const text = req.body && req.body.text;
    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const saved = savedResults.get(text);
    if (saved) {
      return res.json({ ...saved, cached: true, latencyMs: elapsedMs(started) });
    }

    let result;
    try {
      result = await scoreWithTimeout(text, analysisTimeoutMs());
    } catch (error) {
      if (error.code === 'ETIMEDOUT') {
        return res.status(504).json({ error: 'Analysis timed out' });
      }
      throw error;
    }

    savedResults.set(text, result);
    return res.json({ ...result, cached: false, latencyMs: elapsedMs(started) });
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SentimentScope API is running' });
});

function clearSavedAnalyses() {
  savedResults.clear();
  scoreInvocations = 0;
}

function getScoreInvocations() {
  return scoreInvocations;
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = {
  app,
  scoreEntry,
  clearSavedAnalyses,
  getScoreInvocations,
};
