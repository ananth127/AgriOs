'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import LibraryBrowser from '@/components/library/LibraryBrowser';
import CropLibrary from '@/components/library/CropLibrary';
import { BookOpen, Sprout } from 'lucide-react';

interface PageProps {
    params: { locale: string };
}

export default function LibraryPage({ params: { locale } }: PageProps) {
    const t = useTranslations('Library');
    const [activeTab, setActiveTab] = useState<'diseases' | 'crops'>('crops');

    return (
        <div className="relative min-h-full">
            <div className="absolute top-0 right-0 w-full h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />

            <div className="p-6 md:p-8 relative z-10">
                <div className="max-w-6xl mx-auto space-y-8">

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-2">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                                {t('page_title')}
                            </h1>
                            <p className="text-slate-400 max-w-2xl text-lg">
                                {t('page_subtitle')}
                            </p>
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5">
                            <button
                                onClick={() => setActiveTab('crops')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'crops'
                                        ? 'bg-green-500 text-slate-900 shadow-lg shadow-green-900/20'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <Sprout className="w-4 h-4" />
                                Crop Encyclopedia
                            </button>
                            <button
                                onClick={() => setActiveTab('diseases')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'diseases'
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <BookOpen className="w-4 h-4" />
                                Disease Library
                            </button>
                        </div>
                    </div>

                    <div className="min-h-[500px]">
                        {activeTab === 'crops' ? <CropLibrary /> : <LibraryBrowser />}
                    </div>

                </div>
            </div>
        </div>
    );
}
