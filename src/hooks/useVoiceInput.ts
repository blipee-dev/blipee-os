import { useState, useEffect, useRef, useCallback } from "react";

interface UseVoiceInputOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const {
    language = "en-US",
    continuous = false,
    interimResults = true,
    onStart,
    onEnd,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.lang = language;

        recognition.onstart = () => {
          setIsListening(true);
          setTranscript("");
          setInterimTranscript("");
          onStart?.();
        };

        recognition.onresult = (event: any) => {
          let interim = "";
          let final = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript + " ";
            } else {
              interim += transcript;
            }
          }

          if (final) {
            setTranscript((prev) => prev + final);
          }
          setInterimTranscript(interim);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          onError?.(event.error);
        };

        recognition.onend = () => {
          setIsListening(false);
          onEnd?.();
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, continuous, interimResults, onStart, onEnd, onError]);

  const startListening = useCallback(() => {
    if (!isSupported || isListening) return;

    setTranscript("");
    setInterimTranscript("");

    try {
      recognitionRef.current?.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      onError?.(error);
    }
  }, [isSupported, isListening, onError]);

  const stopListening = useCallback(() => {
    if (!isSupported || !isListening) return;

    try {
      recognitionRef.current?.stop();
    } catch (error) {
      console.error("Failed to stop speech recognition:", error);
    }
  }, [isSupported, isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    toggleListening,
  };
}
