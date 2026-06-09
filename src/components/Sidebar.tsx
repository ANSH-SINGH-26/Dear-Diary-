import React from 'react';
import { motion } from 'motion/react';
import { Book, Calendar, BarChart2, LogOut, PlusCircle, MessageCircle, HeartPulse } from 'lucide-react';
import { cn } from '../lib/utils';
import { Logo } from './Logo';

interface SidebarProps {
  activeTab: 'entries' | 'chat' | 'timeline' | 'stats' | 'stress';
  setActiveTab: (tab: 'entries' | 'chat' | 'timeline' | 'stats' | 'stress') => void;
  onNewEntry: () => void;
  onLogout: () => void;
  userEmail?: string | null;
}

export default function Sidebar({ activeTab, setActiveTab, onNewEntry, onLogout, userEmail }: SidebarProps) {
  const menuItems = [
    { id: 'entries', label: 'My Journal', icon: Book },
    { id: 'chat', label: 'Dear Heart', icon: MessageCircle },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'stats', label: 'Mood Trends', icon: BarChart2 },
    { id: 'stress', label: 'Stress Relief', icon: HeartPulse },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden sm:flex fixed left-0 top-0 h-full w-20 lg:w-64 bg-white border-r border-beige-200 flex-col items-center lg:items-stretch p-4 lg:p-6 z-40">
        <div className="flex items-center gap-3 mb-10 px-2 leading-none">
          <Logo size={44} className="drop-shadow-sm flex-shrink-0" />
          <h1 className="text-xl font-bold tracking-tight hidden lg:block">Dear Diary</h1>
        </div>

        <button
          onClick={onNewEntry}
          className="w-full flex items-center justify-center lg:justify-start gap-3 p-4 mb-8 rounded-2xl bg-beige-100 font-medium text-ink hover:bg-beige-200 transition-all group"
        >
          <PlusCircle className="group-hover:rotate-90 transition-transform flex-shrink-0" size={24} />
          <span className="hidden lg:block">Write Today</span>
        </button>

        <nav className="space-y-2 flex-grow">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center justify-center lg:justify-start gap-4 p-4 rounded-2xl transition-all group",
                activeTab === item.id 
                  ? "bg-ink text-beige-50 shadow-md" 
                  : "text-ink/50 hover:bg-beige-50 hover:text-ink"
              )}
            >
              <item.icon size={20} className="flex-shrink-0" />
              <span className="hidden lg:block font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-4 pt-6 border-t border-beige-100">
          <div className="hidden lg:block px-2">
            <p className="text-xs text-ink/40 font-medium uppercase tracking-wider mb-1">Signed in as</p>
            <p className="text-sm font-medium truncate italic" title={userEmail || ''}>{userEmail}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center lg:justify-start gap-4 p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-medium group"
          >
            <LogOut size={20} className="flex-shrink-0 group-hover:rotate-12 transition-transform" />
            <span className="hidden lg:block">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Top Header (New) */}
      <div className="sm:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 z-50 border-b border-beige-100">
        <div className="flex items-center gap-2">
          <Logo size={36} className="drop-shadow-sm flex-shrink-0" />
          <span className="font-serif italic font-medium ml-1">Dear Diary</span>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="sm:hidden fixed bottom-6 left-4 right-4 h-16 bg-white/95 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl border border-beige-200 z-50 flex items-center justify-around px-2 py-1">
        {menuItems.slice(0, 2).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all relative shrink-0",
              activeTab === item.id ? "text-ink bg-beige-100/50" : "text-ink/30"
            )}
          >
            {activeTab === item.id && (
              <motion.div 
                layoutId="activeTabMobile"
                className="absolute inset-0 bg-ink/5 rounded-2xl -z-10"
              />
            )}
            <item.icon size={20} />
            <span className="text-[9px] font-bold uppercase tracking-wider">{item.label.split(' ')[0]}</span>
          </button>
        ))}

        <button
          onClick={onNewEntry}
          className="flex items-center justify-center w-14 h-14 bg-ink text-beige-50 rounded-2xl shadow-xl -translate-y-7 scale-110 border-4 border-white active:scale-100 transition-transform shrink-0"
        >
          <PlusCircle size={28} />
        </button>

        {menuItems.slice(2).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all relative shrink-0",
              activeTab === item.id ? "text-ink bg-beige-100/50" : "text-ink/30"
            )}
          >
            {activeTab === item.id && (
              <motion.div 
                layoutId="activeTabMobile"
                className="absolute inset-0 bg-ink/5 rounded-2xl -z-10"
              />
            )}
            <item.icon size={20} />
            <span className="text-[9px] font-bold uppercase tracking-wider">{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </>
  );
}
