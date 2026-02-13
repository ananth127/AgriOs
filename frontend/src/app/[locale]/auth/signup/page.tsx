
'use client';

import { useState } from 'react';
import { useRouter } from '@/navigation';
import { Card } from '@/components/ui/Card';
import { User, Lock, Mail, Loader2, Sprout, Briefcase, MapPin, Search, Phone } from 'lucide-react';
import { Link } from '@/navigation';
import { API_BASE_URL } from '@/lib/constants';
import { trackAuthEvent, trackUserAction } from '@/lib/analytics';
import dynamic from 'next/dynamic';

const LocationSelector = dynamic(() => import('@/components/LocationSelector'), { ssr: false });

import PublicHeader from '@/components/PublicHeader';

export default function SignupPage({ params: { locale } }: { params: { locale: string } }) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('farmer');

    // Location State
    const [location, setLocation] = useState<{ lat: number, lng: number, name: string, method?: string } | null>(null);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const roles = [
        { id: 'farmer', label: 'Farmer' },
        { id: 'agri_officer', label: 'Agri Officer' },
        { id: 'broker', label: 'Broker' },
        { id: 'buyer', label: 'Buyer' },
        { id: 'logistics', label: 'Logistics' },
    ];

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validate Mobile Number
        const mobileRegex = /^[6-9]\d{9}$/;
        if (!mobileRegex.test(phoneNumber)) {
            setError('Invalid number');
            setLoading(false);
            return;
        }

        // Validate Frequency (Max 4 occurrences per digit)
        for (let i = 0; i <= 9; i++) {
            const digit = i.toString();
            const count = phoneNumber.split(digit).length - 1;
            if (count > 4) {
                setError('Invalid number');
                trackUserAction('signup_error', 'Form Error', { error: 'Invalid number pattern' });
                setLoading(false);
                return;
            }
        }

        // Validate Location
        if (!location) {
            setError('Please select your farming location from the map.');
            setLoading(false);
            trackUserAction('signup_error', 'Form Error', { error: 'Location missing' });
            return;
        }

        trackUserAction('attempt_signup', 'Form Submission', {
            role,
            has_location: !!location,
            has_name: !!fullName,
            phone_length: phoneNumber.length
        });

        try {
            // Auto-generate email from phone number
            const generatedEmail = `${phoneNumber}@agri.com`;

            const payload = {
                email: generatedEmail,
                phone_number: phoneNumber,
                password,
                full_name: fullName,
                role,
                ...(location && {
                    latitude: location.lat,
                    longitude: location.lng,
                    location_name: location.name
                })
            };

            const res = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Registration failed');
            }

            // On success, redirect to login
            trackAuthEvent('signup', role);
            if (location) {
                trackUserAction('set_location_signup', 'User Profile', { location_name: location.name });
            }
            router.push('/auth/login');

        } catch (err: any) {
            setError(err.message);
            trackUserAction('signup_error', 'API Error', { message: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 pt-24 relative overflow-hidden">
            <PublicHeader locale={locale} />
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
            </div>

            <Card className="w-full max-w-md p-8 border-white/10 bg-slate-900/50 backdrop-blur-xl z-10 my-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                        Create Account
                    </h1>
                    <p className="text-slate-400 mt-2">Join the Agri-OS ecosystem</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                onBlur={() => trackUserAction('input_complete', 'Form Interaction', { field: 'fullName', value: fullName })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-green-500/50 transition-colors"
                                placeholder="Your Name"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Mobile Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="tel"
                                required
                                value={phoneNumber}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 10) setPhoneNumber(val);
                                }}
                                onBlur={() => trackUserAction('input_complete', 'Form Interaction', { field: 'phoneNumber', value: phoneNumber, valid: phoneNumber.length === 10 })}
                                className={`w-full bg-slate-950/50 border rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none transition-colors ${phoneNumber.length === 0 || (phoneNumber.length === 10 && /^[6-9]/.test(phoneNumber))
                                    ? 'border-green-500/50 focus:border-green-500' // Green if empty or valid length & prefix
                                    : 'border-red-500/50 focus:border-red-500'     // Red otherwise (while typing or invalid)
                                    }`}
                                placeholder="9876543210"
                            />
                        </div>
                        {/* Validation Message */}
                        {phoneNumber.length > 0 && phoneNumber.length < 10 && (
                            <p className="text-xs text-red-400">Number should be 10 digits</p>
                        )}
                        {phoneNumber.length === 10 && !/^[6-9]/.test(phoneNumber) && (
                            <p className="text-xs text-red-400">Invalid number</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={() => trackUserAction('input_complete', 'Form Interaction', { field: 'password', length: password.length, value: '[REDACTED]' })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-green-500/50 transition-colors"
                                placeholder="Create a password"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Role</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <select
                                value={role}
                                onChange={(e) => {
                                    setRole(e.target.value);
                                    trackUserAction('role_change', 'Form Interaction', { role: e.target.value });
                                }}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white appearance-none focus:outline-none focus:border-green-500/50 transition-colors cursor-pointer"
                            >
                                {roles.map(r => (
                                    <option key={r.id} value={r.id} className="bg-slate-900">{r.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Farming Location <span className="text-red-400">*</span></label>

                        {/* Selector Trigger */}
                        <div
                            onClick={() => {
                                setIsLocationModalOpen(true);
                                trackUserAction('open_location_modal', 'Form Interaction');
                            }}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-3 px-4 text-white hover:bg-slate-900/80 cursor-pointer transition-colors flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                                    <MapPin className="w-4 h-4 text-green-400" />
                                </div>
                                <div className="text-sm">
                                    {location ? (
                                        <span className="font-medium text-green-400">{location.name}</span>
                                    ) : (
                                        <span className="text-slate-500">Choose Farming Location...</span>
                                    )}
                                </div>
                            </div>
                            <Search className="w-4 h-4 text-slate-500 group-hover:text-white" />
                        </div>

                        {/* Modal */}
                        <LocationSelector
                            isOpen={isLocationModalOpen}
                            onClose={() => setIsLocationModalOpen(false)}
                            onSelect={(lat, lng, name, method) => {
                                setLocation({ lat, lng, name, method });
                                trackUserAction('select_location_signup', 'Form Interaction', { method, name });
                            }}
                            simpleMode={true}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-medium py-2.5 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-400">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-green-400 hover:text-green-300 font-medium">
                        Sign in
                    </Link>
                </div>
            </Card>

            <div className="z-10 mt-8 text-slate-500 text-sm">
                Powered by <span className="text-slate-400 font-semibold">Agri-Stack</span>
            </div>
        </main>
    );
}
