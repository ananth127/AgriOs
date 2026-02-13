export const locales = ['en', 'hi', 'kn', 'ta', 'te', 'ml', 'mr', 'bn', 'gu', 'pa'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
