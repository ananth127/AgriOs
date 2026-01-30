'use client';

import { useState, useEffect } from 'react';
import { Link, usePathname } from '@/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Sprout, Tractor, ShoppingBag, ScrollText, Users, Camera, Calculator, LogOut, LogIn, X, MapPin, Briefcase, Loader2, Stethoscope, Activity, BookOpen, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { syncData } from '@/db/sync';
import { API_BASE_URL } from '@/lib/constants';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { trackSidebarClick, trackAuthEvent } from '@/lib/analytics';
import { useConnectionHealth } from '@/hooks/useConnectionHealth';

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
    const [editSurveyNumber, setEditSurveyNumber] = useState(user?.survey_number || '');
    const [editBoundary, setEditBoundary] = useState<[number, number][] | undefined>(user?.boundary);
    const [fetchingBoundary, setFetchingBoundary] = useState(false);

    // Connection States from Hook
    const { isOnline, frontendSignalStrength, isBackendHealthy, backendSignalStrength, connectionWarning } = useConnectionHealth();

    // Sync state when user loads or modal opens (moved up for clarity)
    useEffect(() => {
        if (user) {
            setEditRole(user.role);
            setEditSurveyNumber(user.survey_number || '');
            setEditBoundary(user.boundary);
            if (user.location_name && user.latitude && user.longitude) {
                setEditLocation({
                    name: user.location_name,
                    lat: user.latitude,
                    lng: user.longitude
                });
            }
        }
    }, [user, isProfileOpen]);





    const handleFetchBoundary = async () => {
        setFetchingBoundary(true);
        // Simulate API call
        setTimeout(() => {
            if (editLocation) {
                const centerLat = editLocation.lat;
                const centerLng = editLocation.lng;
                const mockBoundary: [number, number][] = [
                    [centerLat - 0.001, centerLng - 0.001],
                    [centerLat + 0.001, centerLng - 0.001],
                    [centerLat + 0.001, centerLng + 0.001],
                    [centerLat - 0.001, centerLng + 0.001],
                ];
                setEditBoundary(mockBoundary);
                alert(tGlobal('boundary_found', { no: editSurveyNumber }));
            } else {
                alert(tGlobal('set_location_first'));
            }
            setFetchingBoundary(false);
        }, 1500);
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const payload = {
                role: editRole,
                ...(editLocation && {
                    latitude: editLocation.lat,
                    longitude: editLocation.lng,
                    location_name: editLocation.name
                }),
                survey_number: editSurveyNumber,
                boundary: editBoundary
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
            alert(tGlobal('error_save_profile'));
        } finally {
            setSaving(false);
        }
    };

    const links = [
        { href: '/', label: t('menu_overview'), icon: LayoutDashboard },
        { href: '/farms', label: t('menu_my_farms'), icon: Tractor },
        { href: '/crops', label: t('menu_crops_registry'), icon: Sprout },
        { href: '/farm-management', label: t('menu_management'), icon: Briefcase },
        { href: '/crop-doctor', label: t('menu_crop_doctor'), icon: Stethoscope },
        { href: '/library', label: t('menu_library'), icon: BookOpen },
        { href: '/livestock', label: t('menu_livestock'), icon: Users },
        { href: '/supply-chain', label: t('menu_track_trace'), icon: ScrollText },
        { href: '/marketplace', label: t('menu_marketplace'), icon: ShoppingBag },
        { href: '/drone', label: t('menu_drone_ai'), icon: Camera },
        { href: '/calculator', label: t('menu_calculator'), icon: Calculator },
        { href: '/docs', label: t('menu_docs'), icon: Users },
    ];

    return (
        <div className="w-64 xl:w-72 shrink-0 bg-slate-950/80 backdrop-blur-xl border-r border-white/5 flex-col hidden md:flex h-full shadow-2xl relative z-40">
            <div className="p-8 pb-6">
                <div className="flex items-center gap-3">
                    <div className="text-3xl font-extrabold bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 bg-clip-text text-transparent tracking-tight">
                        {tGlobal('app_name')}
                    </div>
                    {/* Status Indicators */}
                    {/* Status Indicators */}
                    <div className="flex flex-col justify-center gap-[2px] ml-2 mb-1">
                        {/* Frontend Status */}
                        <div className="flex items-center gap-1.5" title={`${tGlobal('frontend')}: ${isOnline ? tGlobal('online') : tGlobal('offline')} (${frontendSignalStrength}/5)`}>
                            <span className="text-[9px] font-bold text-slate-500 w-3 text-right">F</span>
                            <div className={cn("w-1.5 h-1.5 rounded-full transition-colors", isOnline ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]")} />
                            {/* Bars */}
                            <div className="flex items-end gap-[1px] h-2">
                                {[1, 2, 3, 4, 5].map(bar => (
                                    <div key={`f-${bar}`} className={cn("w-[2px] rounded-[1px] transition-all", frontendSignalStrength >= bar ? "bg-green-500" : "bg-slate-800")} style={{ height: `${bar * 20}%` }} />
                                ))}
                            </div>
                        </div>

                        {/* Backend Status */}
                        <div className="flex items-center gap-1.5" title={`${tGlobal('backend')}: ${isBackendHealthy ? tGlobal('online') : tGlobal('offline')} (${backendSignalStrength}/5)`}>
                            <span className="text-[9px] font-bold text-slate-500 w-3 text-right">B</span>
                            <div className={cn("w-1.5 h-1.5 rounded-full transition-colors", isBackendHealthy ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]")} />
                            {/* Bars */}
                            <div className="flex items-end gap-[1px] h-2">
                                {[1, 2, 3, 4, 5].map(bar => (
                                    <div key={`b-${bar}`} className={cn("w-[2px] rounded-[1px] transition-all", backendSignalStrength >= bar ? "bg-green-500" : "bg-slate-800")} style={{ height: `${bar * 20}%` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Sync Button */}
                    <button
                        onClick={async () => {
                            try {
                                const btn = document.getElementById('sync-btn-icon');
                                if (btn) btn.classList.add('animate-spin');
                                await syncData();
                                setTimeout(() => alert("Sync Complete!"), 500);
                            } catch (e) {
                                console.error(e);
                                alert("Sync Failed");
                            } finally {
                                const btn = document.getElementById('sync-btn-icon');
                                if (btn) btn.classList.remove('animate-spin');
                            }
                        }}
                        className="ml-auto p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                        title="Sync Data"
                    >
                        <RefreshCw id="sync-btn-icon" className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-xs font-medium text-slate-500 mt-1.5 uppercase tracking-widest pl-0.5">{tGlobal('app_tagline')}</p>
            </div>

            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                {links.map((link) => {
                    const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);

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

            {/* Connection Warning Toast */}
            {
                connectionWarning && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[90%] bg-red-500/90 text-white text-[10px] font-medium px-3 py-2 rounded-lg shadow-xl backdrop-blur-md z-50 text-center animate-in fade-in slide-in-from-top-2 border border-red-400/50">
                        {connectionWarning}
                    </div>
                )
            }

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
                                                    <option value="farmer">{t('role_farmer')}</option>
                                                    <option value="agri_officer">{t('role_officer')}</option>
                                                    <option value="broker">{t('role_broker')}</option>
                                                    <option value="buyer">{t('role_buyer')}</option>
                                                    <option value="logistics">{t('role_logistics')}</option>
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

                                        {/* Survey Number / Patta */}
                                        <div className="p-3 bg-slate-950/50 border border-white/5 rounded-lg">
                                            <label className="block text-xs font-medium text-slate-400 mb-2">{t('govt_record_label')}</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="flex-1 bg-slate-950 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-green-500/50 focus:outline-none"
                                                    placeholder={t('survey_no_placeholder')}
                                                    value={editSurveyNumber}
                                                    onChange={(e) => setEditSurveyNumber(e.target.value)}
                                                />
                                                <button
                                                    onClick={handleFetchBoundary}
                                                    type="button" // Important to prevent form submit if inside form
                                                    disabled={!editSurveyNumber || fetchingBoundary}
                                                    className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 text-xs font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    {fetchingBoundary ? <Loader2 className="w-3 h-3 animate-spin" /> : t('fetch_btn')}
                                                </button>
                                            </div>
                                            {editBoundary && editBoundary.length > 0 && (
                                                <div className="mt-2 text-[10px] text-green-500 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                    {t('boundary_loaded')}
                                                </div>
                                            )}
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
        </div >
    );
}
