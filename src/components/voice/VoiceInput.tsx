"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
          setTranscript("");
        };

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          setTranscript(transcript);

          if (event.results[current].isFinal) {
            onTranscript(transcript);
            setIsListening(false);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [onTranscript]);

  const toggleListening = () => {
    if (!isSupported || disabled) return;

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={toggleListening}
        disabled={disabled}
        className={`
          relative p-3 rounded-full transition-all duration-300
          ${
            isListening
              ? "bg-gradient-to-r from-red-500 to-pink-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
              : "bg-white/[0.05] backdrop-blur-xl border border-white/[0.1] hover:bg-white/[0.08] hover:border-white/[0.2]"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          light-mode:bg-black/[0.05] light-mode:border-black/[0.1] 
          light-mode:hover:bg-black/[0.08] light-mode:hover:border-black/[0.2]
        `}
        aria-label={isListening ? "Stop voice input" : "Start voice input"}
      >
        <AnimatePresence mode="wait">
          {isListening ? (
            <motion.div
              key="listening"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MicOff className="w-5 h-5 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Mic className="w-5 h-5 text-white/80 light-mode:text-gray-700" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse animation when listening */}
        {isListening && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500/20"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500/20"
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            />
          </>
        )}
      </button>

      {/* Live transcript */}
      <AnimatePresence>
        {isListening && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 
                     bg-black/80 backdrop-blur-xl rounded-lg px-3 py-2 
                     text-xs text-white/80 whitespace-nowrap
                     border border-white/10 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              {transcript}
            </div>
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full
                          w-0 h-0 border-l-[6px] border-l-transparent
                          border-r-[6px] border-r-transparent
                          border-t-[6px] border-t-black/80"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
