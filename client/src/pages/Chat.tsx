import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, Sparkles, Trash2, Clock } from 'lucide-react';
import { getConversations, deleteConversation, generateId, formatRelativeTime, truncate } from '../lib/storage';
import type { Conversation } from '../types';
import Button from '../components/ui/Button';

export default function Chat() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    setConversations(getConversations());
  }, []);

  const handleNewChat = () => {
    const id = generateId();
    navigate(`/chat/${id}`);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConversation(id);
    setConversations(getConversations());
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Chats</h1>
          <p className="text-sm text-muted-foreground mt-1">Your conversations with SocialFlow AI</p>
        </div>
        <Button onClick={handleNewChat} icon={<Plus size={16} />}>
          New Chat
        </Button>
      </div>

      {conversations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={28} className="text-accent" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No conversations yet</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Start a new chat and SocialFlow AI will help you manage your social media accounts.
          </p>
          <Button onClick={handleNewChat} icon={<Sparkles size={16} />}>
            Start a Conversation
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-3">
          {conversations.map((conv, i) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => navigate(`/chat/${conv.id}`)}
              className="group flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-card-hover hover:border-border/80 cursor-pointer transition-all duration-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={18} className="text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {truncate(conv.title || 'New Chat', 40)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock size={12} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(conv.updatedAt)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      &middot; {conv.messages.length} messages
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}