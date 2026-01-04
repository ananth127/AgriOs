'use client';

import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function Card({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl",
                className
            )}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
}
