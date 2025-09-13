"use client";

import { useState, KeyboardEvent, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Paperclip,
  X,
  FileText,
  Image,
  FileSpreadsheet,
  ArrowUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceInput } from "@/components/voice/VoiceInput";
import { useTranslations } from "@/providers/LanguageProvider";

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
  placeholder,
}: InputAreaProps) {
  const t = useTranslations('conversation.input');
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
      setAttachedFiles([]);
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
    if (transcript.trim()) {
      setTimeout(() => onSend(transcript), 100);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [value]);

  return (
    <div className="bg-white dark:bg-[#212121]">
      <div className="max-w-3xl mx-auto">
        {/* Attached files display */}
        <AnimatePresence>
          {attachedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pt-3 pb-1"
            >
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((file) => {
                  const Icon = getFileIcon(file.type);
                  return (
                    <motion.div
                      key={file.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full 
                        bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                      <Icon className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 max-w-[150px] truncate">
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3 text-gray-500" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4">
          <div className="relative flex items-end">
            {/* Main input container */}
            <div className="flex-1 relative">
              <div className="relative flex items-center rounded-3xl border border-gray-300 dark:border-gray-700 
                bg-gray-50 dark:bg-[#616161] shadow-sm focus-within:border-gray-400 dark:focus-within:border-gray-600 
                transition-colors">
                
                {/* Attachment button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 
                    rounded-lg transition-colors disabled:opacity-50"
                  title={t('attachFiles')}
                >
                  <Paperclip className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={disabled}
                  placeholder={placeholder || t('placeholder')}
                  rows={1}
                  className="flex-1 bg-transparent px-12 py-3 text-gray-900 dark:text-gray-100 
                    placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none 
                    disabled:opacity-50 disabled:cursor-not-allowed text-[15px] leading-relaxed"
                  style={{ minHeight: "24px", maxHeight: "200px" }}
                />

                {/* Voice input button */}
                <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                  <VoiceInput
                    onTranscript={handleVoiceTranscript}
                    disabled={disabled || false}
                  />
                </div>

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={disabled || (!value.trim() && attachedFiles.length === 0)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all
                    ${
                      disabled || (!value.trim() && attachedFiles.length === 0)
                        ? "bg-[#616161] text-gray-400 cursor-not-allowed opacity-50"
                        : "bg-[#616161] hover:bg-gray-500 text-white"
                    }
                  `}
                  title={t('sendMessage')}
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Helper text */}
          <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
            {t('helperText')}
          </p>
        </div>
      </div>
    </div>
  );
}