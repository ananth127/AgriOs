import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
    params: { locale }
}: {
    params: { locale: string };
}): Promise<Metadata> {
    // We use Global or Dashboard translations to give a "Preview" feel even on the login page
    const t = await getTranslations({ locale, namespace: 'Global' });
    const tDashboard = await getTranslations({ locale, namespace: 'Dashboard' });

    return {
        title: 'Start Farming Smarter', // More inviting than "Login"
        description: tDashboard('hero_subtitle'), // "Join the next generation of farming..."
        openGraph: {
            title: 'Agri-OS - The Operating System for Modern Agriculture',
            description: tDashboard('hero_subtitle'),
            images: ['/og-image.png'], // Shows the dashboard/brand image
        }
    };
}

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
