import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
    params: { locale }
}: {
    params: { locale: string };
}): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'Calculator' });

    return {
        title: t('title'),
        description: t('subtitle'),
        openGraph: {
            title: t('title'),
            description: t('subtitle'),
        }
    };
}

export default function CalculatorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
