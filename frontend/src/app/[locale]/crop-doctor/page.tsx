'use client';

import { useTranslations } from 'next-intl';
import DiagnosisUploader from '@/components/diagnosis/DiagnosisUploader';

interface PageProps {
    params: { locale: string };
}

export default function CropDoctorPage({ params: { locale } }: PageProps) {
    const t = useTranslations('Diagnosis');

    return (
        <div className="relative min-h-full">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-96 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />

            <div className="p-6 md:p-8 relative z-10">
                <div className="max-w-6xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                            {t('page_title')}
                        </h1>
                        <p className="text-slate-400 max-w-2xl text-lg">
                            {t('page_subtitle')}
                        </p>
                    </div>

                    {/* Main Interaction Area */}
                    <DiagnosisUploader />

                </div>
            </div>
        </div>
    );
}
