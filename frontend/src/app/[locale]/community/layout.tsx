import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Community Forum',
    description: 'Ask questions, share knowledge, and grow together on AgriOS Community.',
    openGraph: {
        title: 'Community Forum',
        description: 'Ask questions, share knowledge, and grow together on AgriOS Community.',
    }
};

export default function CommunityLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
