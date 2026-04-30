export type Sentiment = 'happy' | 'sad' | 'anxious' | 'angry' | 'neutral';

export interface DiaryEntry {
  id: string;
  userId: string;
  title?: string;
  content: string;
  mood: Sentiment;
  moodIntensity: number;
  tags: string[];
  suggestedTag?: string;
  aiResponse?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
  moodColor: string;
  imageUrl?: string;
  distressLevel?: 'low' | 'medium' | 'high';
}

export interface AIAnalysis {
  sentiment: Sentiment;
  intensity: number;
  response: string;
  suggestedTag: string;
  moodColor: string;
  distressLevel?: 'low' | 'medium' | 'high';
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  streak: number;
  lastEntryDate?: string;
}
