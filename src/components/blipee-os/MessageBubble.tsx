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
              ? "before:bg-gradient-to-br before:from-purple-500/20 before:to-pink-500/20 shadow-[0_0_20px_rgba(139,92,246,0.3)] light-mode:shadow-[0_0_16px_rgba(103,80,164,0.2)]"
              : "before:bg-gradient-to-br before:from-blue-500/20 before:to-cyan-500/20 shadow-[0_0_20px_rgba(14,165,233,0.3)] light-mode:shadow-[0_0_16px_rgba(0,128,255,0.2)]"
          }
        `}
        >
          <div className="relative z-10 flex items-center justify-center">
            {isUser ? (
              <User className="w-5 h-5 text-white/90 light-mode:text-gray-700" />
            ) : (
              <Building2 className="w-5 h-5 text-white/90 light-mode:text-gray-700" />
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
            backdrop-blur-xl bg-white/[0.02] 
            border border-white/[0.05]
            shadow-[0_8px_32px_rgba(0,0,0,0.12)]
            transition-all duration-300 ease-out
            hover:shadow-[0_8px_40px_rgba(0,0,0,0.2)]
            hover:border-white/[0.1]
            
            light-mode:bg-white/70
            light-mode:border-gray-200/50
            light-mode:shadow-[0_4px_16px_rgba(0,0,0,0.06)]
            light-mode:hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]
            light-mode:hover:border-gray-300/50
            
            ${
              isUser
                ? "bg-gradient-to-br from-purple-500/10 to-pink-500/10 light-mode:from-purple-500/5 light-mode:to-pink-500/5"
                : "hover:bg-white/[0.04] light-mode:hover:bg-white/80"
            }
          `}
          >
            {/* Gradient accent for user messages */}
            {isUser && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 light-mode:from-purple-500/10 light-mode:to-pink-500/10" />
            )}

            {/* AI sparkle indicator */}
            {!isUser && (
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-blue-400/60 light-mode:text-blue-500/70" />
            )}

            <p
              className={`
              relative z-10 whitespace-pre-wrap
              ${isUser ? "text-white/95 light-mode:text-gray-800" : "text-white/90 light-mode:text-gray-700"}
            `}
            >
              {message.content}
            </p>

            {/* Attached files */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.attachments.map((file) => {
                  const Icon = getFileIcon(file.type);
                  return (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] light-mode:bg-gray-100/50 light-mode:border-gray-200"
                    >
                      <Icon className="w-4 h-4 text-white/60 light-mode:text-gray-600" />
                      <span className="text-sm text-white/80 light-mode:text-gray-700 flex-1">
                        {file.name}
                      </span>
                      <span className="text-xs text-white/40 light-mode:text-gray-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                      {file.url && (
                        <a
                          href={file.url}
                          download={file.name}
                          className="p-1 hover:bg-white/[0.05] rounded transition-colors"
                          title="Download file"
                        >
                          <Download className="w-3 h-3 text-white/60 light-mode:text-gray-600" />
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
            className="text-xs text-white/40 light-mode:text-gray-500 mt-2 font-light"
          >
            {timeString}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
