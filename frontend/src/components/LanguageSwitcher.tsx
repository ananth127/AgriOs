'use client';

import { useRouter, usePathname, locales } from '../navigation';
import { ChangeEvent, useTransition } from 'react';

type Locale = typeof locales[number];

import { Globe } from 'lucide-react';

export default function LanguageSwitcher({ locale }: { locale: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const onSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const nextLocale = e.target.value as Locale;
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <div className="relative flex items-center bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 focus-within:border-slate-300 dark:focus-within:border-white/30 hover:border-slate-300 dark:hover:border-white/20 transition-colors">
            <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400 mr-2" />
            <select
                defaultValue={locale}
                className="bg-transparent text-slate-700 dark:text-white text-xs font-medium focus:outline-none appearance-none pr-6 cursor-pointer"
                onChange={onSelectChange}
                disabled={isPending}
            >
                <option value="en" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">English</option>
                <option value="hi" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">हिंदी</option>
                <option value="kn" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">ಕನ್ನಡ</option>
                <option value="ta" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">தமிழ்</option>
                <option value="te" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">తెలుగు</option>
                <option value="ml" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">മലയാളം</option>
                <option value="mr" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">मराठी</option>
            </select>
            {/* Custom Arrow */}
            <div className="absolute right-2 pointer-events-none text-slate-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
        </div>
    );
}
