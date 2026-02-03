import React from 'react';
import { cn } from '@/lib/utils';

interface SignalIndicatorProps {
    strength: number; // 0-5
    showLabel?: boolean;
    className?: string;
}

export function SignalIndicator({ strength, showLabel = false, className }: SignalIndicatorProps) {
    // Strength: 0 (Offline), 1-2 (Weak/Red), 3 (Fair/Yellow), 4-5 (Good/Green)

    const getColor = (barIndex: number) => {
        if (strength === 0) return "bg-slate-300 dark:bg-slate-700";
        if (barIndex > strength) return "bg-slate-300 dark:bg-slate-700";

        if (strength <= 2) return "bg-red-500";
        if (strength === 3) return "bg-yellow-500";
        return "bg-green-500";
    };

    return (
        <div className={cn("flex items-end gap-0.5", className)} title={`Signal Strength: ${strength}/5`}>
            {[1, 2, 3, 4, 5].map((level) => (
                <div
                    key={level}
                    className={cn(
                        "w-1 rounded-sm transition-all duration-300",
                        getColor(level)
                    )}
                    style={{ height: `${level * 4}px` }}
                />
            ))}
            {showLabel && (
                <span className="ml-1 text-[10px] text-slate-500 font-medium">
                    {strength === 0 ? 'Offline' : `${strength}/5`}
                </span>
            )}
        </div>
    );
}
