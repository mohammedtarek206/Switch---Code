'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('App Error Boundary caught an error:', error);
    }, [error]);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="glass-panel p-8 rounded-3xl max-w-md w-full border border-red-500/30 space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto text-xl font-bold">
                    ⚠️
                </div>
                <h2 className="text-xl font-bold text-white">Something went wrong!</h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                    {error?.message || 'An unexpected error occurred while loading this page.'}
                </p>
                <button
                    onClick={() => reset()}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl text-xs transition-all"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
