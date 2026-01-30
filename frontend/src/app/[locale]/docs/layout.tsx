import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import PublicHeader from '@/components/PublicHeader';

export async function generateMetadata({
    params: { locale }
}: {
    params: { locale: string };
}): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'Docs' });

    return {
        title: t('title'),
        description: t('subtitle'),
        openGraph: {
            title: t('title'),
            description: t('subtitle'),
        }
    };
}

export default function DocsLayout({
    children,
    params: { locale }
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <PublicHeader locale={locale} />
            {children}
        </div>
    );
}
