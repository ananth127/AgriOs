'use client';

import { useRouter, usePathname } from '../navigation';
import { ChangeEvent, useTransition } from 'react';

export default function LanguageSwitcher({ locale }: { locale: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const onSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const nextLocale = e.target.value;
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <select
            defaultValue={locale}
            className="bg-gray-800 text-white border border-gray-600 rounded p-2"
            onChange={onSelectChange}
            disabled={isPending}
        >
            <option value="en">English</option>
            <option value="hi">Hindi (हिन्दी)</option>
            <option value="kn">Kannada (ಕನ್ನಡ)</option>
            <option value="ta">Tamil (தமிழ்)</option>
            <option value="te">Telugu (తెలుగు)</option>
            <option value="ml">Malayalam (മലയാളം)</option>
            <option value="mr">Marathi (मराठी)</option>
        </select>
    );
}
