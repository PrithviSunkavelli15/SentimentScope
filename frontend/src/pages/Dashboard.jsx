import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { format } from 'date-fns';
import MoodChart from '../components/MoodChart';
import WeeklySummary from '../components/WeeklySummary';

export default function Dashboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.currentUser) {
      console.log('useEffect: User authenticated, fetching entries...');
      fetchEntries();
    } else {
      console.log('useEffect: No user yet, waiting...');
    }
  }, [auth.currentUser]);

  // Add manual refresh function
  const handleRefresh = () => {
    fetchEntries();
  };

  const debugDatabase = async () => {
    try {
      console.log('=== MANUAL DATABASE DEBUG ===');
      console.log('🔍 CURRENT USER INFO:');
      console.log('Current user object:', auth.currentUser);
      console.log('Current user ID:', auth.currentUser?.uid);
      console.log('Current user email:', auth.currentUser?.email);
      console.log('Current user creation time:', auth.currentUser?.metadata?.creationTime);
      console.log('Current user last sign in:', auth.currentUser?.metadata?.lastSignInTime);
      
      const allEntriesQuery = query(collection(db, 'journalEntries'));
      const allEntriesSnapshot = await getDocs(allEntriesQuery);
      console.log('📊 DATABASE CONTENTS:');
      console.log('Total documents in collection:', allEntriesSnapshot.docs.length);
      
      if (allEntriesSnapshot.docs.length === 0) {
        console.log('❌ NO DOCUMENTS FOUND in journalEntries collection');
        console.log('This means either:');
        console.log('1. No entries were ever saved');
        console.log('2. Entries were saved to wrong collection name');
        console.log('3. Database is empty');
      } else {
        console.log('✅ Documents found! Here they are:');
        allEntriesSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`📄 Document ${index + 1}:`, {
            id: doc.id,
            userId: data.userId,
            timestamp: data.timestamp,
            contentLength: data.content?.length || 0,
            sentiment: data.sentiment,
            email: data.email || 'No email'
          });
          
          // Check if this entry belongs to current user
          if (data.userId === auth.currentUser?.uid) {
            console.log(`   ✅ This entry belongs to CURRENT USER`);
          } else {
            console.log(`   ❌ This entry belongs to DIFFERENT USER`);
            console.log(`   Current user ID: ${auth.currentUser?.uid}`);
            console.log(`   Entry user ID: ${data.userId}`);
            console.log(`   IDs match? ${data.userId === auth.currentUser?.uid}`);
          }
        });
      }
      
      // Check if there are any entries with current user ID
      const currentUserEntries = allEntriesSnapshot.docs.filter(doc => 
        doc.data().userId === auth.currentUser?.uid
      );
      console.log('🎯 ENTRIES FOR CURRENT USER:', currentUserEntries.length);
      
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  const fetchEntries = async () => {
    if (!auth.currentUser) {
      console.log('No current user, skipping fetch');
      return;
    }

    setLoading(true);
    try {
      console.log('=== FETCHING ENTRIES DEBUG ===');
      console.log('Current user:', auth.currentUser);
      console.log('User ID:', auth.currentUser?.uid);
      console.log('User email:', auth.currentUser?.email);
      
      // First, let's check if there are ANY entries in the collection
      const allEntriesQuery = query(collection(db, 'journalEntries'));
      const allEntriesSnapshot = await getDocs(allEntriesQuery);
      console.log('=== ALL ENTRIES IN DATABASE ===');
      console.log('Total documents in collection:', allEntriesSnapshot.docs.length);
      allEntriesSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`Document ${index + 1}:`, {
          id: doc.id,
          userId: data.userId,
          timestamp: data.timestamp,
          contentLength: data.content?.length || 0,
          sentiment: data.sentiment
        });
      });
      
      // Now try our specific query
      console.log('=== SPECIFIC USER QUERY ===');
      const q = query(
        collection(db, 'journalEntries'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('timestamp', 'desc')
      );
      
      console.log('Query object:', q);
      const querySnapshot = await getDocs(q);
      console.log('Query snapshot:', querySnapshot);
      console.log('Number of docs from user query:', querySnapshot.docs.length);
      
      const entriesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Document data:', data);
        
        // Handle Firebase timestamp conversion with better error handling
        let timestamp = data.timestamp;
        try {
          if (timestamp && timestamp.toDate && typeof timestamp.toDate === 'function') {
            timestamp = timestamp.toDate();
          } else if (timestamp && timestamp.seconds) {
            timestamp = new Date(timestamp.seconds * 1000);
          } else if (timestamp) {
            // If it's already a Date object or other format, try to convert it
            timestamp = new Date(timestamp);
          } else {
            // If no timestamp, use current time
            timestamp = new Date();
            console.log('No timestamp found, using current time for document:', doc.id);
          }
        } catch (error) {
          console.error('Error converting timestamp for document:', doc.id, error);
          timestamp = new Date();
        }
        
        return {
          id: doc.id,
          ...data,
          timestamp: timestamp
        };
      });
      
      console.log('Processed entries:', entriesData);
      console.log('Setting entries to state with length:', entriesData.length);
      console.log('=== END FETCH DEBUG ===');
      
      // Set the entries to state
      setEntries(entriesData);
      
      // Verify the state was set
      console.log('State set, checking in next tick...');
      setTimeout(() => {
        console.log('Current entries state after set:', entries);
      }, 100);
      
    } catch (error) {
      console.error('Error fetching entries:', error);
      console.error('Error details:', error.code, error.message);
      console.error('Full error object:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      case 'neutral': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const calculateStreak = (entries) => {
    if (entries.length === 0) return { current: 0, best: 0 };
    
    try {
      // Get all unique dates from entries
      const entryDates = new Set();
      entries.forEach(entry => {
        let entryDate;
        try {
          if (entry.timestamp && entry.timestamp.toDate && typeof entry.timestamp.toDate === 'function') {
            entryDate = entry.timestamp.toDate();
          } else if (entry.timestamp) {
            entryDate = new Date(entry.timestamp);
          } else {
            entryDate = new Date();
          }
          // Format date as YYYY-MM-DD for consistent comparison
          const dateString = entryDate.toISOString().split('T')[0];
          entryDates.add(dateString);
        } catch (error) {
          console.error('Error processing timestamp for entry:', entry.id, error);
        }
      });
      
      const sortedDates = Array.from(entryDates).sort(); // Oldest to newest
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;
      let currentDate = new Date();
      
      // Check consecutive days starting from today (current streak)
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(currentDate);
        checkDate.setDate(checkDate.getDate() - i);
        const dateString = checkDate.toISOString().split('T')[0];
        
        if (entryDates.has(dateString)) {
          currentStreak++;
        } else {
          break; // Streak broken
        }
      }
      
      // Calculate best streak from all entries
      for (let i = 0; i < sortedDates.length - 1; i++) {
        const currentDate = new Date(sortedDates[i]);
        const nextDate = new Date(sortedDates[i + 1]);
        const diffTime = Math.abs(nextDate - currentDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak + 1);
          tempStreak = 0;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak + 1);
      
      return { current: currentStreak, best: bestStreak };
    } catch (error) {
      console.error('Error calculating streak:', error);
      return { current: 0, best: 0 };
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      console.log('Deleting entry:', entryId);
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'journalEntries', entryId));
      
      // Remove from local state
      setEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
      
      console.log('Entry deleted successfully');
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Simple error boundary
  if (!auth.currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">Please log in to access your dashboard.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  try {
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
                  SentimentScope
                </h1>
                <span className="ml-4 text-white/80 text-sm">
                  Welcome back, {auth.currentUser.email}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/journal')}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  ✨ New Entry
                </button>
                <button
                  onClick={handleRefresh}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 transform hover:scale-105 transition-all duration-200 font-medium shadow-lg"
                >
                  🔄 Refresh
                </button>
                <button
                  onClick={debugDatabase}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 font-medium shadow-lg"
                >
                  🛠️ Debug DB
                </button>
                <button
                  onClick={handleSignOut}
                  className="text-white/80 hover:text-white px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-300">
              <h3 className="text-lg font-medium text-white/90 mb-2">Total Entries</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{entries.length}</p>
              <p className="text-xs text-white/60 mt-1">Debug: {entries.length} entries loaded</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-300">
              <h3 className="text-lg font-medium text-white/90 mb-2">This Week</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {entries.filter(entry => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  // Safe timestamp handling
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
                  return entryDate > weekAgo;
                }).length}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-300">
              <h3 className="text-lg font-medium text-white/90 mb-2">🔥 Streak</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                {calculateStreak(entries).current}
              </p>
              <p className="text-xs text-white/60 mt-1">
                current streak • best: {calculateStreak(entries).best}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-300">
              <h3 className="text-lg font-medium text-white/90 mb-2">Journey Start</h3>
              <p className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                {(() => {
                  if (entries.length === 0) return 'N/A';
                  
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
                      const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
                      return format(earliestDate, 'MMM dd');
                    }
                    return 'N/A';
                  } catch (error) {
                    console.error('Error calculating journey start:', error);
                    return 'N/A';
                  }
                })()}
              </p>
              <p className="text-xs text-white/60 mt-1">Your first entry</p>
            </div>
          </div>

          {/* Streak Motivation */}
          {entries.length > 0 && (
            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 p-6 rounded-2xl border border-orange-500/20 shadow-2xl mb-8">
              <div className="text-center">
                {(() => {
                  const streak = calculateStreak(entries);
                  if (streak.current === 0) {
                    return (
                      <div>
                        <p className="text-white/90 text-lg mb-2">🔥 Start your journaling streak today!</p>
                        <p className="text-white/70 text-sm">Write an entry to begin building momentum</p>
                      </div>
                    );
                  } else if (streak.current === 1) {
                    return (
                      <div>
                        <p className="text-white/90 text-lg mb-2">🎯 Great start! You're on day 1</p>
                        <p className="text-white/70 text-sm">Keep it going tomorrow to build your streak</p>
                      </div>
                    );
                  } else if (streak.current < 7) {
                    return (
                      <div>
                        <p className="text-white/90 text-lg mb-2">🚀 Amazing! {streak.current} day streak</p>
                        <p className="text-white/70 text-sm">You're building a great habit</p>
                      </div>
                    );
                  } else if (streak.current < 30) {
                    return (
                      <div>
                        <p className="text-white/90 text-lg mb-2">🔥 Incredible! {streak.current} day streak</p>
                        <p className="text-white/70 text-sm">You're on fire! Keep the momentum going</p>
                      </div>
                    );
                  } else if (streak.current < 100) {
                    return (
                      <div>
                        <p className="text-white/90 text-lg mb-2">🌟 Legendary! {streak.current} day streak</p>
                        <p className="text-white/70 text-sm">You're a journaling master!</p>
                      </div>
                    );
                  } else {
                    return (
                      <div>
                        <p className="text-white/90 text-lg mb-2">🏆 UNSTOPPABLE! {streak.current} day streak</p>
                        <p className="text-white/70 text-sm">You're absolutely incredible!</p>
                      </div>
                    );
                  }
                })()}
                {(() => {
                  const streak = calculateStreak(entries);
                  if (streak.best > streak.current) {
                    return (
                      <p className="text-orange-300 text-sm mt-2">
                        🏅 Your best streak was {streak.best} days - you can beat it!
                      </p>
                    );
                  }
                  return null;
                })()}
                {(() => {
                  const streak = calculateStreak(entries);
                  if (streak.current > 0) {
                    const nextMilestones = [7, 10, 30, 50, 100, 365];
                    const nextMilestone = nextMilestones.find(m => m > streak.current);
                    if (nextMilestone) {
                      const daysToGo = nextMilestone - streak.current;
                      return (
                        <p className="text-yellow-300 text-sm mt-2">
                          🎯 {daysToGo} more days to reach {nextMilestone} days!
                        </p>
                      );
                    }
                  }
                  return null;
                })()}
              </div>
            </div>
          )}

          {/* Mood Chart */}
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl border border-white/20 shadow-2xl mb-8 hover:bg-white/20 transition-all duration-300">
            <h2 className="text-2xl font-semibold text-white mb-6">Mood Trends</h2>
            <MoodChart entries={entries} />
          </div>

          {/* Weekly Summary */}
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl border border-white/20 shadow-2xl mb-8 hover:bg-white/20 transition-all duration-300">
            <h2 className="text-2xl font-semibold text-white mb-6">Weekly Summary</h2>
            <WeeklySummary entries={entries} />
          </div>

          {/* Journal Entries */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/20 bg-gradient-to-r from-purple-500/20 to-blue-500/20">
              <h2 className="text-2xl font-semibold text-white">Journal Entries</h2>
            </div>
            <div className="divide-y divide-white/10">
              {entries.length === 0 ? (
                <div className="px-8 py-16 text-center">
                  <p className="text-white/70 text-lg mb-4">No journal entries yet.</p>
                  <button
                    onClick={() => navigate('/journal')}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-xl hover:from-purple-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 font-medium shadow-lg"
                  >
                    ✨ Write Your First Entry
                  </button>
                </div>
              ) : (
                entries.map((entry) => (
                  <div key={entry.id} className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            entry.sentiment === 'positive' 
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : entry.sentiment === 'negative'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                          }`}>
                            {entry.sentiment.charAt(0).toUpperCase() + entry.sentiment.slice(1)}
                          </span>
                          {entry.primaryEmotion && entry.primaryEmotion !== 'neutral' && (
                            <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium">
                              {entry.primaryEmotion}
                            </span>
                          )}
                          {entry.emotionalState && entry.emotionalState !== 'neutral' && (
                            <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-medium">
                              {entry.emotionalState}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {(() => {
                            try {
                              if (entry.timestamp && entry.timestamp.toDate && typeof entry.timestamp.toDate === 'function') {
                                return format(entry.timestamp.toDate(), 'EEEE, MMMM do');
                              } else if (entry.timestamp) {
                                return format(new Date(entry.timestamp), 'EEEE, MMMM do');
                              } else {
                                return 'Unknown Date';
                              }
                            } catch (error) {
                              console.error('Error formatting date:', error);
                              return 'Unknown Date';
                            }
                          })()}
                        </h3>
                        <p className="text-white/70 text-sm mb-3">
                          {entry.plainText?.substring(0, 200)}
                          {entry.plainText && entry.plainText.length > 200 && '...'}
                        </p>
                        <p className="text-white/50 text-xs mb-3">
                          💡 Click the + button to see full entry and detailed emotional analysis
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-white/60">
                          <span>Words: {entry.wordCount}</span>
                          <span>Score: {entry.sentimentScore?.toFixed(2) || 'N/A'}</span>
                          {entry.emotionalComplexity && (
                            <>
                              <span>Intensity: {entry.emotionalComplexity.intensity}</span>
                              <span>Diversity: {entry.emotionalComplexity.diversity}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                          className="p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-white/20 hover:border-white/40"
                          title={selectedEntry?.id === entry.id ? 'Collapse entry' : 'Expand entry for full content and analysis'}
                        >
                          {selectedEntry?.id === entry.id ? '−' : '+'}
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete entry"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    {selectedEntry?.id === entry.id && (
                      <div className="mt-4 space-y-6">
                        {/* Full Journal Entry Content */}
                        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                          <h4 className="text-lg font-semibold text-white mb-4 border-b border-white/20 pb-2">
                            📝 Full Journal Entry
                          </h4>
                          <div className="prose prose-invert max-w-none text-white/90 leading-relaxed">
                            <div dangerouslySetInnerHTML={{ __html: entry.content }} />
                          </div>
                        </div>
                        
                        {/* Comprehensive Emotional Analysis */}
                        {entry.emotionalComplexity && (
                          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-6 rounded-xl border border-white/20">
                            <h4 className="text-xl font-semibold text-white mb-6 border-b border-white/20 pb-3">
                              🧠 Comprehensive Emotional Analysis
                            </h4>
                            
                            {/* Score and Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                              <div className="text-center p-4 bg-white/10 rounded-xl border border-white/20">
                                <div className="text-white/60 text-sm mb-1">Mood Score</div>
                                <div className="text-2xl font-bold text-white">
                                  {entry.sentimentScore?.toFixed(2) || 'N/A'}
                                </div>
                                <div className="text-white/60 text-xs mt-1">
                                  {entry.sentimentScore < 0.35 
                                    ? 'Negative' 
                                    : entry.sentimentScore > 0.65 
                                    ? 'Positive' 
                                    : 'Neutral'
                                  }
                                </div>
                              </div>
                              <div className="text-center p-4 bg-white/10 rounded-xl border border-white/20">
                                <div className="text-white/60 text-sm mb-1">Emotion Words</div>
                                <div className="text-2xl font-bold text-white">
                                  {entry.totalEmotionWords || 0}
                                </div>
                                <div className="text-white/60 text-xs mt-1">
                                  {entry.wordCount ? `${((entry.totalEmotionWords || 0) / entry.wordCount * 100).toFixed(1)}%` : '0%'} of text
                                </div>
                              </div>
                              <div className="text-center p-4 bg-white/10 rounded-xl border border-white/20">
                                <div className="text-white/60 text-sm mb-1">Overall Sentiment</div>
                                <div className="text-lg font-semibold text-white capitalize">
                                  {entry.sentiment}
                                </div>
                                <div className="text-white/60 text-xs mt-1">
                                  {entry.sentiment === 'positive' ? '😊' : entry.sentiment === 'negative' ? '😔' : '😐'}
                                </div>
                              </div>
                            </div>
                            
                            {/* Emotional Complexity Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                              <div className="text-center p-4 bg-white/10 rounded-xl border border-white/20">
                                <div className="text-white/60 text-sm mb-2">Intensity</div>
                                <div className="text-xl font-bold text-white capitalize">
                                  {entry.emotionalComplexity.intensity}
                                </div>
                                <div className="text-white/60 text-xs mt-1">
                                  {entry.emotionalComplexity.intensity === 'high' ? '🔥' : entry.emotionalComplexity.intensity === 'medium' ? '⚡' : '💧'}
                                </div>
                              </div>
                              <div className="text-center p-4 bg-white/10 rounded-xl border border-white/20">
                                <div className="text-white/60 text-sm mb-2">Diversity</div>
                                <div className="text-xl font-bold text-white">
                                  {entry.emotionalComplexity.diversity}
                                </div>
                                <div className="text-white/60 text-xs mt-1">emotions</div>
                              </div>
                              <div className="text-center p-4 bg-white/10 rounded-xl border border-white/20">
                                <div className="text-white/60 text-sm mb-2">Primary</div>
                                <div className="text-xl font-bold text-white capitalize">
                                  {entry.primaryEmotion || 'neutral'}
                                </div>
                                <div className="text-white/60 text-xs mt-1">dominant</div>
                              </div>
                              <div className="text-center p-4 bg-white/10 rounded-xl border border-white/20">
                                <div className="text-white/60 text-sm mb-2">State</div>
                                <div className="text-xl font-bold text-white capitalize">
                                  {entry.emotionalState || 'neutral'}
                                </div>
                                <div className="text-white/60 text-xs mt-1">overall</div>
                              </div>
                            </div>
                            
                            {/* Top Emotions with Scores */}
                            {entry.emotions && entry.emotions.length > 0 && (
                              <div className="mb-6">
                                <h5 className="text-lg font-semibold text-white mb-3">🎯 Top Emotions Detected</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {entry.emotions.slice(0, 6).map((emotion, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-white/10 rounded-lg border border-white/20">
                                      <span className="text-white font-medium capitalize">{emotion}</span>
                                      <span className="text-white/60 text-sm">
                                        {entry.emotionScores && entry.emotionScores[emotion] 
                                          ? `${entry.emotionScores[emotion]} mentions`
                                          : '1 mention'
                                        }
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Detailed Insights */}
                            {entry.emotionalInsights && entry.emotionalInsights.length > 0 && (
                              <div className="mb-6">
                                <h5 className="text-lg font-semibold text-white mb-3">💡 Emotional Insights</h5>
                                <div className="space-y-3">
                                  {entry.emotionalInsights.map((insight, index) => (
                                    <div key={index} className="p-4 bg-white/10 rounded-lg border-l-4 border-purple-500/50">
                                      <div className="text-white/90 text-sm leading-relaxed">
                                        {insight}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Actionable Suggestions */}
                            {entry.emotionalSuggestions && entry.emotionalSuggestions.length > 0 && (
                              <div className="mb-6">
                                <h5 className="text-lg font-semibold text-white mb-3">🚀 Actionable Suggestions</h5>
                                <div className="space-y-3">
                                  {entry.emotionalSuggestions.map((suggestion, index) => (
                                    <div key={index} className="p-4 bg-white/10 rounded-lg border-l-4 border-green-500/50">
                                      <div className="text-white/90 text-sm leading-relaxed">
                                        {suggestion}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Score Breakdown */}
                            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                              <h5 className="text-lg font-semibold text-white mb-3">📊 Score Breakdown</h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-white/70">Entry Length:</span>
                                  <span className="text-white">{entry.wordCount || 0} words, {entry.plainText?.length || 0} characters</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/70">Emotion Density:</span>
                                  <span className="text-white">
                                    {entry.wordCount && entry.totalEmotionWords 
                                      ? `${((entry.totalEmotionWords / entry.wordCount) * 100).toFixed(1)}%`
                                      : '0%'
                                    }
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/70">Analysis Confidence:</span>
                                  <span className="text-white">
                                    {entry.totalEmotionWords > 5 ? 'High' : entry.totalEmotionWords > 2 ? 'Medium' : 'Low'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering dashboard content:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">An unexpected error occurred while loading the dashboard.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }
}
