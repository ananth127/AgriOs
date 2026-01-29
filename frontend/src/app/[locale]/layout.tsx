import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import "../globals.css";

import { Sidebar } from '@/components/Sidebar';
import NavBar from '@/components/NavBar';
import VoiceAssistant from '@/components/VoiceAssistant';
import { AuthProvider } from '@/lib/auth-context';
import AnalyticsListener from '@/components/AnalyticsListener';
import AuthGuard from '@/components/AuthGuard';
import GlobalProviders from '@/components/GlobalProviders';
import AppShell from '@/components/AppShell';

export default async function LocaleLayout({
    children,
    params: { locale }
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    const messages = await getMessages();

    return (
        <html lang={locale} className="dark" suppressHydrationWarning>
            <body className="bg-slate-950 text-white flex h-screen overflow-hidden">
                <NextIntlClientProvider messages={messages}>
                    <GlobalProviders>
                        <AuthProvider>
                            <AuthGuard>
                                <AnalyticsListener />
                                <AppShell locale={locale}>
                                    {children}
                                </AppShell>
                                <VoiceAssistant />
                            </AuthGuard>
                        </AuthProvider>
                    </GlobalProviders>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
