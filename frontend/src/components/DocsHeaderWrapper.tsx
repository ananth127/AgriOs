'use client';

import { useAuth } from '@/lib/auth-context';
import PublicHeader from '@/components/PublicHeader';

export default function DocsHeaderWrapper({ locale }: { locale: string }) {
    const { isAuthenticated, loading } = useAuth();

    // If we are authenticated, the AppShell takes care of the layout (Sidebar/NavBar).
    // We strictly hide the PublicHeader to avoid double headers.
    if (isAuthenticated) {
        return null;
    }

    // If loading, we technically don't know yet. 
    // However, since AuthGuard lets us through on public paths, 
    // rendering PublicHeader is the safer "default" for a public page like Docs,
    // to prevent it looking broken for guests.
    // Indexing robots/SSR will also not have auth, so they need PublicHeader.

    return <PublicHeader locale={locale} />;
}
