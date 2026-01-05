export const locales = ['en', 'hi', 'kn', 'ta', 'te', 'ml', 'mr'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
