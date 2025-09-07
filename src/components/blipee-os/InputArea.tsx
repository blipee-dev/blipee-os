"use client";

import { useState, KeyboardEvent, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Sparkles,
  Paperclip,
  X,
  FileText,
  Image,
  FileSpreadsheet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceInput } from "@/components/voice/VoiceInput";

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string, files?: AttachedFile[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function InputArea({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "Type your message...",
}: InputAreaProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((value.trim() || attachedFiles.length > 0) && !disabled) {
      onSend(value, attachedFiles.length > 0 ? attachedFiles : undefined);
      setAttachedFiles([]); // Clear files after sending
    }
  };

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const newFiles: AttachedFile[] = files.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      }));
      setAttachedFiles((prev) => [...prev, ...newFiles]);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [],
  );

  const removeFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
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

  const handleVoiceTranscript = (transcript: string) => {
    onChange(transcript);
    // Auto-send after voice input
    if (transcript.trim()) {
      setTimeout(() => onSend(transcript), 100);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [value]);

  return (
    <div className="relative border-t border-gray-200 dark:border-white/[0.05] bg-gradient-to-t from-white/50 to-transparent dark:from-black/50 dark:to-transparent backdrop-blur-xl">
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent dark:via-purple-500/50" />

      <div className="p-3 sm:p-4">
        {/* Attached files display */}
        <AnimatePresence>
          {attachedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto mb-3 flex flex-wrap gap-2"
            >
              {attachedFiles.map((file) => {
                const Icon = getFileIcon(file.type);
                return (
                  <motion.div
                    key={file.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100/50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05]"
                  >
                    <Icon className="w-4 h-4 text-gray-600 dark:text-white/60" />
                    <span className="text-sm text-gray-700 dark:text-white/80">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-white/40">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="ml-1 p-1 hover:bg-white/[0.05] rounded transition-colors"
                    >
                      <X className="w-3 h-3 text-gray-600 dark:text-white/60" />
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2 sm:gap-3 max-w-4xl mx-auto">
          {/* Voice input button */}
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            disabled={disabled || false}
          />

          {/* File attachment button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="p-2 sm:p-3 rounded-xl bg-gray-100/50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.05] hover:border-gray-300 dark:hover:border-white/[0.1] transition-all duration-300"
            title="Attach files"
          >
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-white/60" />
          </motion.button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Input area with premium glass design */}
          <div
            className={`
            flex-1 relative group transition-all duration-300
            ${isFocused ? "scale-[1.01]" : ""}
          `}
          >
            {/* Gradient glow effect on focus */}
            <div
              className={`
              absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20
              opacity-0 blur-xl transition-opacity duration-500
              ${isFocused ? "opacity-100" : ""}
            `}
            />

            <div
              className={`
              relative rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-white/[0.02]
              border transition-all duration-300
              ${
                isFocused
                  ? "border-purple-300/50 shadow-[0_4px_20px_rgba(103,80,164,0.1)] dark:border-white/[0.15] dark:shadow-[0_8px_40px_rgba(139,92,246,0.15)]"
                  : "border-gray-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:border-white/[0.05] dark:shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
              }
            `}
            >
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={disabled}
                placeholder={placeholder}
                rows={1}
                className="w-full px-3 sm:px-5 py-2 sm:py-3 bg-transparent text-gray-800 dark:text-white/90 placeholder-gray-400 dark:placeholder-white/30
                         resize-none focus:outline-none transition-colors duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed
                         selection:bg-purple-200/50 dark:selection:bg-purple-500/30 text-sm sm:text-base"
                style={{ minHeight: "40px", maxHeight: "120px" }}
              />

              {/* Character count indicator */}
              <AnimatePresence>
                {value.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-2 right-3 text-xs text-gray-500 dark:text-white/30"
                  >
                    {value.length}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Send button with gradient effect */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={disabled || (!value.trim() && attachedFiles.length === 0)}
            className={`
              relative p-3 rounded-xl transition-all duration-300
              overflow-hidden group
              ${
                disabled || (!value.trim() && attachedFiles.length === 0)
                  ? "opacity-50 cursor-not-allowed bg-gray-100/50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.05]"
                  : "bg-gradient-to-br from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 border border-purple-400/30 dark:border-purple-500/30 hover:border-purple-500/50 dark:hover:border-purple-500/50 shadow-[0_4px_16px_rgba(103,80,164,0.15)] dark:shadow-[0_8px_32px_rgba(139,92,246,0.2)]"
              }
            `}
            title="Send message"
          >
            {/* Animated gradient background */}
            <div
              className={`
              absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 dark:from-purple-500/30 dark:to-blue-500/30
              opacity-0 group-hover:opacity-100 transition-opacity duration-300
              ${disabled || (!value.trim() && attachedFiles.length === 0) ? "hidden" : ""}
            `}
            />

            {/* Sparkle effect on hover */}
            <Sparkles
              className={`
              absolute top-1 right-1 w-3 h-3 text-purple-400/70 dark:text-purple-300/60
              opacity-0 group-hover:opacity-100 transition-all duration-300
              group-hover:animate-pulse
              ${disabled || (!value.trim() && attachedFiles.length === 0) ? "hidden" : ""}
            `}
            />

            <Send
              className={`
              w-5 h-5 relative z-10 transition-all duration-300
              ${
                disabled || (!value.trim() && attachedFiles.length === 0)
                  ? "text-gray-400 dark:text-white/30"
                  : "text-gray-700 dark:text-white/80 group-hover:text-gray-900 dark:group-hover:text-white group-hover:transform group-hover:translate-x-0.5"
              }
            `}
            />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
