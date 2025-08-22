import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { format, subDays, startOfDay } from 'date-fns';

Chart.register(...registerables);

export default function MoodChart({ entries }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && entries.length > 0) {
      // Destroy existing chart
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Get user registration date from the first entry or use a default
      let startDate;
      if (entries.length > 0) {
        // Try to get the earliest entry date as registration date
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
            console.error('Error processing timestamp for entry:', entry.id, error);
            return new Date();
          }
        }).filter(date => !isNaN(date.getTime()));
        
        if (dates.length > 0) {
          startDate = new Date(Math.min(...dates.map(d => d.getTime())));
        } else {
          startDate = new Date();
        }
      } else {
        startDate = new Date();
      }

      // Set start date to beginning of the day
      startDate.setHours(0, 0, 0, 0);
      
      // Create array of dates from start date to 30 days later
      const dateRange = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        return startOfDay(date);
      });

      const sentimentData = dateRange.map(date => {
        const dayEntries = entries.filter(entry => {
          let entryDate;
          try {
            if (entry.timestamp && entry.timestamp.toDate && typeof entry.timestamp.toDate === 'function') {
              entryDate = startOfDay(entry.timestamp.toDate());
            } else if (entry.timestamp) {
              entryDate = startOfDay(new Date(entry.timestamp));
            } else {
              entryDate = startOfDay(new Date());
            }
          } catch (error) {
            console.error('Error processing timestamp for entry in MoodChart:', entry.id, error);
            entryDate = startOfDay(new Date());
          }
          return entryDate.getTime() === date.getTime();
        });

        if (dayEntries.length === 0) return null;

        // Calculate average sentiment for the day using ALL entries
        const sentimentScores = dayEntries.map(entry => {
          switch (entry.sentiment?.toLowerCase()) {
            case 'positive': return 1;
            case 'negative': return -1;
            case 'neutral': return 0;
            default: return 0;
          }
        });

        // Calculate the mean (average) of all sentiment scores for the day
        const totalScore = sentimentScores.reduce((sum, score) => sum + score, 0);
        const averageScore = totalScore / sentimentScores.length;
        
        // Round to 2 decimal places for cleaner display
        return Math.round(averageScore * 100) / 100;
      });

      const ctx = chartRef.current.getContext('2d');
      
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dateRange.map(date => format(date, 'MMM dd')),
          datasets: [
            {
              label: 'Mood Score',
              data: sentimentData,
              borderColor: 'rgb(168, 85, 247)', // Purple
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: 'rgb(168, 85, 247)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 8,
              pointHoverBackgroundColor: 'rgb(196, 181, 253)',
              pointHoverBorderColor: '#fff',
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: 'rgb(168, 85, 247)',
              borderWidth: 2,
              cornerRadius: 12,
              callbacks: {
                title: function(context) {
                  const date = dateRange[context[0].dataIndex];
                  return format(date, 'EEEE, MMMM do');
                },
                label: function(context) {
                  const value = context.parsed.y;
                  const date = dateRange[context[0].dataIndex];
                  
                  if (value === null) return 'No entries';
                  
                  // Count how many entries were used for this day's mood calculation
                  const dayEntries = entries.filter(entry => {
                    let entryDate;
                    try {
                      if (entry.timestamp && entry.timestamp.toDate && typeof entry.timestamp.toDate === 'function') {
                        entryDate = startOfDay(entry.timestamp.toDate());
                      } else if (entry.timestamp) {
                        entryDate = startOfDay(new Date(entry.timestamp));
                      } else {
                        entryDate = startOfDay(new Date());
                      }
                    } catch (error) {
                      console.error('Error processing timestamp for entry in tooltip:', entry.id, error);
                      entryDate = startOfDay(new Date());
                    }
                    return entryDate.getTime() === date.getTime();
                  });
                  
                  let mood = 'Neutral';
                  let moodColor = '#6b7280';
                  if (value > 0.3) {
                    mood = 'Positive';
                    moodColor = '#10b981';
                  } else if (value < -0.3) {
                    mood = 'Negative';
                    moodColor = '#ef4444';
                  }
                  
                  const entryCount = dayEntries.length;
                  const entryText = entryCount === 1 ? 'entry' : 'entries';
                  
                  // Get additional insights for this day
                  let insights = '';
                  if (dayEntries.length > 0) {
                    const firstEntry = dayEntries[0];
                    if (firstEntry.primaryEmotion && firstEntry.primaryEmotion !== 'neutral') {
                      insights = ` • Primary: ${firstEntry.primaryEmotion}`;
                    }
                    if (firstEntry.emotionalState && firstEntry.emotionalState !== 'neutral') {
                      insights += ` • State: ${firstEntry.emotionalState}`;
                    }
                  }
                  
                  return `Mood: ${mood} (${value.toFixed(2)}) • ${entryCount} ${entryText}${insights}`;
                }
              }
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Date',
                color: 'rgba(255, 255, 255, 0.8)',
                font: {
                  size: 14,
                  weight: '600'
                }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)',
                drawBorder: false
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)',
                font: {
                  size: 12
                },
                // Show every day on the x-axis
                maxTicksLimit: 30,
                callback: function(value, index) {
                  const date = dateRange[index];
                  if (date) {
                    return format(date, 'MMM dd');
                  }
                  return '';
                }
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Mood Score',
                color: 'rgba(255, 255, 255, 0.8)',
                font: {
                  size: 14,
                  weight: '600'
                }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)',
                drawBorder: false
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)',
                font: {
                  size: 12
                },
                callback: function(value) {
                  if (value === 1) return 'Very Positive';
                  if (value === 0) return 'Neutral';
                  if (value === -1) return 'Very Negative';
                  return value.toFixed(1);
                }
              },
              min: -1,
              max: 1
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          },
          elements: {
            point: {
              hoverRadius: 8,
              hoverBorderWidth: 3
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No entries yet. Start journaling to see your mood trends!</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white/90 mb-2">Your 30-Day Emotional Journey</h3>
        <p className="text-sm text-white/60">
          {(() => {
            if (entries.length === 0) return 'Start your journey today!';
            
            try {
              const dates = entries.map(entry => {
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
                  console.error('Error processing timestamp for entry:', entry.id, error);
                  entryDate = new Date();
                }
                return entryDate;
              }).filter(date => !isNaN(date.getTime()));
              
              if (dates.length > 0) {
                const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 29); // 30 days total (0-29)
                return `From ${format(startDate, 'MMM dd')} to ${format(endDate, 'MMM dd')} • Daily average moods`;
              }
              return 'Timeline loading...';
            } catch (error) {
              console.error('Error calculating timeline:', error);
              return 'Timeline loading...';
            }
          })()}
        </p>
      </div>
      <div style={{ height: '400px' }}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}
