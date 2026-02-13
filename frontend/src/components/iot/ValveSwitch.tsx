'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ValveSwitchProps {
    label: string;
    isOn: boolean;
    isLoading?: boolean;
    onToggle: (newState: boolean) => void;
    className?: string;
}

export function ValveSwitch({ label, isOn, isLoading, onToggle, className }: ValveSwitchProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-between p-4 rounded-xl border transition-all duration-300 select-none",
            isOn
                ? "bg-green-500/10 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10",
            className
        )}>
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{label}</div>

            <button
                onClick={() => !isLoading && onToggle(!isOn)}
                disabled={isLoading}
                className={cn(
                    "relative w-14 h-8 rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
                    isOn ? "bg-green-500" : "bg-slate-300 dark:bg-slate-700",
                    isLoading && "opacity-80 cursor-not-allowed"
                )}
            >
                {/* Switch Knob */}
                <span
                    className={cn(
                        "absolute top-1 left-1 bg-white rounded-full w-6 h-6 shadow-md transform transition-transform duration-300 ease-in-out flex items-center justify-center",
                        isOn ? "translate-x-6" : "translate-x-0"
                    )}
                >
                    {isLoading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                </span>
            </button>

            <div className={cn("mt-3 text-[10px] font-bold uppercase tracking-wider", isOn ? "text-green-600" : "text-slate-400")}>
                {isOn ? "Active" : "Closed"}
            </div>
        </div>
    );
}
