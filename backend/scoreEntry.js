const categories = require('./emotionCategories.json');

const POSITIVE = [
  'joy', 'excitement', 'contentment', 'hope', 'love', 'gratitude', 'pride',
  'curiosity', 'determination', 'relief', 'satisfaction', 'inspiration',
];
const NEGATIVE = [
  'sadness', 'anger', 'fear', 'disgust', 'anxiety', 'stress', 'workStress',
  'nervousness', 'confusion', 'frustration', 'shame', 'guilt', 'envy',
  'loneliness', 'boredom', 'disappointment',
];
const NEUTRAL = ['surprise', 'confusion'];

const prepared = Object.entries(categories).map(([emotion, data]) => ({
  emotion,
  intensity: data.intensity,
  phrases: data.words.map((word) => word.toLowerCase()),
}));

const intensityByEmotion = new Map(prepared.map((item) => [item.emotion, item.intensity]));
const maxIntensity = prepared.reduce((max, item) => Math.max(max, item.intensity), 0);

function isWordChar(code) {
  return (
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    code === 95
  );
}

function tokenCounts(lower) {
  const counts = new Map();
  const pattern = /[a-z0-9_]+/g;
  let match = pattern.exec(lower);
  while (match) {
    counts.set(match[0], (counts.get(match[0]) || 0) + 1);
    match = pattern.exec(lower);
  }
  return counts;
}

function countPhrase(lower, phrase) {
  let count = 0;
  let from = 0;
  while (from < lower.length) {
    const at = lower.indexOf(phrase, from);
    if (at === -1) break;
    const before = at === 0 ? 0 : lower.charCodeAt(at - 1);
    const afterIndex = at + phrase.length;
    const after = afterIndex >= lower.length ? 0 : lower.charCodeAt(afterIndex);
    if (!isWordChar(before) && !isWordChar(after)) count += 1;
    from = at + phrase.length;
  }
  return count;
}

function timeoutError() {
  const error = new Error('Analysis timed out');
  error.code = 'ETIMEDOUT';
  return error;
}

function weightedTotal(emotionScores, names) {
  let total = 0;
  for (const name of names) {
    const score = emotionScores[name] || 0;
    if (score > 0) total += score * intensityByEmotion.get(name);
  }
  return total;
}

function scoreEntry(text, options = {}) {
  const deadline = options.deadline ?? Infinity;
  if (Date.now() >= deadline) throw timeoutError();

  const emotionScores = {};
  for (const item of prepared) emotionScores[item.emotion] = 0;

  const lower = text.toLowerCase();
  const counts = /[a-z]/i.test(text) ? tokenCounts(lower) : new Map();
  let totalEmotionWords = 0;
  let phraseChecks = 0;

  if (counts.size > 0) {
    for (const item of prepared) {
      let categoryCount = 0;
      for (const phrase of item.phrases) {
        if ((phraseChecks++ & 15) === 0 && Date.now() >= deadline) throw timeoutError();
        let matches = 0;
        if (/^[a-z0-9_]+$/.test(phrase)) {
          matches = counts.get(phrase) || 0;
        } else {
          const parts = phrase.match(/[a-z0-9_]+/g);
          if (parts && parts.every((part) => counts.has(part))) {
            matches = countPhrase(lower, phrase);
          }
        }
        if (matches > 0) categoryCount += matches;
      }
      emotionScores[item.emotion] = categoryCount;
      totalEmotionWords += categoryCount;
    }
  }

  const weightedPositiveScore = weightedTotal(emotionScores, POSITIVE);
  const weightedNegativeScore = weightedTotal(emotionScores, NEGATIVE);
  const weightedNeutralScore = weightedTotal(emotionScores, NEUTRAL);
  const totalWeightedScore = weightedPositiveScore + weightedNegativeScore + weightedNeutralScore;

  let emotionRatioScore = 0.5;
  if (totalWeightedScore > 0) {
    if (weightedPositiveScore > weightedNegativeScore) {
      emotionRatioScore = 0.5 + (weightedPositiveScore / totalWeightedScore) * 0.3;
    } else if (weightedNegativeScore > weightedPositiveScore) {
      emotionRatioScore = 0.5 - (weightedNegativeScore / totalWeightedScore) * 0.3;
    }
  }

  const intensityBalance = maxIntensity > 0 ? maxIntensity : 0.5;
  const activeEmotions = Object.values(emotionScores).filter((score) => score > 0).length;
  const diversityScore = activeEmotions > 0 ? Math.min(activeEmotions / 10, 1) : 0.5;
  const emotionDensity = totalEmotionWords / Math.max(text.length, 1);
  const contextualScore = emotionDensity > 0.1 ? 0.6 : emotionDensity > 0.05 ? 0.5 : 0.4;

  let sentimentScore = (
    emotionRatioScore * 0.4 +
    intensityBalance * 0.3 +
    diversityScore * 0.2 +
    contextualScore * 0.1
  );
  sentimentScore = Math.max(0, Math.min(1, sentimentScore));

  let sentiment = 'neutral';
  if (sentimentScore > 0.65) sentiment = 'positive';
  else if (sentimentScore < 0.35) sentiment = 'negative';

  const emotions = Object.entries(emotionScores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([emotion]) => emotion);

  return {
    sentiment,
    sentimentScore,
    emotions,
    emotionScores,
  };
}

module.exports = { scoreEntry };
