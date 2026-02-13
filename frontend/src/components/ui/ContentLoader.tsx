import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentLoaderProps {
    loading: boolean;
    children: React.ReactNode;
    className?: string; // Additional classes for the container
    overlay?: boolean;   // If true, shows spinner over existing content (e.g. updating). If false, replaces content.
    text?: string;       // Optional text below spinner
}

export function ContentLoader({ loading, children, className, overlay = false, text }: ContentLoaderProps) {
    if (!loading) return <>{children}</>;

    if (overlay) {
        return (
            <div className={cn("relative isolate", className)}>
                {/* Content with blur/opacity */}
                <div className="opacity-50 pointer-events-none filter blur-[1px] transition-all">
                    {children}
                </div>

                {/* Overlay Spinner */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4">
                    <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                    {text && <p className="text-xs font-medium text-slate-300 mt-2 bg-slate-900/80 px-2 py-1 rounded">{text}</p>}
                </div>
            </div>
        );
    }

    // Replacement Mode (Initial Load)
    return (
        <div className={cn("flex flex-col items-center justify-center min-h-[200px] w-full p-8 animate-in fade-in duration-300", className)}>
            <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-400 animate-pulse">{text || "Loading content..."}</p>
        </div>
    );
}

export function SkeletonCard() {
    return (
        <div className="rounded-xl bg-slate-900 border border-white/5 p-4 space-y-3 animate-pulse">
            <div className="h-4 bg-slate-800 rounded w-3/4"></div>
            <div className="space-y-2">
                <div className="h-3 bg-slate-800 rounded"></div>
                <div className="h-3 bg-slate-800 rounded w-5/6"></div>
            </div>
        </div>
    );
}
