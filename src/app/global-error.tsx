'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Something went wrong!</h2>
            <p className="text-gray-400">A critical error occurred.</p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}