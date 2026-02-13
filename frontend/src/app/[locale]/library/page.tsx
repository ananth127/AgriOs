import { getTranslations } from 'next-intl/server';
import LibraryContent from '@/components/library/LibraryContent';
import { Metadata } from 'next';

interface PageProps {
    params: { locale: string };
}



export default function LibraryPage({ params: { locale } }: PageProps) {
    return (
        <div className="relative min-h-full">
            {/* Background Gradients (Server Rendered) */}
            <div className="absolute top-0 right-0 w-full h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />

            {/* Main Content Area */}
            <div className="p-6 md:p-8 relative z-10">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Client Component mounting here */}
                    <LibraryContent />
                </div>
            </div>
        </div>
    );
}
