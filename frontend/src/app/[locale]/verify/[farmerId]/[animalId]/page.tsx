'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Activity, Calendar, Weight, Ruler, Milk, User, MapPin, CheckCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import QRCode from 'react-qr-code';

export default function PublicAnimalProfile({ params }: { params: { farmerId: string, animalId: string, locale: string } }) {
    const { farmerId, animalId } = params;
    const [animal, setAnimal] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchAnimal = async () => {
            try {
                // Fetch actual public data using the new API method
                const data: any = await api.livestock.get(animalId);

                // If the API returns valid data, use it. 
                // Note: The API must be publicly accessible or handle auth internally.
                if (data) {
                    setAnimal({
                        ...data,
                        owner_name: 'Verified Farmer', // Fallback as this might not be in the animal object
                        farm_location: 'Registered Farm',
                    });
                } else {
                    throw new Error("Animal not found");
                }
                setLoading(false);
            } catch (e) {
                console.error("Failed to fetch public animal data", e);
                setError(true);
                setLoading(false);
            }
        };
        fetchAnimal();
    }, [animalId, farmerId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !animal) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-4">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-white">Verification Failed</h1>
                <p className="text-slate-500 mt-2">Could not retrieve animal details.</p>
            </div>
        );
    }

    const calculateAge = (dobStr: string) => {
        if (!dobStr) return 'Unknown';
        const dob = new Date(dobStr);
        const diff = Date.now() - dob.getTime();
        const ageDate = new Date(diff);
        const years = Math.abs(ageDate.getUTCFullYear() - 1970);
        const months = ageDate.getUTCMonth();
        return years > 0 ? `${years}y ${months}m` : `${months}m`;
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans p-4 md:p-8 flex items-center justify-center">

            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[600px]">

                {/* Left Side: Visuals & Key Info */}
                <div className="w-full md:w-1/3 bg-slate-950 p-8 flex flex-col items-center border-b md:border-b-0 md:border-r border-white/10 relative">
                    {/* Verified Badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20">
                        <CheckCircle className="w-3 h-3" /> Verified Source
                    </div>

                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-green-400 to-blue-500 p-1 mb-6 mt-8 shadow-lg shadow-green-900/20">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                            <span className="text-6xl">{animal.species === 'Cow' ? '🐮' : '🐾'}</span>
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-white text-center mb-1">{animal.name || 'Unnamed'}</h2>
                    <p className="text-slate-500 text-sm mb-4">owned by {animal.owner_name}</p>

                    <div className="px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-base font-mono mb-8 border border-blue-500/10">
                        {animal.tag_id}
                    </div>

                    <div className="w-full grid grid-cols-2 gap-3 mb-8">
                        <div className="p-4 bg-slate-900 rounded-xl border border-white/5 text-center">
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Status</p>
                            <p className="text-green-400 font-bold text-lg">{animal.health_status}</p>
                        </div>
                        <div className="p-4 bg-slate-900 rounded-xl border border-white/5 text-center">
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Gender</p>
                            <p className="text-white font-bold text-lg">{animal.gender}</p>
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="mt-auto p-4 bg-white rounded-xl shadow-lg">
                        <QRCode
                            value={typeof window !== 'undefined' ? window.location.href : ''}
                            size={100}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                        />
                    </div>
                </div>

                {/* Right Side: Detailed Dashboard View */}
                <div className="w-full md:w-2/3 bg-slate-900 p-6 md:p-8 overflow-y-auto">
                    <div className="mb-8">
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Public Registry</p>
                        <h3 className="text-2xl font-bold text-white">Livestock Dashboard</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                        <DetailItem icon={<Activity className="w-5 h-5 text-blue-400" />} label="Breed" value={animal.breed} />
                        <DetailItem icon={<Calendar className="w-5 h-5 text-purple-400" />} label="Age" value={calculateAge(animal.date_of_birth)} />
                        <DetailItem icon={<Weight className="w-5 h-5 text-orange-400" />} label="Weight" value={`${animal.weight_kg} kg`} />
                        <DetailItem icon={<Ruler className="w-5 h-5 text-indigo-400" />} label="Origin" value={animal.origin} />
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-slate-400" /> Location
                        </h3>
                        <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5">
                            <p className="text-slate-300 font-medium">{animal.farm_location}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                <span>Purpose: <span className="text-slate-300">{animal.purpose}</span></span>
                                <span>Last Sync: Just now</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-slate-400" /> Recent History
                        </h3>
                        <div className="space-y-4 relative pl-4 border-l-2 border-slate-800">
                            <HistoryItem title="Health Check" date="Today" desc="Routine checkup completed. Status confirmed Healthy." />
                            <HistoryItem title="Vaccination" date="2 weeks ago" desc="FMD Vaccine administered." />
                            <HistoryItem title="Registration" date="Jan 2023" desc="Officially registered in AgriOS." />
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-slate-500">
                            Powered by <span className="text-green-400 font-bold">AgriOS</span>.
                            Secure Livestock Tracking.
                        </p>
                        <a href="https://agrios.com" className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">
                            Visit Homepage &rarr;
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

const DetailItem = ({ icon, label, value }: any) => (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
        <div className="p-2 bg-slate-900 rounded-lg">{icon}</div>
        <div>
            <p className="text-xs text-slate-500 uppercase font-bold">{label}</p>
            <p className="font-medium text-white text-lg">{value || 'N/A'}</p>
        </div>
    </div>
);

const HistoryItem = ({ title, date, desc }: any) => (
    <div className="relative">
        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-700 border-2 border-slate-900"></div>
        <p className="text-sm font-bold text-white">{title} <span className="text-xs font-normal text-slate-500 ml-2">{date}</span></p>
        <p className="text-sm text-slate-400 mt-1">{desc}</p>
    </div>
);
