// Load encrypted environment variables (if .env.local.enc exists)
try {
    await import('./load-env.js');
} catch (e) {
    console.warn('⚠️  Could not load encrypted .env:', e.message);
}

import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withNextIntl(nextConfig);
