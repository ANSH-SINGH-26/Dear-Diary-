import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Loader2, Heart, Search, MessageCircle, X, LogOut } from 'lucide-react';
import { Logo } from './components/Logo';
import Sidebar from './components/Sidebar';
import Timeline from './components/Timeline';
import MoodChart from './components/MoodChart';
import WritingInterface from './components/WritingInterface';
import EntryCard from './components/EntryCard';
import ChatSupport from './components/ChatSupport';
import ChatTabContent from './components/ChatTabContent';
import StressTabContent from './components/StressTabContent';
import { getDailyThought } from './utils/thoughts';
import { DiaryEntry } from './types';
import { cn, handleFirestoreError, OperationType, formatDate } from './lib/utils';
import { auth, signInWithGoogle, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  setDoc, 
  doc, 
  getDoc,
  deleteDoc
} from 'firebase/firestore';

import { analyzeEntry, generatePersonalizedPrompt } from './services/aiProvider';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';

const MOOD_COLORS: { [key: string]: string } = {
  happy: '#FCD34D',
  sad: '#60A5FA',
  anxious: '#F87171',
  angry: '#EF4444',
  neutral: '#9CA3AF'
};

const PROMPTS = [
  "What was the smallest thing that made you smile today?",
  "Write about a person who has made a positive impact on your life recently.",
  "If today was a color, what would it be and why?",
  "What is one challenge you overcame this week, no matter how small?",
  "Describe a place where you feel completely at peace.",
  "What is a goal you're working toward, and what's one step you took today?",
  "Write a letter to your future self about how you're feeling right now."
];

