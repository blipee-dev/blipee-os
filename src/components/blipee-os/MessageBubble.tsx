import { Message } from "@/types/conversation";
import {
  Building2,
  User,
  Sparkles,
  FileText,
  Image,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { sanitizeUserInput } from "@/lib/validation/sanitization";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [timeString, setTimeString] = useState("");

  useEffect(() => {
    setTimeString(message.timestamp.toLocaleTimeString());
  }, [message.timestamp]);

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return Image;
    if (
      type.includes("spreadsheet") ||
      type.includes("excel") ||
      type === "text/csv"
    )
      return FileSpreadsheet;
    return FileText;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar with gradient glow */}
      <div className="relative flex-shrink-0">
        <div
          className={`
          w-10 h-10 rounded-full flex items-center justify-center
          backdrop-blur-xl relative overflow-hidden
          before:absolute before:inset-0 before:rounded-full
          ${
            isUser
              ? "before:bg-gradient-to-br before:from-purple-500/20 before:to-pink-500/20 shadow-[0_0_20px_rgba(139,92,246,0.3)] dark:shadow-[0_0_20px_rgba(139,92,246,0.3)]"
              : "before:bg-gradient-to-br before:from-blue-500/20 before:to-cyan-500/20 shadow-[0_0_20px_rgba(14,165,233,0.3)] dark:shadow-[0_0_20px_rgba(14,165,233,0.3)]"
          }
        `}
        >
          <div className="relative z-10 flex items-center justify-center">
            {isUser ? (
              <User className="w-5 h-5 text-gray-700 dark:text-white/90" />
            ) : (
              <Building2 className="w-5 h-5 text-gray-700 dark:text-white/90" />
            )}
          </div>
        </div>
        {/* Removed animated ring to prevent constant blinking */}
      </div>

      <div className={`flex-1 max-w-[80%] ${isUser ? "text-right" : ""}`}>
        {/* Glass morphism message bubble */}
        <div
          className={`
          inline-block relative group
          ${isUser ? "" : "text-left"}
        `}
        >
          <div
            className={`
            relative px-4 py-3 rounded-2xl
            transition-all duration-300 ease-out
            
            ${
              isUser
                ? "bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 border border-purple-500/20 dark:border-purple-500/30"
                : "bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.1] hover:bg-gray-200 dark:hover:bg-white/[0.08]"
            }
          `}
          >
            {/* Gradient accent for user messages */}
            {isUser && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}

            {/* AI sparkle indicator */}
            {!isUser && (
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-blue-500/70 dark:text-blue-400/60" />
            )}

            <div
              className={`
              relative z-10
              ${isUser ? "text-gray-800 dark:text-white/95" : "text-gray-700 dark:text-white/90"}
            `}
            >
              <ReactMarkdown
                className="prose prose-sm max-w-none 
                  prose-p:mb-2 prose-p:last:mb-0
                  prose-strong:text-purple-600 dark:prose-strong:text-purple-400
                  prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:bg-purple-100 dark:prose-code:bg-white/10 prose-code:text-purple-700 dark:prose-code:text-purple-300
                  dark:prose-invert"
              >
                {sanitizeUserInput(message.content)}
              </ReactMarkdown>
            </div>

            {/* Attached files */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.attachments.map((file) => {
                  const Icon = getFileIcon(file.type);
                  return (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100/50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05]"
                    >
                      <Icon className="w-4 h-4 text-gray-600 dark:text-white/60" />
                      <span className="text-sm text-gray-700 dark:text-white/80 flex-1">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-white/40">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                      {file.url && (
                        <a
                          href={file.url}
                          download={file.name}
                          className="p-1 hover:bg-white/[0.05] rounded transition-colors"
                          title="Download file"
                        >
                          <Download className="w-3 h-3 text-gray-600 dark:text-white/60" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Timestamp with subtle animation */}
        {timeString && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs text-gray-500 dark:text-white/40 mt-2 font-light"
          >
            {timeString}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
