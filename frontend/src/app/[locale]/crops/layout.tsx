import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
    params: { locale }
}: {
    params: { locale: string };
}): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'Crops' });

    return {
        title: t('page_title'),
        description: t('page_subtitle'),
        openGraph: {
            title: t('page_title'),
            description: t('page_subtitle'),
        }
    };
}

export default function CropsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
