'use client';

import React, { useEffect } from 'react';
import { useRouter } from '@/navigation';

export default function DeviceDetailPage({ params }: { params: { deviceId: string } }) {
    const router = useRouter();

    useEffect(() => {
        // Redirect to centralized Management Dashboard
        router.push(`/farm-management?tab=iot&open_device=${params.deviceId}`);
    }, [params.deviceId, router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
                <p className="text-slate-500">Redirecting to Device Control...</p>
            </div>
        </div>
    );
}