const QUOTES = [
  "Your heart knows things that your mind can't explain.",
  "Breath by breath, let it go.",
  "There is a crack in everything, that's how the light gets in.",
  "Self-care is not selfish and it's not a luxury.",
  "Every day is a new page in your story."
];

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'entries' | 'chat' | 'timeline' | 'stats' | 'stress'>('entries');
  const [isWriting, setIsWriting] = useState(false);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [streak, setStreak] = useState(0);
  const [dailyPrompt, setDailyPrompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const [dailyQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [isPromptLoading, setIsPromptLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<string | undefined>();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      
      if (firebaseUser) {
        // Sync user profile
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              streak: 0,
              createdAt: serverTimestamp()
            });
          } else {
            setStreak(userDoc.data().streak || 0);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    const path = `users/${user.uid}/entries`;
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeEntries = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data({ serverTimestamps: 'estimate' })
      })) as DiaryEntry[];
      
      // Update state only if data actually changed (shallow comparison or just update)
      setEntries(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribeEntries();
  }, [user]);

  const handleTabChange = (tab: 'entries' | 'chat' | 'timeline' | 'stats' | 'stress') => {
    setActiveTab(tab);
    setIsWriting(false);
    setSelectedEntry(null);
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Login failed", error);
      setLoginError(error?.message || "Login failed. Please check if popups are blocked.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await signOut(auth);
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this entry? This action cannot be undone.")) return;
    
    try {
      const path = `users/${user.uid}/entries/${entryId}`;
      await deleteDoc(doc(db, 'users', user.uid, 'entries', entryId));
      setSelectedEntry(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/entries/${entryId}`);
    }
  };

  const handleDownloadJournal = () => {
    const data = entries.map(e => ({
      date: formatDate(e.createdAt),
      content: e.content,
      mood: e.mood,
      reflection: e.aiResponse
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-diary-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5 || hour >= 22) return "Good Night";
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const handleSaveEntry = async (content: string, title?: string, imageUrl?: string) => {
    if (!user) return;
    setIsSaving(true);
    setAiResponse(null);

    try {
      // 1. Analyze with AI
      const analysis = await analyzeEntry(
        content, 
        entries.slice(0, 3).map(e => ({ content: e.content, mood: e.mood }))
      );
      
      const entryData = {
        userId: user.uid,
        title: title || null,
        content,
        imageUrl: imageUrl || null,
        mood: analysis.sentiment,
        moodIntensity: analysis.intensity,
        tags: [],
        suggestedTag: analysis.suggestedTag,
        aiResponse: analysis.response,
        moodColor: analysis.moodColor,
        distressLevel: analysis.distressLevel || 'low',
        updatedAt: serverTimestamp(),
      };

      if (editingEntry) {
        // Update existing
        const entryRef = doc(db, 'users', user.uid, 'entries', editingEntry.id);
        await setDoc(entryRef, entryData, { merge: true });
        setEditingEntry(null);
        setIsWriting(false);
      } else {
        // Save new to Firestore
        const path = `users/${user.uid}/entries`;
        await addDoc(collection(db, path), {
          ...entryData,
          createdAt: serverTimestamp(),
        });

        // 3. Update Streak (Better Logic)
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        
        let newStreak = streak;
        const today = new Date().toLocaleDateString('en-CA'); // Gets YYYY-MM-DD in local time
        const lastDate = userData?.lastEntryDate?.split('T')[0];

        if (lastDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toLocaleDateString('en-CA');
          
          newStreak = (lastDate === yesterdayStr) 
            ? streak + 1 
            : 1;
          setStreak(newStreak);
          await setDoc(userRef, { streak: newStreak, lastEntryDate: new Date().toISOString() }, { merge: true });
        }
      }

      setAiResponse(analysis.response);
    } catch (error) {
      console.error("Save error:", error);
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/entries`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredEntries = entries.filter(e => 
    e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.title && e.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    e.suggestedTag?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const moodDistribution = React.useMemo(() => {
    return Object.entries(
      entries.reduce((acc: any, e) => {
        acc[e.mood] = (acc[e.mood] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value }));
  }, [entries]);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-beige-50 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-ink mb-4" size={32} />
        <p className="font-serif italic text-ink/60">Opening your diary...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-beige-100 flex items-center justify-center p-4 sm:p-6 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-2xl text-center space-y-6 sm:space-y-8"
        >
          <div className="flex justify-center">
            <div className="hover:scale-105 transition-transform duration-500">
              <Logo size={100} className="drop-shadow-2xl" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-serif text-ink mb-3">Dear Diary</h1>
            <p className="text-ink/60 leading-relaxed italic">
              "Your private sanctuary for thoughts, emotions, and growth."
            </p>
          </div>
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-ink text-beige-50 rounded-2xl font-medium hover:bg-ink/90 transition-all group disabled:opacity-50"
          >
            {isLoggingIn ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <span>Begin Your Story</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {loginError && (
            <div className="p-4 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-1">
              {loginError}
              <div className="mt-2 font-bold opacity-70 underline cursor-pointer" onClick={() => window.location.reload()}>
                Try Refreshing
              </div>
            </div>
          )}
          <p className="text-xs text-ink/40 font-medium uppercase tracking-widest pt-4">
            Encrypted & Secure &sdot; AI-Powered Empathy
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-50 sm:pl-20 lg:pl-64 transition-all pb-24 pt-16 sm:pt-0">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        onNewEntry={() => setIsWriting(true)}
        onLogout={handleLogout}
        userEmail={user.email}
      />

      <main className="p-6 lg:p-12 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {isWriting || editingEntry ? (
            <WritingInterface 
              key="writer"
              onSave={handleSaveEntry} 
              isSaving={isSaving} 
              aiResponse={aiResponse}
              initialContent={editingEntry?.content}
              initialTitle={editingEntry?.title}
              initialImage={editingEntry?.imageUrl}
              onClose={() => {
                setIsWriting(false);
                setEditingEntry(null);
                setAiResponse(null);
              }}
            />
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                  <h2 className="text-sm font-medium text-ink/40 uppercase tracking-[0.2em] mb-2">Welcome Back</h2>
                  <h1 className="text-4xl font-serif mb-3">{getGreeting()}, {user.displayName?.split(' ')[0] || 'Friend'}</h1>
                  <div className="flex items-start gap-2 max-w-md">
                    <Heart className="text-rose-400 mt-1 flex-shrink-0" size={16} />
                    <p className="text-sm text-ink/70 italic leading-relaxed">
                      "{getDailyThought()}"
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
                  <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search inner thoughts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full md:w-64 pl-12 pr-4 py-3 rounded-full bg-white border border-beige-200 focus:outline-none focus:ring-2 focus:ring-ink/5 transition-all text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-full soft-shadow border border-beige-100">
                    <Sparkles size={14} className="text-amber-500" />
                    <span className="text-sm font-medium whitespace-nowrap">{streak} Day Streak</span>
                  </div>
                </div>
              </div>

              {activeTab === 'entries' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-serif">Recent Reflections</h3>
                      <button 
                        onClick={() => handleTabChange('timeline')}
                        className="text-sm font-medium text-ink/40 hover:text-ink transition-colors"
                      >
                        See All Entries
                      </button>
                    </div>

                    {entries.length === 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-12 text-center bg-white rounded-[2.5rem] border border-dashed border-beige-300"
                      >
                        <Heart className="mx-auto text-beige-300 mb-4" size={48} />
                        <h4 className="text-xl font-serif mb-2">A blank page is a new beginning.</h4>
                        <p className="text-ink/40 text-sm italic mb-6">"Everything that happens is a chance to learn about yourself."</p>
                        <button 
                          onClick={() => setIsWriting(true)}
                          className="px-6 py-3 bg-ink text-beige-50 rounded-full text-sm font-medium hover:scale-105 transition-transform"
                        >
                          Write my first entry
                        </button>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredEntries.slice(0, 6).map((entry, index) => (
                        <EntryCard 
                          key={entry.id} 
                          entry={entry} 
                          onClick={() => setSelectedEntry(entry)} 
                          index={index}
                        />
                      ))}
                      {entries.length > 0 && filteredEntries.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white/30 rounded-[2.5rem] border border-dashed border-beige-300">
                          <p className="text-ink/30 italic font-serif text-lg">
                            "No matches found in your garden of thoughts."
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="p-8 bg-white rounded-[2.5rem] soft-shadow border border-beige-100 h-fit">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-serif italic">Mood View</h3>
                        <span className="text-[10px] text-ink/40 font-medium uppercase tracking-widest">7 Days</span>
                      </div>
                      <MoodChart entries={entries} />
                    </div>

                    <div className="p-8 bg-beige-200 text-ink rounded-[2.5rem] shadow-sm border border-beige-300/50">
                      <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-ink/40 mb-4 flex items-center justify-between">
                        Prompt of the Day
                        <div className="flex items-center gap-2">
                          {isPromptLoading && <Loader2 size={12} className="animate-spin text-amber-500" />}
                          <button 
                            onClick={() => {
                              setIsPromptLoading(true);
                              generatePersonalizedPrompt(entries.slice(0, 5).map(e => ({ content: e.content, mood: e.mood })))
                                .then(setDailyPrompt)
                                .finally(() => setIsPromptLoading(false));
                            }}
                            className="p-1 hover:bg-beige-300 rounded-lg transition-colors text-ink/40 hover:text-ink/60"
                            title="Generate new prompt"
                          >
                            <Sparkles size={12} />
                          </button>
                        </div>
                      </h3>
                      <p className="font-serif italic text-lg leading-relaxed mb-6">
                        "{dailyPrompt}"
                      </p>
                      <button 
                        onClick={() => setIsWriting(true)}
                        className="text-sm font-bold flex items-center gap-2 hover:translate-x-1 transition-transform"
                      >
                        Start writing <ArrowRight size={14} />
                      </button>
                    </div>

                    <div className="p-8 bg-ink text-beige-100 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/10 transition-all" />
                      <h3 className="text-lg font-serif italic mb-2 relative z-10">Latest Reflection</h3>
                      <p className="text-beige-100/70 text-sm leading-relaxed mb-6 italic relative z-10">
                        {entries[0]?.aiResponse 
                          ? `"${entries[0].aiResponse.substring(0, 150)}..."` 
                          : dailyQuote}
                      </p>
                      <div className="pt-6 border-t border-white/5 space-y-4 relative z-10">
                        <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-widest opacity-60">
                          <Heart size={14} />
                          <span>Mental Wellness</span>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div key={i} className={cn("flex-grow h-1.5 rounded-full", i <= (streak % 8) ? "bg-amber-400" : "bg-white/10")} />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-8 bg-white rounded-[2.5rem] soft-shadow border border-amber-100 overflow-hidden relative group">
                      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-150 transition-transform duration-700" />
                      <h3 className="text-lg font-serif italic mb-3 relative z-10">Need a Friend?</h3>
                      <p className="text-sm text-ink/60 leading-relaxed mb-6 relative z-10">
                        Sometimes writing isn't enough. I'm here to listen if you just want to talk about your day.
                      </p>
                      <button 
                        onClick={() => {
                          setChatContext("I'm here. What's on your mind? We can talk about how you're feeling or anything else you'd like to share.");
                          setIsChatOpen(true);
                        }}
                        className="px-6 py-3 bg-amber-500 text-white rounded-full text-sm font-medium hover:bg-amber-600 transition-colors relative z-10 flex items-center gap-2"
                      >
                        Talk to Me <MessageCircle size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="bg-white rounded-none sm:rounded-[2rem] md:rounded-[3rem] shadow-none sm:shadow-xl border-t border-beige-100 sm:border sm:border-beige-100 overflow-hidden fixed top-16 bottom-0 left-0 right-0 sm:static sm:h-[70vh] flex flex-col z-30 sm:z-auto">
                  <div className="p-4 pb-[6.5rem] sm:p-8 md:p-12 h-full flex flex-col">
                    <ChatTabContent />
                  </div>
                </div>
              )}

              {activeTab === 'stress' && (
                <StressTabContent entries={entries} />
              )}

              {activeTab === 'timeline' && (
                <Timeline entries={filteredEntries} onSelectEntry={setSelectedEntry} />
              )}

              {activeTab === 'stats' && (
                <div className="space-y-8">
                  <div className="bg-white p-12 rounded-[3rem] soft-shadow">
                    <h2 className="text-3xl font-serif mb-8 text-center text-ink/80">Your Emotional Journey</h2>
                    <div className="h-96">
                       <MoodChart entries={entries} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-12 rounded-[3rem] soft-shadow flex flex-col items-center">
                      <h3 className="text-xl font-serif mb-6 italic">Mood Distribution</h3>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={moodDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {moodDistribution.map((entry: any) => (
                                <Cell key={entry.name} fill={MOOD_COLORS[entry.name] || '#CBD5E1'} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#fff', 
                                border: 'none', 
                                borderRadius: '1rem', 
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {Object.keys(MOOD_COLORS).map(mood => (
                          <div key={mood} className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink/40">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MOOD_COLORS[mood] }} />
                            <span>{mood}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-12 rounded-[3rem] soft-shadow">
                      <h3 className="text-xl font-serif mb-8 italic">Journaling Insights</h3>
                      <div className="space-y-6">
                        <div className="p-6 rounded-3xl bg-beige-50 border border-beige-100">
                          <p className="text-sm font-medium text-ink/40 uppercase mb-2">Most Common Mood</p>
                          <p className="text-2xl font-serif capitalize">
                            {moodDistribution.length > 0 
                              ? [...moodDistribution].sort((a: any, b: any) => b.value - a.value)[0].name
                              : "N/A"}
                          </p>
                        </div>
                        <div className="p-6 rounded-3xl bg-beige-50 border border-beige-100">
                          <p className="text-sm font-medium text-ink/40 uppercase mb-2">Total Reflections</p>
                          <p className="text-2xl font-serif">{entries.filter(e => e.aiResponse).length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="p-6 rounded-3xl bg-beige-50">
                      <p className="text-3xl font-bold text-ink mb-1">{entries.length}</p>
                      <p className="text-xs text-ink/40 uppercase tracking-widest">Total Entries</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-beige-50">
                      <p className="text-3xl font-bold text-ink mb-1">{streak}</p>
                      <p className="text-xs text-ink/40 uppercase tracking-widest">Current Streak</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-beige-50">
                      <p className="text-3xl font-bold text-ink mb-1">
                        {entries.length > 0 ? entries.filter(e => e.mood === 'happy').length : 0}
                      </p>
                      <p className="text-xs text-ink/40 uppercase tracking-widest">Happy Days</p>
                    </div>
                  </div>
                  
                  <div className="mt-12 flex justify-center">
                    <button 
                      onClick={handleDownloadJournal}
                      className="px-8 py-4 bg-ink text-beige-50 rounded-2xl font-serif italic text-lg hover:bg-ink/90 transition-all shadow-xl"
                    >
                      Download My Journey (JSON)
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <LogOut size={32} />
              </div>
              <h3 className="text-xl font-serif mb-2">Sign Out?</h3>
              <p className="text-ink/60 text-sm mb-8">
                Are you sure you want to sign out of your private sanctuary?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="py-3 px-6 bg-beige-100 text-ink rounded-xl font-medium hover:bg-beige-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="py-3 px-6 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-100"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedEntry && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEntry(null)}
              className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-beige-50 rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col mx-auto"
            >
              <div className="p-6 md:p-12 overflow-y-auto">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-[10px] md:text-xs uppercase tracking-widest text-ink/40 mb-2 font-medium">
                      Entry Date: {selectedEntry.createdAt?.seconds ? new Date(selectedEntry.createdAt.seconds * 1000).toLocaleDateString() : 'Saving...'}
                    </p>
                    <h2 className="text-2xl md:text-3xl font-serif">
                      {selectedEntry.title || 'A closer look...'}
                    </h2>
                  </div>
                  <button 
                    onClick={() => setSelectedEntry(null)}
                    className="p-3 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-md group border border-beige-100"
                  >
                    <X size={20} className="text-ink transition-transform group-hover:rotate-90" />
                  </button>
                </div>

                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 space-y-8">
                    {selectedEntry.imageUrl && (
                      <div className="w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-lg mb-8">
                        <img src={selectedEntry.imageUrl} alt="Memory" className="w-full h-auto max-h-[400px] md:max-h-[500px] object-cover" />
                      </div>
                    )}
                    <div className="font-serif text-lg md:text-xl leading-relaxed text-ink/90 whitespace-pre-wrap">
                      {selectedEntry.content}
                    </div>
                  </div>
                  <div className="space-y-6 md:space-y-8">
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                      <button 
                        onClick={() => {
                          setEditingEntry(selectedEntry);
                          setSelectedEntry(null);
                        }}
                        className="w-full py-4 px-6 bg-ink text-beige-50 rounded-2xl md:rounded-3xl text-sm font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2"
                      >
                        Edit
                      </button>

                      <button 
                        onClick={() => selectedEntry && handleDeleteEntry(selectedEntry.id)}
                        className="w-full py-4 px-6 border border-red-100 text-red-500 rounded-2xl md:rounded-3xl text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                      >
                        Delete
                      </button>
                    </div>

                    {selectedEntry.aiResponse && (
                      <div className={cn(
                        "p-6 rounded-3xl soft-shadow border",
                        selectedEntry.mood === 'sad' ? 'bg-blue-50 border-blue-100' : 'bg-white border-beige-100'
                      )}>
                        <div className="flex items-center gap-2 mb-4 text-ink/50 uppercase text-[10px] tracking-widest font-bold">
                          <Sparkles size={12} className="text-amber-500" />
                          <span>Friend's Reflection</span>
                        </div>
                        <p className={cn(
                          "text-sm italic leading-relaxed mb-4",
                          selectedEntry.mood === 'sad' ? 'text-blue-900/80 font-medium' : 'text-ink/70'
                        )}>
                          "{selectedEntry.aiResponse}"
                        </p>
                        
                        {/* Safe Distress UI */}
                        {selectedEntry.distressLevel === 'high' && (
                          <div className="mt-4 p-5 bg-red-50 rounded-2xl border border-red-100 text-xs text-red-900 leading-relaxed italic shadow-sm">
                            <div className="flex items-center gap-2 mb-2 text-red-600 font-bold uppercase tracking-wider text-[10px]">
                              <Sparkles size={12} />
                              <span>Support Note</span>
                            </div>
                            It sounds like things are really heavy right now. Please remember that you don't have to carry this alone. Talking to a friend, family member, or professional can make a major difference. 
                            <br /><br />
                            If you're in immediate danger, please contact local emergency services or a crisis hotline immediately.
                            <div className="mt-4 flex gap-3">
                              <a 
                                href="https://findahelpline.com/" 
                                target="_blank" 
                                rel="noreferrer"
                                className="px-4 py-2 bg-red-600 text-white rounded-full font-bold uppercase text-[9px] hover:bg-red-700 transition-colors"
                              >
                                Find a Helpline
                              </a>
                            </div>
                          </div>
                        )}

                        <button 
                          onClick={() => {
                            if (selectedEntry.aiResponse) {
                              navigator.clipboard.writeText(selectedEntry.aiResponse);
                              setCopied(true);
                            }
                          }}
                          className="mt-4 text-[10px] uppercase font-bold text-ink/50 hover:text-ink transition-colors flex items-center gap-1"
                        >
                          {copied ? "Copied!" : "Copy Reflection"}
                        </button>

                        <button 
                          onClick={() => {
                            setChatContext(`I noticed your reflection on your entry earlier: "${selectedEntry.aiResponse}". Would you like to talk more about how you're feeling?`);
                            setIsChatOpen(true);
                          }}
                          className="mt-4 ml-auto text-[10px] uppercase font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1 group"
                        >
                          Talk about this <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    )}
                    <div className="p-6 bg-white rounded-3xl soft-shadow border border-beige-100">
                       <div className="flex items-center gap-2 mb-4 text-ink/50 uppercase text-[10px] tracking-widest font-bold">
                          <Heart size={12} className="text-red-400" />
                          <span>Mood Profile</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-ink/40 capitalize">{selectedEntry.mood}</span>
                            <span className="font-bold">{selectedEntry.moodIntensity}/10</span>
                          </div>
                          <div className="h-1.5 bg-beige-50 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${selectedEntry.moodIntensity * 10}%` }}
                              className="h-full bg-ink"
                            />
                          </div>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {isChatOpen && (
          <ChatSupport 
            onClose={() => setIsChatOpen(false)} 
            initialMessage={chatContext}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
