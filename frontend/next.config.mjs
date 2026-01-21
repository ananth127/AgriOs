// Load encrypted environment variables (if .env.local.enc exists)
try {
    await import('./load-env.js');
} catch (e) {
    console.warn('⚠️  Could not load encrypted .env:', e.message);
}

import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const withPWA = (await import('next-pwa')).default({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
    // Enable SWC minification
    swcMinify: true,
    experimental: {
        swcPlugins: [
            // ['@swc/plugin-styled-components', { displayName: true, ssr: true }],
        ],
    },

    // Transpile WatermelonDB modules
    transpilePackages: ['@nozbe/watermelondb', '@nozbe/watermelondb/drivers/lokijs'],

    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
        };
        return config;
    },
};

export default withNextIntl(withPWA(nextConfig));
