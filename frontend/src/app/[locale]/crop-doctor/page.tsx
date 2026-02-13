'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { Stethoscope, BookOpen } from 'lucide-react';

const DiagnosisUploader = dynamic(() => import('@/components/diagnosis/DiagnosisUploader'), {
    loading: () => <div className="h-96 flex items-center justify-center text-slate-500">Loading AI Doctor...</div>
});

const LibraryBrowser = dynamic(() => import('@/components/library/LibraryBrowser'), {
    loading: () => <div className="h-96 flex items-center justify-center text-slate-500">Loading Library...</div>
});

interface PageProps {
    params: { locale: string };
}

export default function CropDoctorPage({ params: { locale } }: PageProps) {
    const t = useTranslations('Diagnosis');
    const [activeTab, setActiveTab] = useState<'doctor' | 'library'>('doctor');

    return (
        <div className="relative min-h-full">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-96 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />

            <div className="p-4 md:p-8 relative z-10">
                <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">

                    {/* Header & Tabs */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-2">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                                {activeTab === 'doctor' ? t('page_title') : 'Disease Library'}
                            </h1>
                            <p className="text-slate-400 max-w-2xl text-sm md:text-lg">
                                {activeTab === 'doctor' ? t('page_subtitle') : 'Explore our comprehensive database of crop diseases and treatments.'}
                            </p>
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5 shrink-0 self-start md:self-auto">
                            <button
                                onClick={() => setActiveTab('doctor')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'doctor'
                                    ? 'bg-green-500 text-slate-900 shadow-lg shadow-green-900/20'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <Stethoscope className="w-4 h-4" />
                                AI Doctor
                            </button>
                            <button
                                onClick={() => setActiveTab('library')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'library'
                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <BookOpen className="w-4 h-4" />
                                Library
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {activeTab === 'doctor' ? (
                            <DiagnosisUploader />
                        ) : (
                            <LibraryBrowser />
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
