import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Features - AI, Analytics, and Satellites',
    description: 'Explore the powerful features of Agri-OS: AI Crop Doctor, Satellite Monitoring, and Market Analytics.',
    openGraph: {
        title: 'Features - AI, Analytics, and Satellites',
        description: 'Explore the powerful features of Agri-OS: AI Crop Doctor, Satellite Monitoring, and Market Analytics.',
        images: ['/og-image.png']
    }
};

export default function FeaturesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
