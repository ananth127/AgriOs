'use client';

import { useState, useEffect } from 'react';
import { Link, usePathname } from '@/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Sprout, Tractor, ShoppingBag, ScrollText, Users, Camera, Calculator, LogOut, LogIn, X, MapPin, Briefcase, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { API_BASE_URL } from '@/lib/constants';
import dynamic from 'next/dynamic';

const LocationSelector = dynamic(() => import('@/components/LocationSelector'), { ssr: false });

interface SidebarProps {
    locale: string;
}

export function Sidebar({ locale }: SidebarProps) {
    const pathname = usePathname();
    const { user, isAuthenticated, logout, updateUser, token } = useAuth();

    // Profile Modal State
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit State
    const [editRole, setEditRole] = useState(user?.role || 'farmer');
    const [editLocation, setEditLocation] = useState<{ name: string, lat: number, lng: number } | null>(null);

    // Sync state when user loads or modal opens
    useEffect(() => {
        if (user) {
            setEditRole(user.role);
            if (user.location_name && user.latitude && user.longitude) {
                setEditLocation({
                    name: user.location_name,
                    lat: user.latitude,
                    lng: user.longitude
                });
            }
        }
    }, [user, isProfileOpen]);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const payload = {
                role: editRole,
                ...(editLocation && {
                    latitude: editLocation.lat,
                    longitude: editLocation.lng,
                    location_name: editLocation.name
                })
            };

            const res = await fetch(`${API_BASE_URL}/auth/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to update profile');

            const updatedUser = await res.json();
            updateUser(updatedUser); // Update context
            setIsProfileOpen(false);

        } catch (err) {
            console.error(err);
            alert("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const links = [
        { href: '/', label: 'Overview', icon: LayoutDashboard },
        { href: '/farms', label: 'My Farms', icon: Tractor },
        { href: '/crops', label: 'Crops & Registry', icon: Sprout },
        { href: '/farm-management', label: 'Management', icon: Briefcase },
        { href: '/livestock', label: 'Livestock', icon: Users },
        { href: '/supply-chain', label: 'Track & Trace', icon: ScrollText },
        { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
        { href: '/drone', label: 'Drone AI', icon: Camera },
        { href: '/calculator', label: 'Calculator', icon: Calculator },
        { href: '/docs', label: 'Docs', icon: Users },
    ];

    return (
        <div className="w-64 bg-slate-900 border-r border-white/10 flex-col hidden md:flex h-full">
            <div className="p-6">
                <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                    Agri-OS
                </div>
                <p className="text-xs text-slate-500 mt-1">Universal Farm OS</p>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {links.map((link) => {
                    // usePathname from navigation.ts returns path WITHOUT locale (e.g. /farms)
                    // We compare it directly to link.href
                    const isActive = pathname === link.href;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                            )}
                        >
                            <link.icon className="w-5 h-5" />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10">
                {isAuthenticated ? (
                    <>
                        <div
                            onClick={() => setIsProfileOpen(true)}
                            className="bg-slate-800 rounded-lg p-3 hover:bg-green-500/10 hover:border-green-500/30 border border-transparent transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                                    {user?.full_name?.charAt(0) || 'U'}
                                </div>
                                <div className="overflow-hidden">
                                    <div className="text-sm font-medium text-white truncate group-hover:text-green-400 transition-colors">
                                        {user?.full_name || 'Farmer'}
                                    </div>
                                    <div className="text-xs text-slate-500 group-hover:text-green-500/70 flex items-center gap-1">
                                        View Profile
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profile Modal */}
                        {isProfileOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                                <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
                                    <button
                                        onClick={() => setIsProfileOpen(false)}
                                        className="absolute top-4 right-4 text-slate-500 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>

                                    <h2 className="text-xl font-bold text-white mb-6">Edit Profile</h2>

                                    <div className="space-y-4">
                                        {/* Name (Read-only for now or simple edit) */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">Full Name</label>
                                            <div className="p-3 bg-slate-950/50 rounded-lg text-white border border-white/5">
                                                {user?.full_name}
                                            </div>
                                        </div>

                                        {/* Role */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">Role</label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <select
                                                    value={editRole}
                                                    onChange={(e) => setEditRole(e.target.value)}
                                                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white appearance-none focus:outline-none focus:border-green-500/50"
                                                >
                                                    <option value="farmer">Farmer</option>
                                                    <option value="agri_officer">Agri Officer</option>
                                                    <option value="broker">Broker</option>
                                                    <option value="buyer">Buyer</option>
                                                    <option value="logistics">Logistics</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">Farming Location</label>
                                            <div
                                                onClick={() => setIsLocationSelectorOpen(true)}
                                                className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-3 px-4 text-white hover:bg-slate-900/80 cursor-pointer transition-colors flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <MapPin className="w-4 h-4 text-slate-500 group-hover:text-green-400" />
                                                    <div className="text-sm truncate max-w-[200px]">
                                                        {editLocation?.name || "Set Location"}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-green-400">Change</div>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex gap-3">
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={saving}
                                                className="flex-1 bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setIsProfileOpen(false);
                                                }}
                                                className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-lg border border-red-500/20 transition-colors"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Location Selector Modal */}
                        <LocationSelector
                            isOpen={isLocationSelectorOpen}
                            onClose={() => setIsLocationSelectorOpen(false)}
                            onSelect={(lat, lng, name) => {
                                setEditLocation({ lat, lng, name });
                                setIsLocationSelectorOpen(false); // Close selector after choice
                            }}
                        />
                    </>
                ) : (
                    <Link href="/auth/login" className="block">
                        <div className="bg-slate-800 rounded-lg p-3 hover:bg-green-500/10 hover:border-green-500/30 border border-transparent transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                                    <LogIn className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white group-hover:text-green-300 transition-colors">Sign In</div>
                                    <div className="text-xs text-slate-500 group-hover:text-green-400/70">Access Account</div>
                                </div>
                            </div>
                        </div>
                    </Link>
                )}
            </div>
        </div>
    );
}
