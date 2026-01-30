import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
    params: { locale }
}: {
    params: { locale: string };
}): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'Docs' }); // Using Docs as fallback or specific keys if created

    return {
        title: t('feat_drone_title'),
        description: t('feat_drone_desc'),
        openGraph: {
            title: t('feat_drone_title'),
            description: t('feat_drone_desc'),
        }
    };
}

export default function DroneLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
