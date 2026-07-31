'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body className="bg-[#07111F] text-white min-h-screen flex items-center justify-center p-4">
                <div className="glass-panel p-8 rounded-3xl max-w-md w-full border border-red-500/30 text-center space-y-4">
                    <h2 className="text-2xl font-black text-red-400">Application Error</h2>
                    <p className="text-xs text-gray-400">
                        {error?.message || 'A critical error occurred.'}
                    </p>
                    <button
                        onClick={() => reset()}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs transition-all"
                    >
                        Reload Application
                    </button>
                </div>
            </body>
        </html>
    );
}
