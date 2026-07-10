import { motion } from "framer-motion";
import { User, Sparkles, Check, Loader2, AlertCircle } from "lucide-react";
import type { Message } from "../../types";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} ${isSystem ? "opacity-60" : ""}`}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center mt-0.5">
          <Sparkles size={14} className="text-accent" />
        </div>
      )}

      <div className={`max-w-[75%] ${isUser ? "order-1" : "order-1"}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-accent text-white rounded-br-md"
              : "bg-card border border-border rounded-bl-md"
          } ${isSystem ? "bg-muted/50 italic" : ""}`}
        >
          {message.content ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : message.metadata?.status === "pending" ? (
            <div className="flex items-center gap-1.5 py-0.5">
              <span
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          ) : null}
        </div>

        {/* Metadata */}
        {message.metadata && !isUser && (
          <div className="flex items-center gap-2 mt-1.5 px-1">
            {/* {message.metadata.status === "pending" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 size={10} className="animate-spin" />
                Processing...
              </span>
            )} */}
            {message.metadata.status === "completed" && (
              <span className="flex items-center gap-1 text-xs text-success">
                <Check size={10} />
                {message.metadata.action &&
                  `Action: ${message.metadata.action}`}
              </span>
            )}
            {message.metadata.status === "failed" && (
              <span className="flex items-center gap-1 text-xs text-danger">
                <AlertCircle size={10} />
                Action failed
              </span>
            )}
            {message.metadata.platform && (
              <span className="text-xs text-muted-foreground capitalize">
                via {message.metadata.platform}
              </span>
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center mt-0.5">
          <User size={14} className="text-muted-foreground" />
        </div>
      )}
    </motion.div>
  );
}
