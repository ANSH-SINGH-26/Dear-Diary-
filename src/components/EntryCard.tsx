import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Tag, MessageCircle } from 'lucide-react';
import { DiaryEntry } from '../types';
import { formatDate, cn } from '../lib/utils';

interface EntryCardProps {
  entry: DiaryEntry;
  onClick: () => void;
  index?: number;
}

export default function EntryCard({ entry, onClick, index = 0 }: EntryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group cursor-pointer p-6 bg-white rounded-3xl soft-shadow transition-all hover:shadow-xl border border-transparent hover:border-beige-200"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2 text-ink/50 text-sm">
          <Calendar size={14} />
          <span>{formatDate(entry.createdAt)}</span>
        </div>
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: entry.moodColor || '#F5F5DC' }}
          title={`Mood: ${entry.mood}`}
        />
      </div>

      {entry.imageUrl && (
        <div className="w-full h-32 mb-4 rounded-2xl overflow-hidden">
          <img src={entry.imageUrl} alt="Entry" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}

      <h3 className="text-xl font-serif mb-2 line-clamp-2 leading-snug">
        {entry.title || entry.content.split('\n')[0]}
      </h3>
      
      <p className="text-ink/60 line-clamp-3 mb-6 text-sm flex-grow leading-relaxed">
        {entry.title ? entry.content : (entry.content.split('\n').slice(1).join('\n') || entry.content)}
      </p>

      <div className="flex flex-wrap gap-2 mt-auto">
        {entry.suggestedTag && (
          <span className="flex items-center gap-1 px-3 py-1 bg-beige-100 text-ink/70 text-xs rounded-full font-medium">
            <Tag size={10} />
            {entry.suggestedTag}
          </span>
        )}
        {entry.aiResponse && (
          <span className="flex items-center gap-1 px-3 py-1 bg-ink/5 text-ink/50 text-xs rounded-full font-medium italic">
            <MessageCircle size={10} />
            Reflection added
          </span>
        )}
      </div>
    </motion.div>
  );
}
