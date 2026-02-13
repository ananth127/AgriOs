import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const routes = [
        '',
        '/features',
        '/use-cases',
        '/livestock',
        '/farm-management',
        '/crop-doctor',
        '/marketplace',
        '/crops',
        '/calculator',
        '/community',
        '/library',
        '/drone',
        '/supply-chain',
        '/docs'
    ];

    return routes.map((route) => ({
        url: `${baseUrl}/en${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.8,
    }));
}
