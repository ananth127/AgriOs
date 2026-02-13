'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an analytics service
        console.error("Global Error Boundary Caught:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6">
            <div className="bg-red-500/10 p-6 rounded-full border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <AlertTriangle className="w-12 h-12 text-red-500 animate-pulse" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-white">Oops, something went wrong!</h2>
                <p className="text-slate-400">
                    We&apos;ve noticed an issue and our team is already working on a fix to resolve it very soon!
                    <br />
                    <span className="text-sm italic text-slate-500">Sorry for this inconvenience.</span>
                </p>
                {/* Optional: Show technically safe error info for dev */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="bg-slate-900 p-3 rounded text-xs text-red-300 font-mono text-left overflow-auto max-w-sm mx-auto mt-4 border border-red-900/50">
                        {error.message || "Unknown Error"}
                    </div>
                )}
            </div>

            <button
                onClick={() => reset()}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-green-500/20"
            >
                <RotateCcw className="w-4 h-4" />
                Try Again
            </button>
        </div>
    );
}
