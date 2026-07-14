import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, Trash2, AlertTriangle } from "lucide-react";
import ChatMessage from "../components/chat/ChatMessage";
import ChatInput from "../components/chat/ChatInput";
import {
  getConversation,
  saveConversation,
  generateId,
  deleteConversation,
  getSettings,
  getAccounts,
} from "../lib/storage";
import {
  chatWithOpenRouter,
  AGENT_SYSTEM_PROMPT,
  RESPONSE_SYSTEM_PROMPT,
  fetchZenrioAccounts,
  connectZenrioAccount,
  disconnectZenrioAccount,
  createPost,
  listPosts,
  getPost,
  editPost,
  deletePost,
  schedulePost,
  publishPost,
  unpublishPost,
  retryPost,
  getComments,
  replyToComment,
  hideComment,
  likeComment,
  deleteComment,
  listConversations,
  getConversationMessages,
  replyToDM,
  getAccountHealth,
  getAccountFollowerStats,
  getPostAnalytics,
  getDailyAnalytics,
  getBestPostingTime,
  uploadMedia,
  listQueueSlots,
  createQueueSlot,
} from "../lib/api";
import type { Message, Conversation } from "../types";
import Button from "../components/ui/Button";
import toast from "react-hot-toast";
import { retrieveMemoryContext, storeMemory } from "../lib/memory";

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
          title: "New Chat",
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        const welcomeMsg: Message = {
          id: generateId(),
          role: "assistant",
          content:
            "Hello! I'm SocialFlow AI, your social media management assistant. I can help you create posts, schedule content, manage comments, reply to DMs, and more across your connected accounts. What would you like to do today?",
          timestamp: Date.now(),
        };
        newConv.messages.push(welcomeMsg);
        saveConversation(newConv);
        setConversation(newConv);
      }
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const executeAction = async (
    action: string,
    platform: string,
    content: string,
    metadata: Record<string, unknown> = {},
  ) => {
    const settings = getSettings();
    if (!settings?.zenrioApiKey) {
      throw new Error(
        "Zernio API key not configured. Please add it in Settings.",
      );
    }

    switch (action) {
      // ── Accounts ──
      case "list_accounts": {
        const result = await fetchZenrioAccounts();
        let list = Array.isArray(result)
          ? result
          : result?.accounts || result?.data || [];
        let note = "";
        if (list.length === 0) {
          // Fall back to local accounts (e.g. demo mode)
          const localAccounts = getAccounts();
          if (localAccounts.length > 0) {
            list = localAccounts;
            note =
              "\n(Note: These are local/demo accounts — not connected to Zernio. Real posting requires a Zernio API key.)";
          }
        }
        const summary = list
          .map((a: any) => `  • ${a.platform}: @${a.username || a._id}`)
          .join("\n");
        return {
          success: true,
          message: `Connected accounts (${list.length}):\n${summary}${note}`,
        };
      }
      case "connect_account": {
        const result = await connectZenrioAccount(platform);
        const authUrl = result.authUrl || result.auth_url;
        if (authUrl) {
          window.open(authUrl, "_blank", "width=600,height=700");
          return {
            success: true,
            message: `OAuth window opened for ${platform}. Authorize and then use "list accounts" to see it.`,
          };
        }
        return { success: true, message: `${platform} account connected.` };
      }
      case "disconnect_account": {
        const accountId = (metadata.accountId as string) || platform;
        await disconnectZenrioAccount(accountId);
        return { success: true, message: `Account ${accountId} disconnected.` };
      }
      case "account_health": {
        const result = await getAccountHealth();
        return {
          success: true,
          message: `Account health: ${JSON.stringify(result)}`,
        };
      }
      case "follower_stats": {
        const result = await getAccountFollowerStats();
        return {
          success: true,
          message: `Follower stats: ${JSON.stringify(result)}`,
        };
      }

      // ── Posts ──
      case "create_post": {
        const mediaUrls = metadata.mediaUrls as string[] | undefined;
        const accountId = metadata.accountId as string | undefined;
        const result = await createPost(
          platform,
          content,
          mediaUrls,
          accountId,
        );
        const postStatus =
          result?.post?.status || result?.status || "published";
        const postId = result?.post?._id || result?._id || "";
        return {
          success: true,
          message: `Post created on ${platform} [status: ${postStatus}]${postId ? ` (id: ${postId})` : ""}.\nNote: If this is a new platform connection, ensure you authorized the correct LinkedIn page/profile in the OAuth window.`,
        };
      }
      case "schedule_post": {
        const scheduledAt = metadata.scheduledAt as string;
        const mediaUrls = metadata.mediaUrls as string[] | undefined;
        const accountId = metadata.accountId as string | undefined;
        if (!scheduledAt)
          throw new Error("scheduledAt (ISO datetime) is required in metadata");
        const result = await schedulePost(
          platform,
          content,
          scheduledAt,
          mediaUrls,
          accountId,
        );
        const postId = result?.post?._id || result?._id || "";
        return {
          success: true,
          message: `Post scheduled on ${platform} for ${scheduledAt}.${postId ? ` (id: ${postId})` : ""}`,
        };
      }
      case "list_posts": {
        const result = await listPosts(
          (metadata.platform as string) || platform || undefined,
          (metadata.status as string) || undefined,
          (metadata.accountId as string) || undefined,
        );
        const list = Array.isArray(result)
          ? result
          : result?.posts || result?.data || [];
        if (list.length === 0) {
          const platformHint = (metadata.platform as string) || platform;
          const note = platformHint
            ? ` Note: Zernio only shows posts created through SocialFlow AI, not native posts on ${platformHint}.`
            : "";
          return { success: true, message: `No posts found.${note}` };
        }
        const summary = list
          .map(
            (p: any) =>
              `  • ${p._id || p.id}: "${(p.content || "").substring(0, 60)}" [${p.status || "unknown"}]`,
          )
          .join("\n");
        return {
          success: true,
          message: `Posts (${list.length}):\n${summary}`,
        };
      }
      case "get_post": {
        const postId = (metadata.postId as string) || content;
        if (!postId) throw new Error("postId is required in metadata");
        const result = await getPost(postId);
        return {
          success: true,
          message: `Post details: ${JSON.stringify(result, null, 2)}`,
        };
      }
      case "edit_post": {
        const postId = metadata.postId as string;
        if (!postId) throw new Error("postId is required in metadata");
        await editPost(
          postId,
          content,
          (metadata.overrides as Record<string, unknown>) || {},
        );
        return { success: true, message: `Post ${postId} edited.` };
      }
      case "delete_post": {
        const postId = (metadata.postId as string) || content;
        if (!postId) throw new Error("postId is required in metadata");
        await deletePost(postId);
        return { success: true, message: `Post ${postId} deleted.` };
      }
      case "publish_post": {
        const postId = (metadata.postId as string) || content;
        if (!postId) throw new Error("postId is required in metadata");
        await publishPost(postId);
        return { success: true, message: `Post ${postId} published.` };
      }
      case "unpublish_post": {
        const postId = (metadata.postId as string) || content;
        if (!postId) throw new Error("postId is required in metadata");
        await unpublishPost(postId);
        return { success: true, message: `Post ${postId} unpublished.` };
      }
      case "retry_post": {
        const postId = (metadata.postId as string) || content;
        if (!postId) throw new Error("postId is required in metadata");
        await retryPost(postId);
        return { success: true, message: `Retrying post ${postId}.` };
      }

      // ── Comments ──
      case "get_comments": {
        const postId = metadata.postId as string;
        if (!postId) throw new Error("postId is required in metadata");
        const result = await getComments(platform, postId);
        return {
          success: true,
          message: `Comments: ${JSON.stringify(result)}`,
        };
      }
      case "reply_comment": {
        const commentId = metadata.commentId as string;
        if (!commentId) throw new Error("commentId is required in metadata");
        await replyToComment(commentId, content);
        return {
          success: true,
          message: `Reply sent to comment ${commentId}.`,
        };
      }
      case "hide_comment": {
        const postId = metadata.postId as string;
        const commentId = metadata.commentId as string;
        if (!postId || !commentId)
          throw new Error("postId and commentId required in metadata");
        await hideComment(postId, commentId);
        return { success: true, message: `Comment ${commentId} hidden.` };
      }
      case "like_comment": {
        const postId = metadata.postId as string;
        const commentId = metadata.commentId as string;
        if (!postId || !commentId)
          throw new Error("postId and commentId required in metadata");
        await likeComment(postId, commentId);
        return { success: true, message: `Comment ${commentId} liked.` };
      }
      case "delete_comment": {
        const postId = metadata.postId as string;
        const commentId = metadata.commentId as string;
        if (!postId || !commentId)
          throw new Error("postId and commentId required in metadata");
        await deleteComment(postId, commentId);
        return { success: true, message: `Comment ${commentId} deleted.` };
      }

      // ── DMs ──
      case "list_conversations": {
        const result = await listConversations(platform || undefined);
        const convList = Array.isArray(result)
          ? result
          : result?.conversations || result?.data || [];
        if (convList.length === 0) {
          const note = platform
            ? ` No conversations found on ${platform}. Note: Instagram DMs require Facebook Graph API permissions (Page inbox), and other platforms may not expose DMs via Zernio.`
            : " No conversations found.";
          return { success: true, message: note.trim() };
        }
        const summary = convList
          .map(
            (c: any) =>
              `  • ${c._id || c.id}: "${(c.subject || c.lastMessage?.text || "(no subject)").substring(0, 60)}"`,
          )
          .join("\n");
        return {
          success: true,
          message: `Conversations (${convList.length}):\n${summary}`,
        };
      }
      case "get_conversation": {
        const conversationId = metadata.conversationId as string;
        if (!conversationId)
          throw new Error("conversationId is required in metadata");
        const result = await getConversationMessages(conversationId);
        return {
          success: true,
          message: `Messages: ${JSON.stringify(result)}`,
        };
      }
      case "reply_dm": {
        const conversationId = metadata.conversationId as string;
        if (!conversationId)
          throw new Error("conversationId is required in metadata");
        await replyToDM(conversationId, content);
        return {
          success: true,
          message: `DM sent in conversation ${conversationId}.`,
        };
      }

      // ── Analytics ──
      case "get_analytics": {
        const result = await getPostAnalytics(platform || undefined);
        return {
          success: true,
          message: `Analytics: ${JSON.stringify(result)}`,
        };
      }
      case "daily_analytics": {
        const result = await getDailyAnalytics(platform || undefined);
        return {
          success: true,
          message: `Daily analytics: ${JSON.stringify(result)}`,
        };
      }
      case "best_time": {
        const result = await getBestPostingTime(platform || undefined);
        return {
          success: true,
          message: `Best posting times: ${JSON.stringify(result)}`,
        };
      }

      // ── Media ──
      case "upload_media": {
        if (!content) throw new Error("Media URL is required in content");
        await uploadMedia(content);
        return { success: true, message: `Media uploaded from ${content}.` };
      }

      // ── Queue ──
      case "list_queue": {
        const result = await listQueueSlots();
        return {
          success: true,
          message: `Queue slots: ${JSON.stringify(result)}`,
        };
      }
      case "create_queue_slot": {
        await createQueueSlot(metadata as Record<string, unknown>);
        return { success: true, message: "Queue slot created." };
      }

      default:
        return { success: true, message: `Action "${action}" completed.` };
    }
  };

  const handleSend = async (text: string) => {
    if (!conversation || !id || loading) return;

    const settings = getSettings();
    if (!settings?.openRouterApiKey) {
      toast.error(
        "Please configure your OpenRouter API key in Settings first.",
      );
      navigate("/settings");
      return;
    }

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...conversation.messages, userMessage];
    const updatedConv: Conversation = {
      ...conversation,
      messages: updatedMessages,
      title:
        conversation.messages.length <= 1
          ? text.substring(0, 50)
          : conversation.title,
      updatedAt: Date.now(),
    };

    setConversation(updatedConv);
    saveConversation(updatedConv);
    setLoading(true);

    try {
      // Step 1: AI Agent analyzes the request
      const pendingMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        metadata: { status: "pending", action: "analyzing" },
      };

      const convWithPending = {
        ...updatedConv,
        messages: [...updatedMessages, pendingMsg],
      };
      setConversation(convWithPending);

      const memoryContext = await retrieveMemoryContext(id, text);
      const enrichedSystemPrompt = memoryContext
        ? `${AGENT_SYSTEM_PROMPT}\n\nRelevant conversation history:\n${memoryContext}`
        : AGENT_SYSTEM_PROMPT;

      const agentResponse = await chatWithOpenRouter(
        [{ role: "user", content: text }],
        enrichedSystemPrompt,
      );

      // Parse agent's JSON response
      let agentAction: {
        action: string;
        platform?: string;
        content: string;
        metadata?: Record<string, unknown>;
      };
      try {
        agentAction = JSON.parse(agentResponse);
      } catch {
        // If not JSON, treat as general chat
        agentAction = { action: "general_chat", content: text };
      }

      // Step 2: Execute action if needed
      let actionResult = "";
      if (agentAction.action !== "general_chat") {
        try {
          pendingMsg.metadata = {
            ...pendingMsg.metadata,
            action: agentAction.action,
          };
          const result = await executeAction(
            agentAction.action,
            agentAction.platform || "",
            agentAction.content,
            agentAction.metadata || {},
          );
          actionResult = result.message;
          pendingMsg.metadata = {
            ...pendingMsg.metadata,
            status: "completed",
            platform: agentAction.platform,
          };
        } catch (error: any) {
          actionResult = error.message;
          pendingMsg.metadata = { ...pendingMsg.metadata, status: "failed" };
        }
      }

      // Step 3: Response AI generates user-friendly response
      const actionStatus = pendingMsg.metadata?.status || "completed";
      const responsePrompt =
        agentAction.action === "general_chat"
          ? `The user said: "${text}". Respond naturally and helpfully.`
          : `Action: ${agentAction.action} on ${agentAction.platform || "social media"}.\nStatus: ${actionStatus}\nResult: ${actionResult}\n\nGenerate a friendly response explaining what happened. If the action failed, suggest what the user can do to fix it (e.g., connecting the account first, configuring the API key, etc.).`;

      const finalResponse = await chatWithOpenRouter(
        [{ role: "user", content: responsePrompt }],
        RESPONSE_SYSTEM_PROMPT,
      );

      // Update the pending/analyzing message with the final response
      const finalMessages = convWithPending.messages.slice(0, -1);
      const aiMessage: Message = {
        id: pendingMsg.id,
        role: "assistant",
        content: finalResponse,
        timestamp: Date.now(),
        metadata:
          agentAction.action !== "general_chat"
            ? {
                status: "completed",
                action: agentAction.action,
                platform: agentAction.platform,
              }
            : undefined,
      };

      const finalConv: Conversation = {
        ...updatedConv,
        messages: [...finalMessages, aiMessage],
        updatedAt: Date.now(),
      };

      storeMemory(id, text, finalResponse, agentAction.action);
      setConversation(finalConv);
      saveConversation(finalConv);
    } catch (error: any) {
      toast.error(error.message || "Failed to get response from AI");
      // Add error message
      const errorMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: `I encountered an error: ${error.message}. Please check your API configuration in Settings.`,
        timestamp: Date.now(),
        metadata: { status: "failed" },
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
      toast.success("Conversation deleted");
      navigate("/chat");
    }
  };

  if (!conversation) return null;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/chat")}>
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
              onClick={() => navigate("/settings")}
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

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        loading={loading}
        disabled={!getSettings()?.openRouterApiKey}
        placeholder={
          getSettings()?.openRouterApiKey
            ? "Ask SocialFlow AI to manage your social media..."
            : "Configure API key in Settings to start chatting..."
        }
      />
    </div>
  );
}
