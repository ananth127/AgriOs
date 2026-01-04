import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import "../globals.css";

import { Sidebar } from '@/components/Sidebar';
import NavBar from '@/components/NavBar';
import VoiceAssistant from '@/components/VoiceAssistant';

export default async function LocaleLayout({
    children,
    params: { locale }
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    const messages = await getMessages();

    return (
        <html lang={locale} className="dark">
            <body className="bg-slate-950 text-white flex h-screen overflow-hidden">
                <NextIntlClientProvider messages={messages}>
                    <Sidebar locale={locale} />
                    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
                        {/* NavBar stays at top, essentially 'fixed' relative to content */}
                        <NavBar locale={locale} />

                        {/* Main Content Area - Scrolls independently */}
                        <main className="flex-1 overflow-y-auto relative scroll-smooth">
                            {children}
                        </main>
                    </div>
                    <VoiceAssistant />
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
