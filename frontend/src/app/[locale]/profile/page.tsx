'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTranslations } from 'next-intl';
import { Loader2, MapPin, Save, UserCircle, Briefcase, Phone, Mail, CheckCircle2, Pencil, X } from 'lucide-react';
import { API_BASE_URL } from '@/lib/constants';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const LocationSelector = dynamic(() => import('@/components/LocationSelector'), { ssr: false });

export default function ProfilePage() {
    const t = useTranslations('Global');
    const tAuth = useTranslations('Auth');
    const { user, token, updateUser } = useAuth();

    // Display States
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [role, setRole] = useState('');
    const [location, setLocation] = useState<{ lat: number, lng: number, name: string } | null>(null);

    // Edit Mode States
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingPhone, setIsEditingPhone] = useState(false);

    // Temporary Values for Edit Mode
    const [tempName, setTempName] = useState('');
    const [tempPhone, setTempPhone] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (user) {
            setFullName(user.full_name || '');
            setTempName(user.full_name || '');

            setPhoneNumber(user.phone_number || '');
            setTempPhone(user.phone_number || '');

            setRole(user.role || 'farmer');

            if (user.latitude && user.longitude) {
                setLocation({
                    lat: user.latitude,
                    lng: user.longitude,
                    name: user.location_name || 'Selected Location'
                });
            }
        }
    }, [user]);

    // Generic Field Saver
    const saveField = async (field: string, value: any, onSuccess?: () => void) => {
        setIsSaving(true);
        setMessage(null);

        try {
            const payload = { [field]: value };

            const res = await fetch(`${API_BASE_URL}/auth/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                // If it's a validation error from FastAPI, it might be in data.detail
                throw new Error(data.detail || 'Failed to update profile');
            }

            updateUser(data);
            setMessage({ type: 'success', text: `${field.replace('_', ' ')} updated successfully!` });
            if (onSuccess) onSuccess();

        } catch (err: any) {
            console.error(err);
            setMessage({ type: 'error', text: err.message || 'Failed to update. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    // Specific Handlers
    const handleSaveName = () => {
        if (!tempName.trim()) {
            setMessage({ type: 'error', text: 'Name cannot be empty' });
            return;
        }
        saveField('full_name', tempName, () => {
            setFullName(tempName);
            setIsEditingName(false);
        });
    };

    const handleSavePhone = () => {
        // Basic Length Check
        const cleanPhone = tempPhone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
            setMessage({ type: 'error', text: 'Please enter a valid phone number (at least 10 digits)' });
            return;
        }

        saveField('phone_number', tempPhone, () => {
            setPhoneNumber(tempPhone);
            setIsEditingPhone(false);
        });
    };

    const handleSaveRole = (newRole: string) => {
        setRole(newRole);
        saveField('role', newRole);
    };

    const handleLocationSelect = (lat: number, lng: number, name: string) => {
        setLocation({ lat, lng, name });
        setIsLocationSelectorOpen(false);

        // Auto-save location upon selection
        setIsSaving(true);
        setMessage(null);
        fetch(`${API_BASE_URL}/auth/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                latitude: lat,
                longitude: lng,
                location_name: name
            })
        }).then(async (res) => {
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to update location');
            }
            const data = await res.json();
            updateUser(data);
            setMessage({ type: 'success', text: 'Location updated successfully!' });
        }).catch(err => {
            setMessage({ type: 'error', text: err.message || 'Failed to update location.' });
        }).finally(() => {
            setIsSaving(false);
        });
    };

    if (!user) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your personal information and preferences.</p>
                </div>
                {message && (
                    <div className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2",
                        message.type === 'success' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                        {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        {message.text}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Avatar & Basic Info */}
                <div className="col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-4xl font-bold text-white shadow-lg mb-4">
                            {user.full_name?.charAt(0) || 'U'}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user.full_name}</h2>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 mt-2">
                            {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Farmer'}
                        </span>
                        <div className="mt-6 w-full space-y-3">
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <Mail className="w-4 h-4" />
                                <span className="truncate">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <Phone className="w-4 h-4" />
                                <span>{user.phone_number || 'No phone added'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <MapPin className="w-4 h-4" />
                                <span className="truncate">{user.location_name || 'No location set'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Edit Form */}
                <div className="col-span-1 md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">

                        {/* Personal Details Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <UserCircle className="w-5 h-5 text-emerald-500" />
                                Personal Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name Field */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                    {isEditingName ? (
                                        <div className="flex gap-2">
                                            <input
                                                value={tempName}
                                                onChange={(e) => setTempName(e.target.value)}
                                                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                                autoFocus
                                            />
                                            <button
                                                onClick={handleSaveName}
                                                disabled={isSaving}
                                                className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                <Save className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => { setIsEditingName(false); setTempName(fullName); }}
                                                className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg group">
                                            <span className="text-gray-900 dark:text-white font-medium">{fullName}</span>
                                            <button
                                                onClick={() => setIsEditingName(true)}
                                                className="text-gray-400 hover:text-emerald-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 p-1"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Phone Field */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                                    {isEditingPhone ? (
                                        <div className="flex gap-2">
                                            <input
                                                value={tempPhone}
                                                onChange={(e) => setTempPhone(e.target.value)}
                                                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                                autoFocus
                                            />
                                            <button
                                                onClick={handleSavePhone}
                                                disabled={isSaving}
                                                className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                <Save className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => { setIsEditingPhone(false); setTempPhone(phoneNumber); }}
                                                className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg group">
                                            <span className="text-gray-900 dark:text-white font-medium">{phoneNumber || 'Not set'}</span>
                                            <button
                                                onClick={() => setIsEditingPhone(true)}
                                                className="text-gray-400 hover:text-emerald-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 p-1"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Role Section (Auto-saves on change) */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-emerald-500" />
                                Professional Role (Your Needs)
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Select the role that best defines your primary activity on Agri-OS.</p>
                            <div className="space-y-2">
                                <label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300">I am a...</label>
                                <div className="relative">
                                    <select
                                        id="role"
                                        value={role}
                                        onChange={(e) => handleSaveRole(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600"
                                    >
                                        <option value="farmer">Farmer (I want to manage my farm & sell produce)</option>
                                        <option value="expert">Expert (I want to provide advice & diagnosis)</option>
                                        <option value="buyer">Buyer (I want to purchase crops directly)</option>
                                        <option value="logistics">Logistics Provider (I offer transport & storage)</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-emerald-500" />
                                Location
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Your location helps us provide localized weather and market data.</p>

                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                        {location ? location.name : 'No location selected'}
                                    </div>
                                    {location && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsLocationSelectorOpen(true)}
                                    className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shrink-0"
                                >
                                    {location ? 'Change Location' : 'Set Location'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <LocationSelector
                isOpen={isLocationSelectorOpen}
                onClose={() => setIsLocationSelectorOpen(false)}
                onSelect={(lat, lng, name, method) => handleLocationSelect(lat, lng, name)}
            />
        </div>
    );
}
