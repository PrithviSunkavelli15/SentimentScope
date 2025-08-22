import { useState, useEffect } from 'react';
import { format, subDays, startOfDay } from 'date-fns';

export default function WeeklySummary({ entries }) {
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entries.length > 0) {
      generateWeeklySummary();
    }
  }, [entries]);

  const generateWeeklySummary = () => {
    setLoading(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      const weekAgo = startOfDay(subDays(new Date(), 7));
      
      // Get user's earliest entry date as reference point
      let userStartDate;
      if (entries.length > 0) {
        const dates = entries.map(entry => {
          try {
            if (entry.timestamp && entry.timestamp.toDate && typeof entry.timestamp.toDate === 'function') {
              return entry.timestamp.toDate();
            } else if (entry.timestamp) {
              return new Date(entry.timestamp);
            } else {
              return new Date();
            }
          } catch (error) {
            console.error('Error processing timestamp for entry in WeeklySummary:', entry.id, error);
            return new Date();
          }
        }).filter(date => !isNaN(date.getTime()));
        
        if (dates.length > 0) {
          userStartDate = new Date(Math.min(...dates.map(d => d.getTime())));
        } else {
          userStartDate = new Date();
        }
      } else {
        userStartDate = new Date();
      }
      
      const weeklyEntries = entries.filter(entry => {
        let entryDate;
        try {
          if (entry.timestamp && entry.timestamp.toDate && typeof entry.timestamp.toDate === 'function') {
            entryDate = entry.timestamp.toDate();
          } else if (entry.timestamp) {
            entryDate = new Date(entry.timestamp);
          } else {
            entryDate = new Date();
          }
        } catch (error) {
          console.error('Error processing timestamp for entry in WeeklySummary:', entry.id, error);
          entryDate = new Date();
        }
        return entryDate > weekAgo;
      });

      if (weeklyEntries.length === 0) {
        setWeeklyData(null);
        setLoading(false);
        return;
      }

      // Analyze weekly patterns with enhanced emotional data
      const sentimentCounts = weeklyEntries.reduce((acc, entry) => {
        acc[entry.sentiment] = (acc[entry.sentiment] || 0) + 1;
        return acc;
      }, {});

      const emotionFrequency = weeklyEntries.reduce((acc, entry) => {
        if (entry.emotions) {
          entry.emotions.forEach(emotion => {
            acc[emotion] = (acc[emotion] || 0) + 1;
          });
        }
        return acc;
      }, {});

      // Enhanced emotional analysis
      const emotionalComplexity = weeklyEntries.reduce((acc, entry) => {
        if (entry.emotionalComplexity) {
          acc.intensity.push(entry.emotionalComplexity.intensity);
          acc.diversity.push(entry.emotionalComplexity.diversity);
          acc.states.push(entry.emotionalComplexity.emotionalState);
        }
        return acc;
      }, { intensity: [], diversity: [], states: [] });

      const totalWords = weeklyEntries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);
      const averageWords = Math.round(totalWords / weeklyEntries.length);

      // Calculate average emotional complexity
      const avgDiversity = emotionalComplexity.diversity.length > 0 
        ? Math.round(emotionalComplexity.diversity.reduce((a, b) => a + b, 0) / emotionalComplexity.diversity.length)
        : 0;
      
      const mostCommonState = emotionalComplexity.states.length > 0
        ? emotionalComplexity.states.sort((a, b) => 
            emotionalComplexity.states.filter(v => v === a).length - 
            emotionalComplexity.states.filter(v => v === b).length
          ).pop()
        : 'neutral';

      // Generate enhanced insights
      const insights = [];
      
      // Sentiment insights
      if (sentimentCounts.positive > sentimentCounts.negative) {
        insights.push("You've been experiencing more positive emotions this week. Keep up the great energy!");
      } else if (sentimentCounts.negative > sentimentCounts.positive) {
        insights.push("This week has been challenging emotionally. Remember that difficult times are temporary and you're doing great.");
      } else {
        insights.push("Your emotional state has been balanced this week, showing good emotional regulation.");
      }

      // Emotional complexity insights
      if (avgDiversity > 5) {
        insights.push(`High emotional diversity (${avgDiversity} emotions on average) suggests you're experiencing a rich range of feelings.`);
      } else if (avgDiversity < 3) {
        insights.push(`Lower emotional diversity suggests you're experiencing more focused emotional states.`);
      }

      if (mostCommonState && mostCommonState !== 'neutral') {
        insights.push(`Your most common emotional state this week was "${mostCommonState}", indicating a consistent emotional pattern.`);
      }

      // Writing consistency
      if (weeklyEntries.length >= 5) {
        insights.push("Excellent consistency! You've journaled almost every day this week.");
      } else if (weeklyEntries.length >= 3) {
        insights.push("Good progress! You're building a healthy journaling habit.");
      } else {
        insights.push("Consider journaling more frequently to better track your emotional journey.");
      }

      // Emotion insights
      const topEmotions = Object.entries(emotionFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([emotion]) => emotion);

      if (topEmotions.length > 0) {
        insights.push(`Your most frequent emotions this week were: ${topEmotions.join(', ')}.`);
      }

      // Word count insights
      if (averageWords > 100) {
        insights.push("You're writing detailed entries, which shows great self-reflection depth.");
      } else if (averageWords > 50) {
        insights.push("Your entries show good reflection. Consider writing a bit more to dive deeper.");
      }

      // Patterns and recommendations
      const recommendations = [];
      
      if (sentimentCounts.negative > 2) {
        recommendations.push("Consider practicing gratitude exercises or mindfulness techniques.");
      }
      
      if (weeklyEntries.length < 3) {
        recommendations.push("Try setting a daily reminder to journal at a consistent time.");
      }
      
      if (averageWords < 50) {
        recommendations.push("Challenge yourself to write a bit more each day to enhance self-reflection.");
      }

      // Emotional complexity recommendations
      if (avgDiversity < 3) {
        recommendations.push("Try to acknowledge and explore different emotions to build emotional awareness.");
      }

      if (mostCommonState === 'overwhelmed' || mostCommonState === 'stressed') {
        recommendations.push("Consider stress management techniques like deep breathing or taking breaks.");
      }

      setWeeklyData({
        totalEntries: weeklyEntries.length,
        averageWords,
        topEmotions,
        sentimentBreakdown: sentimentCounts,
        insights,
        recommendations,
        weekRange: `${format(weekAgo, 'MMM dd')} - ${format(new Date(), 'MMM dd')}`,
        // Enhanced data
        emotionalComplexity: {
          averageDiversity: avgDiversity,
          mostCommonState,
          intensityLevels: emotionalComplexity.intensity,
          stateDistribution: emotionalComplexity.states
        }
      });
      
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400 mr-2"></div>
          Analyzing your week...
        </div>
      </div>
    );
  }

  if (!weeklyData) {
    return (
      <div className="text-center py-8">
        <p className="text-white/60 text-lg">No entries from the past week to analyze.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
          <h4 className="text-white/70 text-sm font-medium mb-1">Entries This Week</h4>
          <p className="text-2xl font-bold text-purple-300">{weeklyData.totalEntries}</p>
        </div>
        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
          <h4 className="text-white/70 text-sm font-medium mb-1">Average Words</h4>
          <p className="text-2xl font-bold text-blue-300">{weeklyData.averageWords}</p>
        </div>
        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
          <h4 className="text-white/70 text-sm font-medium mb-1">Emotional Diversity</h4>
          <p className="text-2xl font-bold text-green-300">{weeklyData.emotionalComplexity?.averageDiversity || 0}</p>
        </div>
        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
          <h4 className="text-white/70 text-sm font-medium mb-1">Common State</h4>
          <p className="text-2xl font-bold text-pink-300 capitalize">{weeklyData.emotionalComplexity?.mostCommonState || 'N/A'}</p>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-6 rounded-xl border border-white/10">
        <h4 className="text-white font-semibold mb-4 text-lg">💡 Weekly Insights</h4>
        <div className="space-y-3">
          {weeklyData.insights.map((insight, index) => (
            <div key={index} className="flex items-start space-x-3">
              <span className="text-purple-400 text-lg">✨</span>
              <p className="text-white/90 leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {weeklyData.recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-6 rounded-xl border border-white/10">
          <h4 className="text-white font-semibold mb-4 text-lg">🚀 Recommendations</h4>
          <div className="space-y-3">
            {weeklyData.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-3">
                <span className="text-blue-400 text-lg">💡</span>
                <p className="text-white/90 leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emotion Breakdown */}
      {weeklyData.topEmotions.length > 0 && (
        <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 p-6 rounded-xl border border-white/10">
          <h4 className="text-white font-semibold mb-4 text-lg">🎭 Emotion Patterns</h4>
          <div className="flex flex-wrap gap-2">
            {weeklyData.topEmotions.map((emotion, index) => (
              <span key={index} className="px-3 py-2 bg-white/10 text-white rounded-full border border-white/20 text-sm font-medium">
                {emotion}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
