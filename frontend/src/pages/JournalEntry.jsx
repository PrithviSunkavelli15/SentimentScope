import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { addDoc, collection, serverTimestamp, getDocs, query, where, limit } from 'firebase/firestore';
import { auth, db } from '../firebase';


export default function JournalEntry() {
  const [loading, setLoading] = useState(false);
  const [dailyPrompt, setDailyPrompt] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [firebaseStatus, setFirebaseStatus] = useState('Testing...');
  const navigate = useNavigate();

  // Test Firebase connection on component mount
  useEffect(() => {
    testFirebaseConnection();
    generateDailyPrompt();
  }, []);

  const testFirebaseConnection = async () => {
    try {
      console.log('Testing Firebase connection...');
      console.log('Auth object:', auth);
      console.log('DB object:', db);
      console.log('Current user:', auth.currentUser);
      
      // Test if we can read from Firestore - use a collection that should exist
      if (auth.currentUser) {
        // Try to read from journalEntries collection for current user
        const q = query(
          collection(db, 'journalEntries'), 
          where('userId', '==', auth.currentUser.uid),
          limit(1)
        );
        await getDocs(q);
        console.log('Firestore read test successful');
        setFirebaseStatus('✅ Firebase connected');
      } else {
        // If no user, just test basic connection
        await getDocs(collection(db, 'journalEntries'));
        console.log('Firestore basic connection test successful');
        setFirebaseStatus('✅ Firebase connected (no user)');
      }
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      setFirebaseStatus(`❌ Firebase error: ${error.message}`);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your thoughts...',
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/) : [];
      setWordCount(words.length);
    },
  });

  const generateDailyPrompt = () => {
    const prompts = [
      "How are you feeling today? What's on your mind?",
      "What's something you're grateful for right now?",
      "Describe a challenge you're facing and how you're handling it.",
      "What's something you're looking forward to?",
      "Reflect on a recent interaction that made an impact on you.",
      "What's something you've learned about yourself recently?",
      "Describe your ideal day and what makes it special.",
      "What's a goal you're working towards? How's it going?",
      "Reflect on a mistake you made and what you learned from it.",
      "What's something that's been bothering you lately?"
    ];
    
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    setDailyPrompt(prompts[dayOfYear % prompts.length]);
  };

  const analyzeSentiment = (text) => {
    // Advanced emotion dictionaries with intensity levels
    const emotionCategories = {
      // Core emotions with intensity weighting
      joy: { words: ['happy', 'joy', 'excited', 'thrilled', 'delighted', 'ecstatic', 'elated', 'cheerful', 'gleeful', 'jubilant', 'euphoric', 'blissful', 'content', 'pleased', 'satisfied', 'grateful', 'blessed', 'fortunate', 'lucky'], intensity: 1.0 },
      sadness: { words: ['sad', 'depressed', 'melancholy', 'gloomy', 'sorrowful', 'heartbroken', 'devastated', 'crushed', 'disappointed', 'let down', 'hopeless', 'despair', 'grief', 'mourning', 'lamenting', 'weeping', 'crying'], intensity: 1.0 },
      anger: { words: ['angry', 'furious', 'mad', 'enraged', 'irritated', 'annoyed', 'frustrated', 'livid', 'outraged', 'fuming', 'seething', 'hostile', 'aggressive', 'bitter', 'resentful', 'vengeful', 'hateful'], intensity: 1.0 },
      fear: { words: ['fear', 'scared', 'afraid', 'terrified', 'panicked', 'anxious', 'worried', 'nervous', 'uneasy', 'apprehensive', 'dread', 'horror', 'terror', 'alarm', 'distress', 'frightened', 'startled'], intensity: 1.0 },
      surprise: { words: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'bewildered', 'confused', 'perplexed', 'baffled', 'dumbfounded', 'flabbergasted', 'taken aback', 'caught off guard'], intensity: 0.7 },
      disgust: { words: ['disgusted', 'revolted', 'repulsed', 'sickened', 'appalled', 'horrified', 'nauseated', 'offended', 'outraged', 'contempt', 'loathing', 'abhorrence'], intensity: 0.9 },
      
      // Complex emotions with intensity weighting
      anxiety: { words: ['anxiety', 'anxious', 'worried', 'concerned', 'uneasy', 'restless', 'jittery', 'on edge', 'tense', 'stressed', 'overwhelmed', 'panicked', 'fearful', 'apprehensive', 'dread', 'nervousness', 'nervous', 'agitation', 'distress'], intensity: 0.8 },
      stress: { words: ['stress', 'stressed', 'overwhelmed', 'burdened', 'pressured', 'strained', 'tension', 'tense', 'exhausted', 'drained', 'burned out', 'frazzled', 'wound up', 'keyed up', 'high strung', 'swamped', 'busy', 'hectic', 'crazy', 'insane', 'nuts', 'mad', 'stressed out', 'under pressure', 'deadline', 'rushed', 'hurried', 'pressed for time', 'time crunch', 'crunch time', 'last minute', 'urgent', 'emergency', 'crisis', 'chaos', 'mess', 'disorganized', 'scattered', 'all over the place', 'pulled in different directions', 'spread thin', 'too much', 'can\'t handle', 'breaking point', 'at my limit', 'maxed out', 'overloaded', 'swamped', 'drowning', 'sinking', 'struggling', 'barely keeping up', 'falling behind', 'playing catch up', 'running around', 'nonstop', 'never ending', 'endless', 'infinite', 'too many things', 'too much going on', 'crazy busy', 'insanely busy', 'ridiculously busy', 'absurdly busy', 'unbelievably busy', 'extremely busy', 'super busy', 'very busy', 'so busy', 'really busy', 'pretty busy', 'quite busy', 'fairly busy', 'somewhat busy', 'a bit busy', 'a little busy', 'kind of busy', 'sort of busy', 'rather busy', 'quite stressed', 'very stressed', 'really stressed', 'so stressed', 'pretty stressed', 'fairly stressed', 'somewhat stressed', 'a bit stressed', 'a little stressed', 'kind of stressed', 'sort of stressed', 'rather stressed', 'extremely stressed', 'super stressed', 'unbelievably stressed', 'ridiculously stressed', 'insanely stressed', 'crazy stressed', 'mad stressed', 'nuts stressed', 'insane stressed', 'absurdly stressed'], intensity: 0.8 },
      workStress: { words: ['workload', 'deadline', 'meeting', 'presentation', 'project', 'assignment', 'homework', 'study', 'exam', 'test', 'quiz', 'paper', 'report', 'proposal', 'review', 'evaluation', 'performance', 'target', 'goal', 'objective', 'milestone', 'deliverable', 'submission', 'due date', 'cutoff', 'time limit', 'overtime', 'extra hours', 'weekend work', 'late night', 'early morning', 'all nighter', 'pulling all nighters', 'burning the midnight oil', 'working late', 'staying late', 'coming in early', 'working weekends', 'working holidays', 'no breaks', 'no lunch', 'no time off', 'no vacation', 'no sick days', 'no personal time', 'always working', 'never stopping', 'nonstop work', 'endless work', 'infinite work', 'too much work', 'work overload', 'work pressure', 'work stress', 'job stress', 'career stress', 'professional stress', 'academic stress', 'school stress', 'college stress', 'university stress', 'student stress', 'work life balance', 'work life imbalance', 'no work life balance', 'poor work life balance', 'terrible work life balance', 'horrible work life balance', 'awful work life balance', 'bad work life balance', 'stressful job', 'stressful work', 'stressful career', 'stressful environment', 'toxic workplace', 'hostile environment', 'unhealthy workplace', 'unsafe workplace', 'dangerous workplace', 'risky workplace', 'challenging workplace', 'difficult workplace', 'hard workplace', 'tough workplace', 'rough workplace', 'rough job', 'tough job', 'hard job', 'difficult job', 'challenging job', 'demanding job', 'stressful position', 'stressful role', 'stressful responsibility', 'stressful duty', 'stressful task', 'stressful assignment', 'stressful project', 'stressful deadline', 'stressful meeting', 'stressful presentation', 'stressful review', 'stressful evaluation', 'stressful performance', 'stressful target', 'stressful goal', 'stressful objective', 'stressful milestone', 'stressful deliverable', 'stressful submission', 'stressful due date', 'stressful cutoff', 'stressful time limit', 'stressful overtime', 'stressful extra hours', 'stressful weekend work', 'stressful late night', 'stressful early morning', 'stressful all nighter', 'stressful pulling all nighters', 'stressful burning the midnight oil', 'stressful working late', 'stressful staying late', 'stressful coming in early', 'stressful working weekends', 'stressful working holidays', 'stressful no breaks', 'stressful no lunch', 'stressful no time off', 'stressful no vacation', 'stressful no sick days', 'stressful no personal time', 'stressful always working', 'stressful never stopping', 'stressful nonstop work', 'stressful endless work', 'stressful infinite work', 'stressful too much work', 'stressful work overload', 'stressful work pressure', 'stressful work stress', 'stressful job stress', 'stressful career stress', 'stressful professional stress', 'stressful academic stress', 'stressful school stress', 'stressful college stress', 'stressful university stress', 'stressful student stress', 'stressful work life balance', 'stressful work life imbalance', 'stressful no work life balance', 'stressful poor work life balance', 'stressful terrible work life balance', 'stressful horrible work life balance', 'stressful awful work life balance', 'stressful bad work life balance'], intensity: 0.9 },
      excitement: { words: ['excitement', 'excited', 'thrilled', 'enthusiastic', 'eager', 'anticipating', 'looking forward', 'can\'t wait', 'buzzing', 'pumped', 'stoked', 'amped', 'fired up', 'motivated', 'inspired'], intensity: 0.9 },
      nervousness: { words: ['nervous', 'nervousness', 'jittery', 'shaky', 'trembling', 'quivering', 'butterflies', 'on edge', 'tense', 'anxious', 'worried', 'uneasy', 'restless', 'fidgety', 'twitchy'], intensity: 0.7 },
      contentment: { words: ['content', 'contentment', 'satisfied', 'fulfilled', 'at peace', 'serene', 'calm', 'tranquil', 'relaxed', 'comfortable', 'cozy', 'secure', 'safe', 'stable'], intensity: 0.6 },
      confusion: { words: ['confused', 'confusion', 'bewildered', 'perplexed', 'baffled', 'puzzled', 'uncertain', 'unsure', 'doubtful', 'questioning', 'mystified', 'clueless', 'lost', 'disoriented'], intensity: 0.5 },
      frustration: { words: ['frustrated', 'frustration', 'annoyed', 'irritated', 'exasperated', 'fed up', 'sick of', 'tired of', 'had enough', 'at wit\'s end', 'discouraged', 'disheartened', 'demotivated'], intensity: 0.8 },
      hope: { words: ['hope', 'hopeful', 'optimistic', 'positive', 'encouraged', 'inspired', 'motivated', 'determined', 'confident', 'assured', 'certain', 'sure', 'believing', 'trusting'], intensity: 0.7 },
      love: { words: ['love', 'loving', 'affection', 'affectionate', 'caring', 'tender', 'warm', 'fond', 'adore', 'cherish', 'treasure', 'appreciate', 'grateful', 'thankful', 'blessed'], intensity: 0.9 },
      gratitude: { words: ['grateful', 'gratitude', 'thankful', 'appreciative', 'blessed', 'fortunate', 'lucky', 'privileged', 'honored', 'humbled', 'indebted', 'obliged'], intensity: 0.7 },
      pride: { words: ['proud', 'pride', 'accomplished', 'achieved', 'successful', 'victorious', 'triumphant', 'confident', 'assured', 'self-assured', 'self-confident', 'empowered'], intensity: 0.8 },
      shame: { words: ['ashamed', 'shame', 'embarrassed', 'humiliated', 'mortified', 'disgraced', 'dishonored', 'guilty', 'remorseful', 'regretful', 'sorry', 'apologetic', 'contrite'], intensity: 0.9 },
      guilt: { words: ['guilty', 'guilt', 'remorseful', 'regretful', 'sorry', 'apologetic', 'contrite', 'ashamed', 'conscience-stricken', 'penitent', 'repentant', 'self-reproachful'], intensity: 0.8 },
      envy: { words: ['envious', 'envy', 'jealous', 'jealousy', 'covetous', 'resentful', 'bitter', 'spiteful', 'malicious', 'begrudging', 'grudging'], intensity: 0.8 },
      loneliness: { words: ['lonely', 'loneliness', 'isolated', 'alone', 'abandoned', 'forsaken', 'deserted', 'neglected', 'ignored', 'unwanted', 'unloved', 'friendless', 'solitary'], intensity: 0.9 },
      boredom: { words: ['bored', 'boredom', 'uninterested', 'apathetic', 'indifferent', 'unmotivated', 'uninspired', 'dull', 'tedious', 'monotonous', 'repetitive', 'mundane'], intensity: 0.5 },
      curiosity: { words: ['curious', 'curiosity', 'interested', 'intrigued', 'fascinated', 'captivated', 'absorbed', 'engaged', 'involved', 'attentive', 'focused', 'concentrated'], intensity: 0.6 },
      determination: { words: ['determined', 'determination', 'resolved', 'committed', 'dedicated', 'persistent', 'tenacious', 'steadfast', 'unwavering', 'firm', 'strong-willed', 'stubborn'], intensity: 0.7 },
      relief: { words: ['relieved', 'relief', 'eased', 'unburdened', 'unloaded', 'freed', 'liberated', 'released', 'unwound', 'relaxed', 'calmed', 'soothed', 'comforted'], intensity: 0.6 },
      disappointment: { words: ['disappointed', 'disappointment', 'let down', 'discouraged', 'disheartened', 'crushed', 'devastated', 'shattered', 'broken', 'defeated', 'beaten', 'overcome'], intensity: 0.8 },
      satisfaction: { words: ['satisfied', 'satisfaction', 'fulfilled', 'content', 'pleased', 'happy', 'gratified', 'rewarded', 'accomplished', 'achieved', 'completed', 'finished'], intensity: 0.7 },
      inspiration: { words: ['inspired', 'inspiration', 'motivated', 'encouraged', 'stimulated', 'sparked', 'ignited', 'fired up', 'energized', 'vitalized', 'revitalized', 'renewed'], intensity: 0.8 }
    };

    // Analyze text for emotions
    const emotionScores = {};
    let totalEmotionWords = 0;
    
    // Advanced emotion analysis with intensity weighting
    Object.keys(emotionCategories).forEach(category => {
      const categoryData = emotionCategories[category];
      emotionScores[category] = 0;
      
      categoryData.words.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = (text.match(regex) || []).length;
        if (matches > 0) {
          emotionScores[category] += matches;
          totalEmotionWords += matches;
        }
      });
    });

    // Advanced sentiment calculation with multiple weighted factors
    const positiveEmotions = ['joy', 'excitement', 'contentment', 'hope', 'love', 'gratitude', 'pride', 'curiosity', 'determination', 'relief', 'satisfaction', 'inspiration'];
    const negativeEmotions = ['sadness', 'anger', 'fear', 'disgust', 'anxiety', 'stress', 'workStress', 'nervousness', 'confusion', 'frustration', 'shame', 'guilt', 'envy', 'loneliness', 'boredom', 'disappointment'];
    const neutralEmotions = ['surprise', 'confusion'];

    // Calculate weighted scores considering intensity and frequency
    let weightedPositiveScore = 0;
    let weightedNegativeScore = 0;
    let weightedNeutralScore = 0;

    positiveEmotions.forEach(emotion => {
      if (emotionScores[emotion] > 0) {
        const weight = emotionCategories[emotion].intensity;
        weightedPositiveScore += (emotionScores[emotion] * weight);
      }
    });

    negativeEmotions.forEach(emotion => {
      if (emotionScores[emotion] > 0) {
        const weight = emotionCategories[emotion].intensity;
        weightedNegativeScore += (emotionScores[emotion] * weight);
      }
    });

    neutralEmotions.forEach(emotion => {
      if (emotionScores[emotion] > 0) {
        const weight = emotionCategories[emotion].intensity;
        weightedNeutralScore += (emotionScores[emotion] * weight);
      }
    });

    // Multi-factor sentiment calculation
    let sentiment = 'neutral';
    let sentimentScore = 0.5; // Start at neutral
    
    // Factor 1: Weighted emotion ratio (40% of score)
    const totalWeightedScore = weightedPositiveScore + weightedNegativeScore + weightedNeutralScore;
    let emotionRatioScore = 0.5;
    
    if (totalWeightedScore > 0) {
      if (weightedPositiveScore > weightedNegativeScore) {
        emotionRatioScore = 0.5 + (weightedPositiveScore / totalWeightedScore) * 0.3;
      } else if (weightedNegativeScore > weightedPositiveScore) {
        emotionRatioScore = 0.5 - (weightedNegativeScore / totalWeightedScore) * 0.3;
      }
    }
    
    // Factor 2: Emotional intensity balance (30% of score)
    const maxIntensity = Math.max(...Object.values(emotionCategories).map(cat => cat.intensity));
    const intensityBalance = maxIntensity > 0 ? maxIntensity : 0.5;
    
    // Factor 3: Emotional diversity impact (20% of score)
    const activeEmotions = Object.values(emotionScores).filter(score => score > 0).length;
    const diversityScore = activeEmotions > 0 ? Math.min(activeEmotions / 10, 1) : 0.5;
    
    // Factor 4: Contextual analysis (10% of score)
    const textLength = text.length;
    const emotionDensity = totalEmotionWords / Math.max(textLength, 1);
    const contextualScore = emotionDensity > 0.1 ? 0.6 : emotionDensity > 0.05 ? 0.5 : 0.4;
    
    // Combine all factors for final score
    sentimentScore = (
      emotionRatioScore * 0.4 +
      intensityBalance * 0.3 +
      diversityScore * 0.2 +
      contextualScore * 0.1
    );
    
    // Determine sentiment category with more nuanced thresholds
    if (sentimentScore > 0.65) {
      sentiment = 'positive';
    } else if (sentimentScore < 0.35) {
      sentiment = 'negative';
    } else {
      sentiment = 'neutral';
    }
    
    // Ensure score stays within bounds
    sentimentScore = Math.max(0, Math.min(1, sentimentScore));

    // Get top emotions (emotions with highest scores)
    const topEmotions = Object.entries(emotionScores)
      .filter(([, score]) => score > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([emotion]) => emotion);

    // Analyze emotional complexity
    const emotionalComplexity = {
      intensity: totalEmotionWords > 10 ? 'high' : totalEmotionWords > 5 ? 'medium' : 'low',
      diversity: Object.values(emotionScores).filter(score => score > 0).length,
      primaryEmotion: topEmotions[0] || 'neutral',
      secondaryEmotions: topEmotions.slice(1, 3),
      emotionalState: getEmotionalState(emotionScores, sentiment)
    };

    // Generate emotional insights and suggestions
    const { insights, suggestions } = generateEmotionalInsights(emotionScores, emotionalComplexity, sentiment);

    return {
      sentiment,
      sentimentScore: sentimentScore, // Use the new multi-factor score
      emotions: topEmotions,
      emotionScores,
      emotionalComplexity,
      insights,
      suggestions,
      totalEmotionWords,
      primaryEmotion: topEmotions[0] || 'neutral',
      secondaryEmotions: topEmotions.slice(1, 3)
    };
  };

  const getEmotionalState = (emotionScores, sentiment) => {
    const highIntensityEmotions = ['anxiety', 'stress', 'anger', 'fear', 'excitement', 'joy'];
    const hasHighIntensity = highIntensityEmotions.some(emotion => (emotionScores[emotion] || 0) > 2);
    
    if (hasHighIntensity) {
      if (emotionScores.anxiety > 1 || emotionScores.stress > 1) return 'overwhelmed';
      if (emotionScores.excitement > 1) return 'energized';
      if (emotionScores.anger > 1) return 'agitated';
      if (emotionScores.fear > 1) return 'fearful';
    }
    
    if (emotionScores.contentment > 1 || emotionScores.gratitude > 1) return 'peaceful';
    if (emotionScores.confusion > 1) return 'uncertain';
    if (emotionScores.frustration > 1) return 'frustrated';
    
    return sentiment === 'positive' ? 'content' : sentiment === 'negative' ? 'distressed' : 'neutral';
  };

  const generateEmotionalInsights = (emotionScores, complexity, sentiment) => {
    const insights = [];
    const suggestions = [];
    
    // Primary emotion insights
    if (complexity.primaryEmotion && complexity.primaryEmotion !== 'neutral') {
      insights.push(`Your primary emotion is ${complexity.primaryEmotion}, indicating a strong focus on this feeling.`);
    }
    
    // Emotional complexity insights
    if (complexity.diversity > 5) {
      insights.push(`You're experiencing a complex mix of ${complexity.diversity} different emotions, suggesting a rich emotional landscape.`);
    } else if (complexity.diversity === 1) {
      insights.push(`You're experiencing a focused emotional state with ${complexity.primaryEmotion} as the dominant feeling.`);
    }
    
    // Specific emotion insights with actionable suggestions
    if (emotionScores.anxiety > 1) {
      insights.push(`Anxiety appears multiple times, suggesting you may be feeling worried or uncertain about something.`);
      suggestions.push(`Consider practicing deep breathing exercises or mindfulness meditation to help calm your mind.`);
      suggestions.push(`Try writing down your specific worries to identify what you can control vs. what you can't.`);
    }
    
    if (emotionScores.stress > 1) {
      insights.push(`Stress indicators suggest you're feeling overwhelmed or under pressure.`);
      suggestions.push(`Take regular breaks throughout your day - even 5-minute walks can help reduce stress.`);
      suggestions.push(`Consider time management techniques like the Pomodoro method to break tasks into manageable chunks.`);
      suggestions.push(`Practice the 4-7-8 breathing technique: inhale for 4, hold for 7, exhale for 8.`);
    }
    
    if (emotionScores.workStress > 1) {
      insights.push(`Work-related stress is prominent, indicating pressure from professional or academic responsibilities.`);
      suggestions.push(`Break large projects into smaller, manageable tasks with realistic deadlines.`);
      suggestions.push(`Set clear boundaries between work and personal time - avoid checking emails after hours.`);
      suggestions.push(`Consider using productivity tools like time-blocking or the Eisenhower Matrix to prioritize tasks.`);
      suggestions.push(`Don't hesitate to ask for help or delegate when possible - teamwork reduces individual burden.`);
    }
    
    if (emotionScores.excitement > 1) {
      insights.push(`Excitement shows you're looking forward to something with positive anticipation.`);
      suggestions.push(`Channel this energy into planning and preparation for what excites you.`);
      suggestions.push(`Share your excitement with others - positive emotions are contagious and strengthen relationships.`);
    }
    
    if (emotionScores.gratitude > 1) {
      insights.push(`Gratitude appears frequently, indicating a thankful and appreciative mindset.`);
      suggestions.push(`Continue practicing gratitude - it's linked to better mental health and life satisfaction.`);
      suggestions.push(`Consider starting a gratitude journal or sharing your appreciation with others.`);
    }
    
    if (emotionScores.frustration > 1) {
      insights.push(`Frustration suggests you're dealing with obstacles or unmet expectations.`);
      suggestions.push(`Take a step back and identify the root cause of your frustration.`);
      suggestions.push(`Consider if your expectations are realistic and what you can learn from this situation.`);
    }
    
    if (emotionScores.sadness > 1) {
      insights.push(`Sadness indicates you may be processing a loss or difficult experience.`);
      suggestions.push(`Allow yourself to feel sad - it's a natural and necessary emotion.`);
      suggestions.push(`Consider talking to a trusted friend or professional about what's troubling you.`);
    }
    
    if (emotionScores.anger > 1) {
      insights.push(`Anger suggests you're feeling wronged or frustrated with a situation.`);
      suggestions.push(`Take time to cool down before addressing the situation.`);
      suggestions.push(`Identify what specifically triggered your anger and what you can do about it constructively.`);
    }
    
    if (emotionScores.fear > 1) {
      insights.push(`Fear indicates you may be feeling threatened or uncertain about the future.`);
      suggestions.push(`Identify what specifically you're afraid of and assess if the threat is real.`);
      suggestions.push(`Consider developing a plan to address your fears step by step.`);
    }
    
    // Emotional intensity insights
    if (complexity.intensity === 'high') {
      insights.push(`High emotional intensity suggests this is a significant experience for you.`);
      suggestions.push(`High emotions can be overwhelming - consider taking time to process before making decisions.`);
      suggestions.push(`This intensity might indicate something important to you - pay attention to what it's telling you.`);
    } else if (complexity.intensity === 'low') {
      insights.push(`Lower emotional intensity suggests a more measured or calm emotional state.`);
      suggestions.push(`Use this calm state to reflect on your goals and make thoughtful decisions.`);
      suggestions.push(`Consider if this calmness is healthy or if you might be suppressing emotions.`);
    }
    
    // Sentiment insights
    if (sentiment === 'positive' && complexity.primaryEmotion !== 'joy') {
      insights.push(`Despite mixed emotions, your overall sentiment is positive, showing resilience.`);
      suggestions.push(`Your resilience is a strength - consider what helped you maintain positivity.`);
      suggestions.push(`Build on this positive foundation by setting small, achievable goals.`);
    } else if (sentiment === 'negative' && complexity.primaryEmotion !== 'sadness') {
      insights.push(`Your negative sentiment may be influenced by underlying concerns or stressors.`);
      suggestions.push(`Identify one small positive action you can take today to improve your mood.`);
      suggestions.push(`Consider what would help you feel more supported or understood right now.`);
    }
    
    // General lifestyle suggestions based on overall emotional state
    if (complexity.diversity > 3) {
      suggestions.push(`With ${complexity.diversity} different emotions, consider journaling regularly to track patterns.`);
    }
    
    if (emotionScores.stress > 0 || emotionScores.anxiety > 0) {
      suggestions.push(`Consider incorporating stress-reduction activities like exercise, meditation, or nature walks.`);
    }
    
    if (emotionScores.workStress > 0) {
      suggestions.push(`Work stress can be managed through better organization, time management, and work-life balance.`);
    }
    
    if (emotionScores.gratitude > 0 || emotionScores.joy > 0) {
      suggestions.push(`Your positive emotions are valuable - consider how to create more moments like this.`);
    }
    
    return { insights, suggestions };
  };

  const handleSave = async () => {
    if (!editor || !editor.getText().trim()) {
      alert('Please write something before saving.');
      return;
    }

    setLoading(true);
    
    try {
      console.log('=== SAVE ENTRY DEBUG ===');
      console.log('Starting save process...');
      console.log('Current user object:', auth.currentUser);
      console.log('Current user ID:', auth.currentUser?.uid);
      console.log('Current user email:', auth.currentUser?.email);
      console.log('User creation time:', auth.currentUser?.metadata?.creationTime);
      console.log('User last sign in:', auth.currentUser?.metadata?.lastSignInTime);
      
      // Check if user is actually authenticated
      if (!auth.currentUser) {
        throw new Error('No authenticated user found');
      }
      
      const content = editor.getHTML();
      const plainText = editor.getText();
      
      console.log('Content length:', content.length);
      console.log('Plain text length:', plainText.length);
      console.log('Word count:', wordCount);
      
      const analysis = analyzeSentiment(plainText);
      console.log('Sentiment analysis:', analysis);
      
      const entry = {
        userId: auth.currentUser.uid,
        content: content,
        plainText: plainText,
        timestamp: serverTimestamp(),
        sentiment: analysis.sentiment,
        sentimentScore: analysis.sentimentScore,
        emotions: analysis.emotions,
        wordCount: wordCount,
        // Enhanced emotional data
        emotionScores: analysis.emotionScores,
        emotionalComplexity: analysis.emotionalComplexity,
        emotionalInsights: analysis.insights,
        emotionalSuggestions: analysis.suggestions,
        primaryEmotion: analysis.primaryEmotion,
        secondaryEmotions: analysis.secondaryEmotions,
        totalEmotionWords: analysis.totalEmotionWords,
        emotionalState: analysis.emotionalComplexity.emotionalState
      };
      
      console.log('Entry object to save:', entry);
      console.log('Firestore db object:', db);
      console.log('Collection name: journalEntries');
      console.log('User ID being saved:', entry.userId);
      
      const docRef = await addDoc(collection(db, 'journalEntries'), entry);
      console.log('Document saved with ID:', docRef.id);
      console.log('=== SAVE SUCCESSFUL ===');
      
      // Show success message and redirect
      alert('Journal entry saved successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('=== SAVE ERROR ===');
      console.error('Detailed error saving entry:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      let errorMessage = 'Failed to save entry. ';
      
      if (error.code === 'permission-denied') {
        errorMessage += 'Permission denied. Please check your Firebase rules.';
      } else if (error.code === 'unavailable') {
        errorMessage += 'Firebase is unavailable. Please check your internet connection.';
      } else if (error.code === 'unauthenticated') {
        errorMessage += 'You are not authenticated. Please log in again.';
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your current entry? This action cannot be undone.')) {
      editor?.commands.clearContent();
      setWordCount(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                New Journal Entry
              </h1>
              <span className="ml-4 text-white/80 text-sm">
                {firebaseStatus}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 transform hover:scale-105 transition-all duration-200 font-medium shadow-lg"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Daily Prompt */}
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl border border-white/20 shadow-2xl mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">💭 Today's Prompt</h2>
          <p className="text-white/90 text-lg leading-relaxed">{dailyPrompt}</p>
        </div>

        {/* Editor */}
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl border border-white/20 shadow-2xl mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Write Your Entry</h2>
            <div className="flex items-center space-x-6 text-white/80">
              <span>Words: {wordCount}</span>
              <span>Characters: {editor?.getText().length || 0}</span>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="p-6">
              <EditorContent editor={editor} className="min-h-[400px] prose prose-invert max-w-none" />
            </div>
          </div>
          
          <div className="mt-6 flex justify-between">
            <button
              onClick={handleClear}
              disabled={loading || wordCount === 0}
              className="px-6 py-4 rounded-xl font-medium text-lg shadow-lg transform transition-all duration-200 bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 hover:scale-105 hover:shadow-xl"
            >
              🗑️ Clear Entry
            </button>
            <button
              onClick={handleSave}
              disabled={loading || wordCount === 0}
              className={`px-8 py-4 rounded-xl font-medium text-lg shadow-lg transform transition-all duration-200 ${
                loading || wordCount === 0
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 hover:scale-105 hover:shadow-xl'
              }`}
            >
              {loading ? 'Saving...' : '💾 Save Entry'}
            </button>
          </div>
        </div>

        {/* Mood Analysis Preview */}
        {wordCount > 0 && (
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-8 rounded-2xl border border-white/20 shadow-2xl mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">🧠 Mood Analysis Preview</h3>
            {(() => {
              const analysis = analyzeSentiment(editor?.getText() || '');
              return (
                <div className="space-y-4">
                  {/* Overall Sentiment */}
                  <div className="flex items-center space-x-4">
                    <span className="text-white/80">Overall Mood:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      analysis.sentiment === 'positive' 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : analysis.sentiment === 'negative'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                    }`}>
                      {analysis.sentiment.charAt(0).toUpperCase() + analysis.sentiment.slice(1)}
                    </span>
                    <span className="text-white/60 text-sm">
                      Score: {analysis.sentimentScore.toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Advanced Mood Score Explanation */}
                  <div className="text-white/60 text-xs bg-white/5 p-3 rounded-lg border border-white/10">
                    <strong>Advanced Mood Score Explained:</strong> {analysis.sentimentScore < 0.35 
                      ? `Your score of ${analysis.sentimentScore.toFixed(2)} indicates negative emotions are dominant.` 
                      : analysis.sentimentScore > 0.65 
                      ? `Your score of ${analysis.sentimentScore.toFixed(2)} indicates positive emotions are dominant.` 
                      : `Your score of ${analysis.sentimentScore.toFixed(2)} indicates a balanced emotional state.`
                    } 
                    <br />
                    <strong>Scale:</strong> 0.0 = Very Negative • 0.5 = Neutral • 1.0 = Very Positive
                    <br />
                    <strong>Advanced Calculation:</strong> Multi-factor analysis considering:
                    <br />
                    • <strong>Emotion Ratio (40%):</strong> Weighted positive vs. negative emotions
                    <br />
                    • <strong>Intensity Balance (30%):</strong> How strongly emotions are expressed
                    <br />
                    • <strong>Emotional Diversity (20%):</strong> Number of different emotions present
                    <br />
                    • <strong>Contextual Analysis (10%):</strong> Emotion density in your text
                  </div>

                  {/* Primary Emotions */}
                  {analysis.primaryEmotion && analysis.primaryEmotion !== 'neutral' && (
                    <div className="flex items-center space-x-4">
                      <span className="text-white/80">Primary Emotion:</span>
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-sm font-medium">
                        {analysis.primaryEmotion}
                      </span>
                    </div>
                  )}

                  {/* Emotional State */}
                  {analysis.emotionalComplexity.emotionalState && analysis.emotionalComplexity.emotionalState !== 'neutral' && (
                    <div className="flex items-center space-x-4">
                      <span className="text-white/80">Emotional State:</span>
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-sm font-medium">
                        {analysis.emotionalComplexity.emotionalState}
                      </span>
                    </div>
                  )}

                  {/* Top Emotions */}
                  {analysis.emotions.length > 0 && (
                    <div className="flex items-center space-x-4">
                      <span className="text-white/80">Top Emotions:</span>
                      <div className="flex space-x-2">
                        {analysis.emotions.slice(0, 3).map((emotion, index) => (
                          <span key={index} className="px-2 py-1 rounded-full bg-white/10 text-white/80 text-xs border border-white/20">
                            {emotion}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emotional Complexity */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-white/60 text-xs">Intensity</div>
                      <div className="text-white font-medium capitalize">{analysis.emotionalComplexity.intensity}</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-white/60 text-xs">Diversity</div>
                      <div className="text-white font-medium">{analysis.emotionalComplexity.diversity} emotions</div>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="pt-2">
                    <div className="text-white/80 text-sm mb-2">📊 Score Breakdown:</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-white/70">Emotion Words Found:</span>
                        <span className="text-white">{analysis.totalEmotionWords}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Text Length:</span>
                        <span className="text-white">{editor?.getText().length || 0} characters</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Emotion Density:</span>
                        <span className="text-white">{((analysis.totalEmotionWords / Math.max(editor?.getText().length || 1, 1)) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Insights */}
                  {analysis.insights.length > 0 && (
                    <div className="pt-2">
                      <div className="text-white/80 text-sm mb-2">💡 Insights:</div>
                      <div className="space-y-1">
                        {analysis.insights.slice(0, 3).map((insight, index) => (
                          <div key={index} className="text-white/70 text-sm pl-4 border-l-2 border-purple-500/30">
                            {insight}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actionable Suggestions */}
                  {analysis.suggestions && analysis.suggestions.length > 0 && (
                    <div className="pt-2">
                      <div className="text-white/80 text-sm mb-2">🚀 Actionable Suggestions:</div>
                      <div className="space-y-1">
                        {analysis.suggestions.slice(0, 4).map((suggestion, index) => (
                          <div key={index} className="text-white/70 text-sm pl-4 border-l-2 border-green-500/30">
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Tips */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-8 rounded-2xl border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4">💡 Writing Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-white/80">• Write freely without worrying about grammar or structure</p>
              <p className="text-white/80">• Focus on how you're feeling and why</p>
              <p className="text-white/80">• Include specific details about your day</p>
            </div>
            <div className="space-y-3">
              <p className="text-white/80">• Reflect on what made you happy or grateful</p>
              <p className="text-white/80">• Note any challenges and how you handled them</p>
              <p className="text-white/80">• Set intentions for tomorrow</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
