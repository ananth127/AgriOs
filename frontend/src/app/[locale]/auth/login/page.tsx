'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Sprout, Tractor, ShoppingBag, Truck, User } from 'lucide-react';
import { Link } from '@/navigation';

export default function LoginPage() {
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const router = useRouter();

    const roles = [
        { id: 'farmer', label: 'Farmer', icon: Sprout, description: 'Manage crops, farms, and yield.', color: 'text-green-400', bg: 'bg-green-500/10', border: 'hover:border-green-500' },
        { id: 'agri_officer', label: 'Agri Officer', icon: Tractor, description: 'Monitor region stats and approvals.', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'hover:border-blue-500' },
        { id: 'broker', label: 'Broker', icon: ShoppingBag, description: 'Trade produced goods.', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'hover:border-orange-500' },
        { id: 'buyer', label: 'Buyer', icon: User, description: 'Purchase high-quality produce.', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'hover:border-purple-500' },
        { id: 'logistics', label: 'Logistics', icon: Truck, description: 'Handle supply chain transport.', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'hover:border-yellow-500' },
    ];

    const handleLogin = (roleId: string) => {
        // In a real app, this would set a session/cookie
        // For MVP, we just redirect to dashboard
        router.push('/en');
    };

    return (
        <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="z-10 text-center mb-12">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent mb-4">
                    Agri-OS
                </h1>
                <p className="text-slate-400 text-lg">Select your role to continue</p>
            </div>

            <div className="z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
                {roles.map((role) => (
                    <Card
                        key={role.id}
                        onClick={() => handleLogin(role.id)}
                        className={`cursor-pointer group transition-all duration-300 hover:scale-[1.02] border-white/5 ${role.border}`}
                    >
                        <div className="flex flex-col items-center text-center p-4">
                            <div className={`p-4 rounded-2xl mb-4 transition-colors ${role.bg} group-hover:bg-opacity-20`}>
                                <role.icon className={`w-10 h-10 ${role.color}`} />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{role.label}</h3>
                            <p className="text-sm text-slate-500">{role.description}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="z-10 mt-12 text-slate-500 text-sm">
                Powered by <span className="text-slate-400 font-semibold">Agri-Stack</span>
            </div>
        </main>
    );
}
