import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Loader2, MessageCircle, User, Heart, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { talkToAI } from '../services/aiProvider';

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

interface ChatSupportProps {
  onClose: () => void;
  initialMessage?: string;
}

export default function ChatSupport({ onClose, initialMessage }: ChatSupportProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'normal' | 'psychologist'>('normal');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMessage) {
      setMessages([{ role: 'model', text: initialMessage, timestamp: new Date() }]);
    } else {
      setMessages([{ role: 'model', text: "I'm here for you. How are you feeling right now?", timestamp: new Date() }]);
    }
  }, [initialMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    const timestamp = new Date();
    setMessages(prev => [...prev, { role: 'user', text: userMsg, timestamp }]);
    setIsLoading(true);

    try {
      // Create a clean history for Gemini:
      const history = messages
        .filter(m => m.text.trim())
        .slice(-10)
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      const response = await talkToAI(userMsg, history, mode);
      setMessages(prev => [...prev, { role: 'model', text: response, timestamp: new Date() }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "I'm sorry, I'm having trouble connecting. Could we try again?",
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed inset-4 sm:inset-auto sm:right-8 sm:bottom-8 sm:w-[400px] h-[600px] max-h-[80vh] bg-white rounded-[2.5rem] shadow-2xl z-[60] flex flex-col overflow-hidden border border-beige-200"
    >
      {/* Header */}
      <div className="p-6 bg-ink text-beige-50 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-beige-50/10 rounded-xl">
              <MessageCircle size={20} className="text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">{mode === 'psychologist' ? 'Dr. Heart' : 'Dear Heart'}</h3>
              <p className="text-[10px] text-beige-50/50 uppercase tracking-widest font-bold">{mode === 'psychologist' ? 'Clinical mode' : 'Always Here'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Toggle Mode */}
        <div className="flex bg-beige-50/10 p-1 rounded-xl">
          <button 
            onClick={() => setMode('normal')}
            className={cn("flex-1 text-xs font-bold uppercase tracking-wider py-1.5 rounded-lg transition-colors", mode === 'normal' ? "bg-white text-ink shadow-sm" : "text-beige-50/70 hover:text-white")}
          >
            Friend
          </button>
          <button 
            onClick={() => setMode('psychologist')}
            className={cn("flex-1 text-xs font-bold uppercase tracking-wider py-1.5 rounded-lg transition-colors", mode === 'psychologist' ? "bg-white text-ink shadow-sm" : "text-beige-50/70 hover:text-white")}
          >
            Psychologist
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-6 space-y-6 bg-beige-50/30 custom-scrollbar"
      >
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            key={i}
            className={cn(
              "flex flex-col gap-1.5",
              msg.role === 'user' ? "items-end" : "items-start"
            )}
          >
            <div className={cn(
              "flex items-start gap-2.5",
              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}>
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm mt-1",
                msg.role === 'user' ? "bg-amber-100 text-amber-700" : "bg-ink text-beige-50"
              )}>
                {msg.role === 'user' ? <User size={12} /> : <Heart size={12} fill="currentColor" />}
              </div>
              <div className={cn(
                "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
                msg.role === 'user' 
                  ? "bg-amber-500 text-white rounded-tr-none shadow-sm" 
                  : "bg-white border border-beige-200 text-ink rounded-tl-none shadow-sm"
              )}>
                {msg.text}
              </div>
            </div>
            <span className={cn(
              "text-[9px] font-bold uppercase tracking-widest text-ink/20 px-10",
              msg.role === 'user' ? "text-right" : "text-left"
            )}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {msg.role === 'user' && i < messages.length - 1 && " · Viewed"}
            </span>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-2.5 ml-0"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm bg-ink text-beige-50">
              <Heart size={12} fill="currentColor" />
            </div>
            <div className="bg-white border border-beige-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center">
              {[0, 0.2, 0.4].map((delay, idx) => (
                <motion.div 
                  key={idx}
                  animate={{ opacity: [0.3, 1, 0.3] }} 
                  transition={{ repeat: Infinity, duration: 1, delay }}
                  className="w-1 h-1 bg-ink/30 rounded-full" 
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-beige-100">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2 bg-beige-50 p-1 rounded-full border border-transparent focus-within:ring-2 focus-within:ring-amber-500/20 transition-all"
        >
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow pl-5 py-2.5 bg-transparent border-none text-sm focus:ring-0 placeholder:text-ink/20 min-w-0"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="shrink-0 w-10 h-10 bg-ink text-beige-50 rounded-full hover:bg-ink/90 disabled:opacity-50 transition-all flex items-center justify-center shadow-md"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
