import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Use Cases - Farmers, FPOs, and Government',
    description: 'See how Agri-OS empowers farmers, cooperatives, and government bodies with digital tools.',
    openGraph: {
        title: 'Use Cases - Farmers, FPOs, and Government',
        description: 'See how Agri-OS empowers farmers, cooperatives, and government bodies with digital tools.',
        images: ['/og-image.png']
    }
};

export default function UseCasesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
