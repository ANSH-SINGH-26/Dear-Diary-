import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, X, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

interface WritingInterfaceProps {
  onSave: (content: string, title?: string, imageUrl?: string) => Promise<void>;
  isSaving: boolean;
  aiResponse?: string | null;
  onClose?: () => void;
  initialContent?: string;
  initialTitle?: string;
  initialImage?: string | null;
}

export default function WritingInterface({ onSave, isSaving, aiResponse, onClose, initialContent = '', initialTitle = '', initialImage = null }: WritingInterfaceProps) {
  const [content, setContent] = useState(initialContent || '');
  const [title, setTitle] = useState(initialTitle || '');
  const [image, setImage] = useState<string | null>(initialImage || null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image is too large. Please select an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (content?.trim()) {
      onSave(content, title?.trim() || undefined, image || undefined);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="max-w-3xl mx-auto w-full p-6 text-ink"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl italic">Dear Diary,</h2>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-beige-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="space-y-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your entry a title..."
          className="w-full bg-transparent border-none focus:ring-0 text-3xl font-serif italic mb-2 placeholder:text-beige-300 px-0"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="How was your day? Tell me everything..."
          className="w-full h-64 md:h-80 bg-transparent border-none focus:ring-0 text-base md:text-lg leading-relaxed placeholder:text-beige-300 resize-none font-serif px-0"
        />

        <AnimatePresence>
          {image && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden group shadow-md"
            >
              <img src={image} alt="Upload preview" className="w-full max-h-[300px] md:max-h-96 object-cover" />
              <button 
                onClick={() => setImage(null)}
                className="absolute top-2 right-2 md:top-4 md:right-4 p-2 bg-red-500 text-white rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-beige-200/50">
          <label className="flex items-center justify-center gap-2 px-6 py-3 sm:px-4 sm:py-2 rounded-full bg-beige-200 text-ink/60 text-sm font-medium hover:bg-beige-300 transition-all cursor-pointer w-full sm:w-auto">
            <ImageIcon size={18} />
            <span>{image ? 'Change Photo' : 'Add Photo'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={isSaving || !content?.trim()}
            className={cn(
              "flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-ink text-beige-50 font-medium transition-all shadow-lg w-full sm:w-auto",
              (isSaving || !content?.trim()) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>{initialContent ? 'Update Entry' : 'Save Reflection'}</span>
                <Send size={18} />
              </>
            )}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {aiResponse && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-12 p-8 glass rounded-3xl"
          >
            <div className="flex items-center gap-2 mb-4 text-ink/60 font-medium uppercase text-xs tracking-widest">
              <Sparkles size={14} className="text-amber-500" />
              <span>AI Companion Reflection</span>
            </div>
            <div className="prose prose-stone font-serif text-lg leading-relaxed text-ink/80 italic">
              <ReactMarkdown>{aiResponse}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
