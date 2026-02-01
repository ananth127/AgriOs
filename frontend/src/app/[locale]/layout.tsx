import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { Metadata, Viewport } from 'next';
import "../globals.css";

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#f8fafc' }, // slate-50
        { media: '(prefers-color-scheme: dark)', color: '#020617' }, // slate-950
    ],
};

import { Sidebar } from '@/components/Sidebar';
import NavBar from '@/components/NavBar';
import VoiceAssistant from '@/components/VoiceAssistant';
import { AuthProvider } from '@/lib/auth-context';
import AnalyticsListener from '@/components/AnalyticsListener';
import AuthGuard from '@/components/AuthGuard';
import GlobalProviders from '@/components/GlobalProviders';
import AppShell from '@/components/AppShell';

export async function generateMetadata({
    params: { locale }
}: {
    params: { locale: string };
}): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'Global' });
    const tDashboard = await getTranslations({ locale, namespace: 'Dashboard' });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    return {
        metadataBase: new URL(baseUrl),
        title: {
            template: `%s | ${t('app_name')}`,
            default: `${t('app_name')} - ${t('app_tagline')}`,
        },
        description: tDashboard('hero_subtitle'),
        openGraph: {
            type: 'website',
            locale: locale,
            url: `${baseUrl}/${locale}`,
            siteName: t('app_name'),
            title: `${t('app_name')} - ${t('app_tagline')}`,
            description: tDashboard('hero_subtitle'),
            images: [
                {
                    url: '/og-image.png',
                    width: 1200,
                    height: 630,
                    alt: t('app_name'),
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${t('app_name')} - ${t('app_tagline')}`,
            description: tDashboard('hero_subtitle'),
            images: ['/og-image.png'],
        },
    };
}

export default async function LocaleLayout({
    children,
    params: { locale }
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex h-[100dvh] overflow-hidden transition-colors duration-300">
                <NextIntlClientProvider messages={messages}>
                    <GlobalProviders>
                        <AuthProvider>
                            <AuthGuard>
                                <AnalyticsListener />
                                <AppShell locale={locale}>
                                    {children}
                                </AppShell>
                            </AuthGuard>
                            <VoiceAssistant />
                        </AuthProvider>
                    </GlobalProviders>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
