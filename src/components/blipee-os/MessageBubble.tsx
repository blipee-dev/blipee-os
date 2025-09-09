import { Message } from "@/types/conversation";
import {
  User,
  Home,
  Sparkles,
  FileText,
  Image,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
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
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`group ${isUser ? "bg-transparent" : "bg-gray-50 dark:bg-[#212121]"}`}
    >
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
          {/* Avatar - Clean and simple */}
          <div className="flex-shrink-0">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center
                ${
                  isUser
                    ? "bg-gray-900 dark:bg-white"
                    : "bg-gradient-to-br from-purple-500 to-pink-500"
                }
              `}
            >
              {isUser ? (
                <User className="w-5 h-5 text-white dark:text-gray-900" />
              ) : (
                <Home className="w-5 h-5 text-white" />
              )}
            </div>
          </div>

          {/* Message content */}
          <div className="flex-1 overflow-hidden">
            <div className={`prose prose-sm max-w-none ${
              isUser 
                ? "bg-gray-100 dark:bg-[#616161] rounded-2xl px-4 py-3 max-w-[80%] ml-auto" 
                : ""
            }`}>
              <ReactMarkdown
                className="text-gray-900 dark:text-gray-100 leading-relaxed
                  [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                  prose-p:my-3
                  prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3
                  prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                  prose-strong:font-semibold prose-strong:text-gray-900 dark:prose-strong:text-white
                  prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:bg-gray-100 dark:prose-code:bg-gray-800 
                  prose-code:text-gray-800 dark:prose-code:text-gray-200 prose-code:font-mono prose-code:text-sm
                  prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:text-gray-100
                  prose-ul:my-3 prose-ol:my-3 prose-li:my-1
                  prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600
                  prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300
                  prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:underline prose-a:font-normal
                  prose-hr:border-gray-200 dark:prose-hr:border-gray-700"
              >
                {sanitizeUserInput(message.content)}
              </ReactMarkdown>
            </div>

            {/* Attached files - Clean cards */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.attachments.map((file) => {
                  const Icon = getFileIcon(file.type);
                  return (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 
                        bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      {file.url && (
                        <a
                          href={file.url}
                          download={file.name}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Download file"
                        >
                          <Download className="w-3.5 h-3.5 text-gray-500" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Copy button for assistant messages */}
            {!isUser && (
              <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 
                    dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}