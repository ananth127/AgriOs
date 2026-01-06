'use client';

import { useState, useEffect } from 'react';
import { Link, usePathname } from '@/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Sprout, Tractor, ShoppingBag, ScrollText, Users, Camera, Calculator, LogOut, LogIn, X, MapPin, Briefcase, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { API_BASE_URL } from '@/lib/constants';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { trackSidebarClick, trackAuthEvent } from '@/lib/analytics';

const LocationSelector = dynamic(() => import('@/components/LocationSelector'), { ssr: false });

interface SidebarProps {
    locale: string;
}

export function Sidebar({ locale }: SidebarProps) {
    const t = useTranslations('Sidebar');
    const tGlobal = useTranslations('Global');
    const tAuth = useTranslations('Auth');
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
        { href: '/', label: t('menu_overview'), icon: LayoutDashboard },
        { href: '/farms', label: t('menu_my_farms'), icon: Tractor },
        { href: '/crops', label: t('menu_crops_registry'), icon: Sprout },
        { href: '/farm-management', label: t('menu_management'), icon: Briefcase },
        { href: '/livestock', label: t('menu_livestock'), icon: Users },
        { href: '/supply-chain', label: t('menu_track_trace'), icon: ScrollText },
        { href: '/marketplace', label: t('menu_marketplace'), icon: ShoppingBag },
        { href: '/drone', label: t('menu_drone_ai'), icon: Camera },
        { href: '/calculator', label: t('menu_calculator'), icon: Calculator },
        { href: '/docs', label: t('menu_docs'), icon: Users },
    ];

    return (
        <div className="w-72 bg-slate-950/80 backdrop-blur-xl border-r border-white/5 flex-col hidden md:flex h-full shadow-2xl relative z-40">
            <div className="p-8 pb-6">
                <div className="text-3xl font-extrabold bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 bg-clip-text text-transparent tracking-tight">
                    {tGlobal('app_name')}
                </div>
                <p className="text-xs font-medium text-slate-500 mt-1.5 uppercase tracking-widest pl-0.5">{tGlobal('app_tagline')}</p>
            </div>

            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                {links.map((link) => {
                    const isActive = pathname === link.href;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => trackSidebarClick(link.label, link.href)}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                                isActive
                                    ? "bg-green-500/10 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.1)] border border-green-500/20"
                                    : "text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-green-500 rounded-r-full shadow-lg shadow-green-500/50" />
                            )}
                            <link.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-green-400" : "text-slate-500 group-hover:text-slate-300")} />
                            <span className="relative z-10">{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/5 bg-slate-900/30">
                {isAuthenticated ? (
                    <>
                        <div
                            onClick={() => setIsProfileOpen(true)}
                            className="bg-slate-900/50 border border-white/5 rounded-xl p-3.5 hover:bg-slate-800/80 hover:border-green-500/30 transition-all cursor-pointer group shadow-lg"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-teal-600 p-[1px] shadow-lg shadow-green-900/20">
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-sm font-bold text-white uppercase">
                                        {user?.full_name?.charAt(0) || 'U'}
                                    </div>
                                </div>
                                <div className="overflow-hidden">
                                    <div className="text-sm font-semibold text-white truncate group-hover:text-green-400 transition-colors">
                                        {user?.full_name || tAuth('guest_user')}
                                    </div>
                                    <div className="text-xs font-medium text-slate-500 group-hover:text-green-500/70 flex items-center gap-1 transition-colors">
                                        {t('profile_view')}
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

                                    <h2 className="text-xl font-bold text-white mb-6">{t('profile_edit_title')}</h2>

                                    <div className="space-y-4">
                                        {/* Name (Read-only for now or simple edit) */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">{t('profile_full_name')}</label>
                                            <div className="p-3 bg-slate-950/50 rounded-lg text-white border border-white/5">
                                                {user?.full_name}
                                            </div>
                                        </div>

                                        {/* Role */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">{t('profile_role')}</label>
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
                                            <label className="text-sm font-medium text-slate-400">{t('profile_farming_location')}</label>
                                            <div
                                                onClick={() => setIsLocationSelectorOpen(true)}
                                                className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-3 px-4 text-white hover:bg-slate-900/80 cursor-pointer transition-colors flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <MapPin className="w-4 h-4 text-slate-500 group-hover:text-green-400" />
                                                    <div className="text-sm truncate max-w-[200px]">
                                                        {editLocation?.name || t('profile_set_location')}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-green-400">{t('profile_change_location')}</div>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex gap-3">
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={saving}
                                                className="flex-1 bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : tGlobal('save_changes')}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    trackAuthEvent('logout');
                                                    logout();
                                                    setIsProfileOpen(false);
                                                }}
                                                className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-lg border border-red-500/20 transition-colors"
                                            >
                                                {tAuth('logout')}
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
                            onSelect={(lat, lng, name, method) => {
                                setEditLocation({ lat, lng, name });
                                setIsLocationSelectorOpen(false);
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
                                    <div className="text-sm font-medium text-white group-hover:text-green-300 transition-colors">{tAuth('sign_in')}</div>
                                    <div className="text-xs text-slate-500 group-hover:text-green-400/70">{tAuth('access_account')}</div>
                                </div>
                            </div>
                        </div>
                    </Link>
                )}
            </div>
        </div>
    );
}
