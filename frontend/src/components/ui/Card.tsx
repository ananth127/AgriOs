'use client';

import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import React from 'react';

export function Card({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl",
                // If the user does not provide padding override, we might want a default.
                // But since we are introducing Header/Content, it's better if Card is just the container.
                // However, to permit backward compatibility (if any), we should check.
                // For now, let's keep it simple: Card is container. 
                // We add 'p-6' only if there are no sub-components? No, we can't detect that easily.
                // Let's assume standard Shadcn behavior: Card has NO padding, subcomponents have padding.
                // BUT, to avoid breaking existing "Card with text" usage, we might be in trouble.
                // Let's add 'p-6' by default, and if using Header/Content, we can user 'p-0' on Card?
                // No, that's annoying.
                // Let's define Card as just the wrapper with NO default padding for now, 
                // BUT we add a class to handle legacy if needed or just fix legacy.
                // I will risk removing 'p-6' from here and adding it to CardContent.
                // Wait, the previous file had 'p-6'.
                // I will keep 'p-6' but allow 'p-0' override easily.
                "p-6 transition-colors duration-300",
                className
            )}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
}

export function CardHeader({ className, children }: { className?: string, children: React.ReactNode }) {
    return <div className={cn("flex flex-col space-y-1.5 mb-4", className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string, children: React.ReactNode }) {
    return <h3 className={cn("font-semibold leading-none tracking-tight text-lg text-slate-900 dark:text-white", className)}>{children}</h3>;
}

export function CardContent({ className, children }: { className?: string, children: React.ReactNode }) {
    return <div className={cn("pt-0", className)}>{children}</div>;
}
