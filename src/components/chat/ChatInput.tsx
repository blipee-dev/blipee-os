'use client';

/**
 * ChatInput Component
 *
 * Reusable input component following official Vercel AI SDK pattern
 * Based on: https://github.com/vercel/ai/tree/main/examples/next-openai
 */

import { useState } from 'react';

interface ChatInputProps {
  status: string;
  onSubmit: (text: string) => void;
  stop?: () => void;
}

export default function ChatInput({ status, onSubmit, stop }: ChatInputProps) {
  const [text, setText] = useState('');

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (text.trim() === '') return;
        onSubmit(text);
        setText('');
      }}
      className="border-t border-gray-200 dark:border-zinc-700 pt-4"
    >
      <div className="flex gap-2">
        <input
          className="flex-1 p-3 border border-gray-300 dark:border-zinc-700 rounded-lg shadow-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
          placeholder="Ask about sustainability, emissions, compliance..."
          disabled={status !== 'ready'}
          value={text}
          onChange={e => setText(e.target.value)}
        />
        {stop && (status === 'streaming' || status === 'submitted') ? (
          <button
            type="button"
            onClick={stop}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={status !== 'ready' || !text.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-zinc-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            Send
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
        Blipee AI can make mistakes. Verify important information.
      </p>
    </form>
  );
}
