import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
    params: { locale }
}: {
    params: { locale: string };
}): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'Library' });

    return {
        title: t('page_title'),
        description: t('page_subtitle'),
        openGraph: {
            title: t('page_title'),
            description: t('page_subtitle'),
        }
    };
}

export default function LibraryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
