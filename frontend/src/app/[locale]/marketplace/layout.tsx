import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
    params: { locale }
}: {
    params: { locale: string };
}): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'Marketplace' });

    return {
        title: t('title'),
        description: t('subtitle_market'),
        openGraph: {
            title: t('title'),
            description: t('subtitle_market'),
        }
    };
}

export default function MarketplaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
