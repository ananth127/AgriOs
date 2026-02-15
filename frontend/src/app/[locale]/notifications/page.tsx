'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { feedService } from '@/features/feed/services/feed.service';
import { Notification } from '@/features/feed/types/feed.types';
import { Loader2, Bell, Heart, MessageCircle, Share2, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from '@/navigation';

export default function NotificationsPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const data = await feedService.getNotifications(token!, 0, 50);
            setNotifications(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchNotifications();
        }
    }, [token, fetchNotifications]);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            try {
                await feedService.markNotificationRead(token!, notification.id);
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
            } catch (e) {
                console.error("Failed to mark read", e);
            }
        }

        // Navigate if related
        // For now, feed is likely on /feed or home?
        // Assuming feed is at /feed.
        // We don't have direct link to single post yet, but let's just go to feed.
        if (notification.type === 'like' || notification.type === 'comment' || notification.type === 'share') {
            router.push('/feed');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart className="w-5 h-5 text-red-500 fill-current" />;
            case 'comment': return <MessageCircle className="w-5 h-5 text-blue-500" />;
            case 'share': return <Share2 className="w-5 h-5 text-green-500" />;
            default: return <Info className="w-5 h-5 text-gray-500" />;
        }
    };

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Bell className="w-6 h-6" />
                    Notifications
                </h1>
                {/* <button className="text-sm text-emerald-600 font-medium hover:underline">Mark all as read</button> */}
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${notification.is_read
                                ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                                : 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30'
                                }`}
                        >
                            <div className="mt-1 bg-white p-2 rounded-full shadow-sm">
                                {getIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                    <span className="font-semibold">{notification.actor.full_name}</span> {notification.message}
                                </p>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </span>
                            </div>
                            {!notification.is_read && (
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
