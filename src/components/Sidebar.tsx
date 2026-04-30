import React from 'react';
import { motion } from 'motion/react';
import { Book, Calendar, BarChart2, LogOut, PlusCircle, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: 'entries' | 'chat' | 'timeline' | 'stats';
  setActiveTab: (tab: 'entries' | 'chat' | 'timeline' | 'stats') => void;
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
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden sm:flex fixed left-0 top-0 h-full w-20 lg:w-64 bg-white border-r border-beige-200 flex-col items-center lg:items-stretch p-4 lg:p-6 z-40">
        <div className="flex items-center gap-3 mb-10 px-2 leading-none">
          <div className="w-10 h-10 rounded-2xl bg-ink text-beige-50 flex items-center justify-center font-bold text-xl shadow-sm">
            D
          </div>
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
          <div className="w-8 h-8 rounded-xl bg-ink text-beige-50 flex items-center justify-center font-bold text-lg shadow-sm">D</div>
          <span className="font-serif italic font-medium">Dear Diary</span>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="sm:hidden fixed bottom-6 left-4 right-4 h-16 bg-white/90 backdrop-blur-md shadow-2xl rounded-3xl border border-beige-200 z-50 flex items-center justify-around px-2">
        {menuItems.slice(0, 2).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 p-2 py-3 rounded-2xl transition-all relative",
              activeTab === item.id ? "text-ink" : "text-ink/30"
            )}
          >
            {activeTab === item.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute inset-0 bg-beige-100 rounded-2xl -z-10"
              />
            )}
            <item.icon size={20} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label.split(' ')[0]}</span>
          </button>
        ))}

        <button
          onClick={onNewEntry}
          className="flex flex-col items-center justify-center gap-1 p-3 bg-ink text-beige-50 rounded-2xl shadow-xl -translate-y-6 scale-110 border-4 border-beige-50"
        >
          <PlusCircle size={24} />
        </button>

        {menuItems.slice(2).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 p-2 py-3 rounded-2xl transition-all relative",
              activeTab === item.id ? "text-ink" : "text-ink/30"
            )}
          >
            {activeTab === item.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute inset-0 bg-beige-100 rounded-2xl -z-10"
              />
            )}
            <item.icon size={20} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </>
  );
}
