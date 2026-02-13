import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
    params: { locale }
}: {
    params: { locale: string };
}): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'Docs' });

    return {
        title: t('feat_livestock_title'),
        description: t('feat_livestock_desc'),
        openGraph: {
            title: t('feat_livestock_title'),
            description: t('feat_livestock_desc'),
        }
    };
}

export default function LivestockLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
