import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Trash2, AlertTriangle } from 'lucide-react';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import { getConversation, saveConversation, generateId, deleteConversation, getSettings } from '../lib/storage';
import { chatWithOpenRouter, AGENT_SYSTEM_PROMPT, RESPONSE_SYSTEM_PROMPT } from '../lib/api';
import type { Message, Conversation } from '../types';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function ChatWindow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
          content: "Hello! I'm SocialFlow AI, your social media management assistant. I can help you create posts, schedule content, manage comments, reply to DMs, and more across your connected accounts. What would you like to do today?",
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

  const executeAction = async (action: string, platform: string, _content: string) => {
    const settings = getSettings();
    if (!settings?.zenrioApiKey) {
      throw new Error('Zenrio API key not configured. Please add it in Settings.');
    }

    // Map actions to API calls
    switch (action) {
      case 'create_post':
        // In production: await createPost(platform, content);
        return { success: true, message: `Post created successfully on ${platform}` };
      case 'schedule_post':
        return { success: true, message: `Post scheduled on ${platform}` };
      case 'publish_post':
        return { success: true, message: `Post published on ${platform}` };
      case 'get_comments':
        return { success: true, message: `Comments retrieved from ${platform}` };
      case 'reply_comment':
        return { success: true, message: `Reply sent on ${platform}` };
      case 'reply_dm':
        return { success: true, message: `DM sent on ${platform}` };
      case 'list_accounts':
        return { success: true, message: `Accounts fetched from Zenrio` };
      case 'connect_account':
        return { success: true, message: `Account connected on ${platform}` };
      case 'disconnect_account':
        return { success: true, message: `Account disconnected from ${platform}` };
      default:
        return { success: true, message: 'Action completed successfully' };
    }
  };

  const handleSend = async (text: string) => {
    if (!conversation || !id || loading) return;

    const settings = getSettings();
    if (!settings?.openRouterApiKey) {
      toast.error('Please configure your OpenRouter API key in Settings first.');
      navigate('/settings');
      return;
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...conversation.messages, userMessage];
    const updatedConv: Conversation = {
      ...conversation,
      messages: updatedMessages,
      title: conversation.messages.length <= 1 ? text.substring(0, 50) : conversation.title,
      updatedAt: Date.now(),
    };

    setConversation(updatedConv);
    saveConversation(updatedConv);
    setLoading(true);

    try {
      // Step 1: AI Agent analyzes the request
      const pendingMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        metadata: { status: 'pending', action: 'analyzing' },
      };

      const convWithPending = {
        ...updatedConv,
        messages: [...updatedMessages, pendingMsg],
      };
      setConversation(convWithPending);

      const agentResponse = await chatWithOpenRouter(
        [{ role: 'user', content: text }],
        AGENT_SYSTEM_PROMPT
      );

      // Parse agent's JSON response
      let agentAction: { action: string; platform?: string; content: string; metadata?: Record<string, unknown> };
      try {
        agentAction = JSON.parse(agentResponse);
      } catch {
        // If not JSON, treat as general chat
        agentAction = { action: 'general_chat', content: text };
      }

      // Step 2: Execute action if needed
      let actionResult = '';
      if (agentAction.action !== 'general_chat') {
        try {
          pendingMsg.metadata = { ...pendingMsg.metadata, action: agentAction.action };
          const result = await executeAction(
            agentAction.action,
            agentAction.platform || '',
            agentAction.content
          );
          actionResult = result.message;
          pendingMsg.metadata = {
            ...pendingMsg.metadata,
            status: 'completed',
            platform: agentAction.platform,
          };
        } catch (error: any) {
          actionResult = error.message;
          pendingMsg.metadata = { ...pendingMsg.metadata, status: 'failed' };
        }
      }

      // Step 3: Response AI generates user-friendly response
      const responsePrompt = agentAction.action === 'general_chat'
        ? `The user said: "${text}". Respond naturally and helpfully.`
        : `Action executed: ${agentAction.action} on ${agentAction.platform || 'social media'}. Result: ${actionResult}. Generate a friendly response explaining what happened.`;

      const finalResponse = await chatWithOpenRouter(
        [{ role: 'user', content: responsePrompt }],
        RESPONSE_SYSTEM_PROMPT
      );

      // Update the pending/analyzing message with the final response
      const finalMessages = convWithPending.messages.slice(0, -1);
      const aiMessage: Message = {
        id: pendingMsg.id,
        role: 'assistant',
        content: finalResponse,
        timestamp: Date.now(),
        metadata: agentAction.action !== 'general_chat'
          ? { status: 'completed', action: agentAction.action, platform: agentAction.platform }
          : undefined,
      };

      const finalConv: Conversation = {
        ...updatedConv,
        messages: [...finalMessages, aiMessage],
        updatedAt: Date.now(),
      };

      setConversation(finalConv);
      saveConversation(finalConv);
    } catch (error: any) {
      toast.error(error.message || 'Failed to get response from AI');
      // Add error message
      const errorMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: `I encountered an error: ${error.message}. Please check your API configuration in Settings.`,
        timestamp: Date.now(),
        metadata: { status: 'failed' },
      };
      const finalConv = {
        ...updatedConv,
        messages: [...updatedMessages, errorMsg],
        updatedAt: Date.now(),
      };
      setConversation(finalConv);
      saveConversation(finalConv);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  };

  const handleDelete = () => {
    if (id) {
      deleteConversation(id);
      toast.success('Conversation deleted');
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
          {!getSettings()?.openRouterApiKey && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/settings')}
              className="text-warning hover:text-warning"
            >
              <AlertTriangle size={14} />
              <span className="text-xs hidden md:inline">Configure API</span>
            </Button>
          )}
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

          {/* Loading indicator with real-time status */}
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
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-muted-foreground">AI is thinking...</span>
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
        onStop={handleStop}
        loading={loading}
        disabled={!getSettings()?.openRouterApiKey}
        placeholder={getSettings()?.openRouterApiKey ? "Ask SocialFlow AI to manage your social media..." : "Configure API key in Settings to start chatting..."}
      />
    </div>
  );
}