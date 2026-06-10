import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { HeartPulse, Loader2, Sparkles, Wind } from 'lucide-react';
import { DiaryEntry } from '../types';
import { generateStressReliefAdvice } from '../services/aiProvider';

interface StressTabContentProps {
  entries: DiaryEntry[];
}

export default function StressTabContent({ entries }: StressTabContentProps) {
  const [advice, setAdvice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Generate advice only when requested by the user
  }, [entries]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col items-center border border-beige-100">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60"></div>
        <div className="w-20 h-20 bg-amber-100/50 rounded-3xl flex items-center justify-center mb-8 relative z-10 shadow-inner">
          <Wind size={40} className="text-amber-600" />
        </div>
        
        <h2 className="text-3xl font-serif text-ink mb-4 text-center relative z-10">Stress Relief Insights</h2>
        <p className="text-ink/60 text-center max-w-lg mb-10 relative z-10 text-sm leading-relaxed">
          Take a moment to pause. Your emotional well-being is deeply important. Below is personalized guidance based on your recent journey to help you maintain mental stability and lower your stress today.
        </p>

        <div className="w-full max-w-2xl bg-beige-50 rounded-3xl p-8 border border-amber-100/50 relative shadow-inner">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-amber-500" />
            <h3 className="uppercase tracking-widest text-xs font-bold text-ink/40">AI Wellness Guide</h3>
          </div>
          
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-ink/30">
              <Loader2 className="animate-spin mb-3" size={24} />
              <p className="text-sm italic font-serif">Analyzing your emotional balance...</p>
            </div>
          ) : advice ? (
            <p className="font-serif italic text-lg leading-relaxed text-ink/80">
              "{advice}"
            </p>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center">
               <button 
                onClick={async () => {
                  if (isLoading) return;
                  setIsLoading(true);
                  try {
                    const recentContext = entries.slice(0, 5).map(e => ({ content: e.content, mood: e.mood }));
                    const result = await generateStressReliefAdvice(recentContext);
                    setAdvice(result);
                  } catch (error) {
                    setAdvice("I'm currently unable to generate insights, but please remember to take deep breaths and be kind to yourself. You are doing the best you can.");
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="px-6 py-3 bg-amber-500 text-white rounded-full text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
               >
                 Generate Personalized Insights
               </button>
            </div>
          )}

          {!isLoading && advice && (
            <div className="mt-8 pt-6 border-t border-beige-200/50 flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-ink/30 tracking-widest">A moment for you</span>
              <button 
                onClick={async () => {
                  setIsLoading(true);
                  const recentContext = entries.slice(0, 5).map(e => ({ content: e.content, mood: e.mood }));
                  const result = await generateStressReliefAdvice(recentContext);
                  setAdvice(result);
                  setIsLoading(false);
                }}
                className="text-amber-600 text-xs font-bold uppercase hover:text-amber-700 transition-colors"
              >
                Refresh Insight
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-beige-100 relative overflow-hidden">
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-100/50 rounded-2xl flex items-center justify-center text-indigo-500">
              <HeartPulse size={24} />
            </div>
            <h2 className="text-2xl font-serif text-ink">Meditation Guide</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-lg font-serif mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">1</span>
                How to Meditate
              </h3>
              <ul className="space-y-4 text-sm text-ink/70 leading-relaxed">
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0"></div>
                  <p><strong>Find a quiet space</strong> where you won't be disturbed. Sit comfortably with your back straight, either in a chair or on the floor.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0"></div>
                  <p><strong>Close your eyes</strong> gently and take a few deep, slow breaths. Inhale through your nose, exhale through your mouth.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0"></div>
                  <p><strong>Focus on your breath.</strong> Notice the sensation of air entering and leaving your body. The rise and fall of your chest or belly.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0"></div>
                  <p><strong>Acknowledge wandering thoughts.</strong> When your mind drifts (and it will), gently guide your focus back to your breath without judgment.</p>
                </li>
              </ul>
            </div>
            
            <div>
               <h3 className="text-lg font-serif mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">2</span>
                Tips to Improve
              </h3>
              <div className="space-y-4">
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                  <h4 className="font-medium text-indigo-900 mb-1 text-sm">Start Small</h4>
                  <p className="text-xs text-indigo-900/70">Begin with just 3-5 minutes a day. Consistency is far more important than duration when building the habit.</p>
                </div>
                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50">
                  <h4 className="font-medium text-rose-900 mb-1 text-sm">Release Expectations</h4>
                  <p className="text-xs text-rose-900/70">Meditation isn't about perfectly clearing your mind. It's the practice of noticing you've drifted and compassionately coming back.</p>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                  <h4 className="font-medium text-emerald-900 mb-1 text-sm">Anchor Yourself</h4>
                  <p className="text-xs text-emerald-900/70">If focusing on the breath causes anxiety, use a different anchor: the feeling of your hands resting in your lap, or sounds in the room.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] soft-shadow border border-beige-100 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9C8.8 1 15.2 1 19.1 4.9C23 8.8 23 15.2 19.1 19.1C15.2 23 8.8 23 4.9 19.1Z"></path><path d="M22 12A10 10 0 0 0 12 2v0"></path></svg>
          </div>
          <h3 className="font-serif mb-2 font-medium">Box Breathing</h3>
          <p className="text-xs text-ink/50 leading-relaxed mb-4">Inhale 4s. Hold 4s. Exhale 4s. Hold 4s. Repeat to calm the nervous system instantly.</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] soft-shadow border border-beige-100 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16v0Z"></path><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4v0Z"></path><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
          </div>
          <h3 className="font-serif mb-2 font-medium">5-4-3-2-1 Grounding</h3>
          <p className="text-xs text-ink/50 leading-relaxed mb-4">Find 5 things you see, 4 you feel, 3 you hear, 2 you smell, and 1 you can taste.</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] soft-shadow border border-beige-100 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"></path><path d="M12 2v20"></path><path d="m4.93 4.93 14.14 14.14"></path><path d="m19.07 4.93-14.14 14.14"></path></svg>
          </div>
          <h3 className="font-serif mb-2 font-medium">Digital Detox</h3>
          <p className="text-xs text-ink/50 leading-relaxed mb-4">Step away from screens for 15 minutes. Let your brain rest without any external stimulation.</p>
        </div>
      </div>
    </div>
  );
}
