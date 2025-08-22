const express = require('express');
const cors = require('cors');
const Sentiment = require('sentiment');
const nlp = require('compromise');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize sentiment analyzer
const sentiment = new Sentiment();

// Sentiment analysis endpoint
app.post('/api/analyze-sentiment', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Analyze sentiment
    const sentimentResult = sentiment.analyze(text);
    
    // Determine sentiment category
    let sentimentCategory = 'neutral';
    if (sentimentResult.score > 0) {
      sentimentCategory = 'positive';
    } else if (sentimentResult.score < 0) {
      sentimentCategory = 'negative';
    }

    // Extract emotions using compromise
    const doc = nlp(text);
    const emotions = [];
    
    // Simple emotion detection based on keywords
    const emotionKeywords = {
      joy: ['happy', 'joy', 'excited', 'thrilled', 'delighted', 'pleased', 'cheerful'],
      sadness: ['sad', 'depressed', 'melancholy', 'sorrow', 'grief', 'unhappy'],
      anger: ['angry', 'furious', 'mad', 'irritated', 'annoyed', 'frustrated'],
      fear: ['afraid', 'scared', 'terrified', 'fearful', 'anxious', 'worried'],
      love: ['love', 'affection', 'care', 'fondness', 'adoration', 'devotion'],
      gratitude: ['grateful', 'thankful', 'appreciative', 'blessed', 'fortunate'],
      anxiety: ['anxious', 'nervous', 'worried', 'concerned', 'uneasy', 'tense']
    };

    const words = text.toLowerCase().split(/\s+/);
    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      if (keywords.some(keyword => words.includes(keyword))) {
        emotions.push(emotion);
      }
    });

    // Calculate confidence score
    const confidence = Math.min(Math.abs(sentimentResult.score) / 10, 1);

    res.json({
      sentiment: sentimentCategory,
      sentimentScore: confidence,
      emotions: emotions,
      analysis: {
        score: sentimentResult.score,
        comparative: sentimentResult.comparative,
        tokens: sentimentResult.tokens.length,
        words: sentimentResult.words,
        positive: sentimentResult.positive,
        negative: sentimentResult.negative
      }
    });

  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SentimentScope API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
