'use client';

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export default function GlobalProviders({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <ProgressBar
                height="4px"
                color="#10b981" // emerald-500
                options={{ showSpinner: false }}
                shallowRouting
            />
        </>
    );
}
