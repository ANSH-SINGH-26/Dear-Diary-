import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Loader2, Bot, User, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { talkToAI } from '../services/aiProvider';

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export default function ChatTabContent() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      text: "I'm here to listen. How has your day been? Feel free to share anything on your mind.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      const history = messages
        .filter(m => m.text.trim())
        .slice(-12)
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      const response = await talkToAI(userMsg, history);
      setMessages(prev => [...prev, { role: 'model', text: response, timestamp: new Date() }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "I'm sorry, I'm having trouble connecting. Could we try talking again in a moment?",
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-serif">Dear Heart</h2>
          <p className="text-sm text-ink/40 italic">"Your story matters. I'm here to listen."</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full border border-amber-100">
          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-700">Live Support</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto space-y-8 pr-4 mb-6 custom-scrollbar"
      >
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={cn(
              "flex items-start gap-4",
              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-110",
              msg.role === 'user' ? "bg-amber-100 text-amber-700" : "bg-ink text-beige-50"
            )}>
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className="flex flex-col gap-1.5 max-w-[75%]">
              <div className={cn(
                "p-5 rounded-3xl text-sm md:text-base leading-relaxed relative group transition-all",
                msg.role === 'user' 
                  ? "bg-amber-500 text-white rounded-tr-none shadow-md hover:shadow-lg" 
                  : "bg-white border border-beige-100 text-ink rounded-tl-none shadow-sm hover:shadow-md"
              )}>
                {msg.text}
              </div>
              <span className={cn(
                "text-[10px] font-medium tracking-tight text-ink/30 px-1",
                msg.role === 'user' ? "text-right" : "text-left"
              )}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {msg.role === 'user' && i < messages.length - 1 && " · Read"}
              </span>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm bg-ink text-beige-50">
              <Bot size={18} />
            </div>
            <div className="bg-white border border-beige-100 p-5 rounded-3xl rounded-tl-none shadow-sm flex gap-1 items-center">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                className="w-1.5 h-1.5 bg-ink/30 rounded-full" 
              />
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                className="w-1.5 h-1.5 bg-ink/30 rounded-full" 
              />
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                className="w-1.5 h-1.5 bg-ink/30 rounded-full" 
              />
            </div>
          </motion.div>
        )}
      </div>

      <div className="pt-4 border-t border-beige-100">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2 bg-beige-50 p-1.5 rounded-full border border-transparent focus-within:ring-4 focus-within:ring-amber-500/10 transition-all"
        >
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share what's on your heart..."
            className="flex-grow pl-5 py-3 bg-transparent border-none text-base focus:ring-0 placeholder:text-ink/20 font-serif italic min-w-0"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="shrink-0 w-12 h-12 bg-ink text-beige-50 rounded-full hover:bg-ink/90 disabled:opacity-50 transition-all flex items-center justify-center shadow-lg"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
