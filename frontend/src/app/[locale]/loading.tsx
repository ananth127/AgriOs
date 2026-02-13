import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full min-h-[60vh] text-slate-400 space-y-4 animate-in fade-in duration-300">
            <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
                <Loader2 className="w-12 h-12 text-green-500 animate-spin relative z-10" />
            </div>
            <p className="text-sm font-medium animate-pulse">Loading Agri-OS...</p>
        </div>
    );
}
