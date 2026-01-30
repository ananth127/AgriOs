import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
    params: { locale }
}: {
    params: { locale: string };
}): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'FarmManagement' });

    return {
        title: t('title'),
        description: t('description'),
        openGraph: {
            title: t('title'),
            description: t('description'),
        }
    };
}

export default function FarmManagementLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
