import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
    params: { locale }
}: {
    params: { locale: string };
}): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'Diagnosis' });

    return {
        title: t('page_title'),
        description: t('page_subtitle'),
        openGraph: {
            title: t('page_title'),
            description: t('page_subtitle'),
        }
    };
}

export default function CropDoctorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
