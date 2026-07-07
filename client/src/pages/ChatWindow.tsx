import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Trash2 } from 'lucide-react';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import { getConversation, saveConversation, generateId, deleteConversation } from '../lib/storage';
import type { Message, Conversation } from '../types';
import Button from '../components/ui/Button';

export default function ChatWindow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (id) {
      const existing = getConversation(id);
      if (existing) {
        setConversation(existing);
      } else {
        const newConv: Conversation = {
          id,
          title: 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        const welcomeMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: "Hello! I'm SocialFlow AI, your social media management assistant. I can help you create posts, schedule content, manage comments, and more across your connected accounts. What would you like to do today?",
          timestamp: Date.now(),
        };
        newConv.messages.push(welcomeMsg);
        saveConversation(newConv);
        setConversation(newConv);
      }
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleSend = async (content: string) => {
    if (!conversation || !id) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const updatedMessages = [...conversation.messages, userMessage];
    const updatedConv: Conversation = {
      ...conversation,
      messages: updatedMessages,
      title: conversation.messages.length <= 1 ? content.substring(0, 50) : conversation.title,
      updatedAt: Date.now(),
    };

    setConversation(updatedConv);
    saveConversation(updatedConv);
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: "I've processed your request. In the full implementation, this would execute the appropriate action through Zenrio's API. For now, this is the UI prototype of SocialFlow AI.",
        timestamp: Date.now(),
        metadata: {
          status: 'completed',
          action: 'analyze_request',
        },
      };

      const finalConv = {
        ...updatedConv,
        messages: [...updatedMessages, aiMessage],
        updatedAt: Date.now(),
      };
      setConversation(finalConv);
      saveConversation(finalConv);
      setLoading(false);
    }, 1500);
  };

  const handleDelete = () => {
    if (id) {
      deleteConversation(id);
      navigate('/chat');
    }
  };

  if (!conversation) return null;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/chat')}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-sm font-medium truncate max-w-[200px] md:max-w-md">
              {conversation.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              {conversation.messages.length} messages
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 size={16} className="text-muted-foreground" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          <AnimatePresence>
            {conversation.messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <Sparkles size={14} className="text-accent" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        loading={loading}
        disabled={false}
      />
    </div>
  );
}