import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, StopCircle } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, onStop, loading, disabled, placeholder }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || loading || disabled) return;
    onSend(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="relative flex items-end gap-2 bg-card border border-border rounded-2xl px-4 py-2 focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/25 transition-all duration-200">
          <div className="flex-shrink-0 self-center">
            <Sparkles size={16} className="text-accent" />
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Ask SocialFlow AI to manage your social media..."}
            rows={1}
            disabled={disabled}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none py-1.5 max-h-[200px] disabled:opacity-50"
          />
          <div className="flex items-center gap-1 self-center">
            {loading ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onStop}
                className="p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                title="Stop generating"
              >
                <StopCircle size={18} />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={!input.trim() || disabled}
                className="p-2 rounded-lg text-accent hover:bg-accent-soft transition-colors disabled:opacity-30 disabled:pointer-events-none"
                title="Send message"
              >
                <Send size={18} />
              </motion.button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-center text-muted-foreground/50 mt-2">
          SocialFlow AI may produce inaccurate information. Verify important actions.
        </p>
      </div>
    </div>
  );
}