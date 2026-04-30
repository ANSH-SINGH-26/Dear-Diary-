import React from 'react';
import { motion } from 'motion/react';
import { DiaryEntry } from '../types';
import { formatDate } from '../lib/utils';
import EntryCard from './EntryCard';

interface TimelineProps {
  entries: DiaryEntry[];
  onSelectEntry: (entry: DiaryEntry) => void;
}

export default function Timeline({ entries, onSelectEntry }: TimelineProps) {
  // Group entries by month/year
  const groupedEntries = entries.reduce((acc: { [key: string]: DiaryEntry[] }, entry) => {
    if (!entry.createdAt) return acc;
    let date: Date;
    if (entry.createdAt.toDate) {
      date = entry.createdAt.toDate();
    } else if (entry.createdAt.seconds) {
      date = new Date(entry.createdAt.seconds * 1000);
    } else if (entry.createdAt instanceof Date) {
      date = entry.createdAt;
    } else {
      date = new Date(entry.createdAt);
    }
    
    if (isNaN(date.getTime())) return acc;
    
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(entry);
    return acc;
  }, {} as { [key: string]: DiaryEntry[] });

  const sortedMonths = Object.keys(groupedEntries).sort((a, b) => {
    // a and b are strings like "April 2026". 
    // We can parse them by adding a day "1 " to make them more standard for parsing.
    const dateA = new Date(`1 ${a}`);
    const dateB = new Date(`1 ${b}`);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-12">
      {sortedMonths.map((month) => (
        <section key={month}>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-serif">{month}</h2>
            <div className="h-px bg-beige-300 flex-grow" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedEntries[month]
              .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
              .map((entry) => (
                <EntryCard 
                  key={entry.id} 
                  entry={entry} 
                  onClick={() => onSelectEntry(entry)} 
                />
              ))}
          </div>
        </section>
      ))}

      {entries.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl soft-shadow border border-dashed border-beige-300">
          <p className="text-ink/40 font-serif italic text-lg">Your story begins here...</p>
        </div>
      )}
    </div>
  );
}
