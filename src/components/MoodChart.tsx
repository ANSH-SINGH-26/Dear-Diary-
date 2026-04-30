import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DiaryEntry } from '../types';
import { formatDate } from '../lib/utils';

interface MoodChartProps {
  entries: DiaryEntry[];
}

export default function MoodChart({ entries }: MoodChartProps) {
  const sortedEntries = entries
    .filter(e => e.createdAt)
    .sort((a, b) => {
      const getTime = (ca: any) => {
        if (ca.toDate) return ca.toDate().getTime();
        if (ca.seconds) return ca.seconds * 1000;
        if (ca instanceof Date) return ca.getTime();
        return new Date(ca).getTime();
      };
      return getTime(a.createdAt) - getTime(b.createdAt);
    }).slice(-7); // Last 7 entries

  const data = sortedEntries.map(entry => ({
    date: formatDate(entry.createdAt).split(',')[0],
    intensity: entry.moodIntensity,
    mood: entry.mood,
    color: entry.moodColor
  }));

  const MoodTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      return (
        <div className="bg-white p-3 soft-shadow rounded-xl border border-beige-100 text-xs">
          <p className="font-semibold mb-1">{entry.date}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="capitalize">{entry.mood} (Intensity: {entry.intensity}/10)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1F1F1F" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#1F1F1F" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#1F1F1F', opacity: 0.5 }}
          />
          <YAxis 
            hide
            domain={[0, 10]}
          />
          <Tooltip content={<MoodTooltip />} />
          <Area 
            type="monotone" 
            dataKey="intensity" 
            stroke="#1F1F1F" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorMood)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
