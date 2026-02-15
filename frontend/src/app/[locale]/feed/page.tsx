
import React from 'react';
import { FeedList } from '@/features/feed';
import { Bell } from 'lucide-react';

export default function FeedPage() {
    return (
        <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Daily Updates</h1>
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
            </div>

            <main className="max-w-2xl mx-auto py-6">
                <FeedList />
            </main>
        </div>
    );
}
