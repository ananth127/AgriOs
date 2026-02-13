'use client';

import { Link } from '@/navigation';
import React, { useRef, useState } from 'react';
import {
    ArrowRight, Lock, LayoutDashboard, Tractor, ShoppingBag, Sprout, Activity,
    Calculator, BookOpen, Plane, ScanBarcode, Menu, Bell, User, Search, Map, X
} from 'lucide-react';


type FeatureInfo = {
    title: string;
    description: string;
    icon: React.ReactNode;
    features: string[];
    color: string;
    mockType: 'list' | 'dashboard' | 'map' | 'scan' | 'grid';
    // New fields for specific mock data
    mockData?: {
        items?: { title: string; subtitle: string; status?: string }[];
        stats?: { label: string; value: string; trend?: string }[];
        gridItems?: { name: string; price: string }[];
    }
};

const FEATURES: Record<string, FeatureInfo> = {
    '/livestock': {
        title: 'Livestock Management',
        description: 'Track the health, breeding cycles, and production history of your cattle, goats, and poultry.',
        icon: <Activity className="w-8 h-8" />,
        features: ['Individual Records', 'Milk Logs', 'Vaccination Schedule', 'Breeding Calendar'],
        color: 'text-pink-500',
        mockType: 'list',
        mockData: {
            items: [
                { title: 'Bella (Cow)', subtitle: 'Healthy • 350kg', status: 'Lactating' },
                { title: 'Goat Herd A', subtitle: '15 Animals', status: 'Grazing' },
                { title: 'Chicken Coop', subtitle: 'Egg Collection due', status: 'Action' }
            ]
        }
    },
    '/farm-management': {
        title: 'Farm Operations',
        description: 'Digitize your entire farm. Manage labor, inventory, and machinery in one place.',
        icon: <Tractor className="w-8 h-8" />,
        features: ['Labor & Wages', 'Inventory Mgmt', 'Machinery Tracking', 'Financial Ledger'],
        color: 'text-blue-500',
        mockType: 'dashboard',
        mockData: {
            stats: [
                { label: 'Total Expense', value: '₹ 12,400', trend: '-2%' },
                { label: 'Labor Count', value: '8 Workers', trend: 'Active' }
            ]
        }
    },
    '/marketplace': {
        title: 'Agri-OS Marketplace',
        description: 'Directly connect with buyers to sell your produce at better prices.',
        icon: <ShoppingBag className="w-8 h-8" />,
        features: ['Sell Harvest', 'Buy Inputs', 'Rent Tractors', 'Price Trends'],
        color: 'text-purple-500',
        mockType: 'grid',
        mockData: {
            gridItems: [
                { name: 'Wheat Seeds', price: '₹ 800/kg' },
                { name: 'Tractor Rent', price: '₹ 1200/hr' },
                { name: 'Urea Fert.', price: '₹ 250/bag' },
                { name: 'Sprayer', price: '₹ 4500' }
            ]
        }
    },
    '/crop-doctor': {
        title: 'AI Crop Doctor',
        description: 'Diagnose crop diseases instantly using just your phone camera.',
        icon: <Sprout className="w-8 h-8" />,
        features: ['Instant Diagnosis', 'Treatment Plans', 'Disease Library', 'Expert Connection'],
        color: 'text-green-500',
        mockType: 'scan'
    },
    '/crops': {
        title: 'Crop Registry',
        description: 'Monitor your crops from sowing to harvest. Get daily tasks and alerts.',
        icon: <Sprout className="w-8 h-8" />,
        features: ['Sowing Schedules', 'Irrigation Alerts', 'Growth Tracking', 'Harvest Estimations'],
        color: 'text-emerald-500',
        mockType: 'list',
        mockData: {
            items: [
                { title: 'Wheat (Field A)', subtitle: 'Vegetative Stage • Day 45', status: 'Good' },
                { title: 'Tomatoes', subtitle: 'Flowering • Needs Water', status: 'Alert' },
                { title: 'Cotton', subtitle: 'Sowing Planned', status: 'Pending' }
            ]
        }
    },
    '/calculator': {
        title: 'ROI Calculator',
        description: 'Plan your season before you plant. Estimate costs and profits.',
        icon: <Calculator className="w-8 h-8" />,
        features: ['Profit Estimation', 'Cost Breakdown', 'Yield Prediction', 'Market Rates'],
        color: 'text-orange-500',
        mockType: 'dashboard',
        mockData: {
            stats: [
                { label: 'Est. Revenue', value: '₹ 85,000', trend: '+15%' },
                { label: 'Input Cost', value: '₹ 32,000', trend: 'Seeds' }
            ]
        }
    },
    '/library': {
        title: 'Disease Library',
        description: 'Access a comprehensive library of plant diseases and treatments.',
        icon: <BookOpen className="w-8 h-8" />,
        features: ['Visual ID', 'Organic Remedies', 'Chemical Controls', 'Prevention Tips'],
        color: 'text-cyan-500',
        mockType: 'list',
        mockData: {
            items: [
                { title: 'Leaf Curl', subtitle: 'Viral • High Risk', status: 'Critical' },
                { title: 'Early Blight', subtitle: 'Fungal • Treatable', status: 'Info' },
                { title: 'Aphids', subtitle: 'Pest • Common', status: 'Info' }
            ]
        }
    },
    '/drone': {
        title: 'Drone Monitoring',
        description: 'Get a bird\'s eye view of your farm. Analyze satellite health maps.',
        icon: <Plane className="w-8 h-8" />,
        features: ['NDVI Health Maps', 'Moisture Analysis', 'Precision Spraying', 'Field Mapping'],
        color: 'text-indigo-500',
        mockType: 'map'
    },
    '/supply-chain': {
        title: 'Track & Trace',
        description: 'Create a digital passport for your produce with blockchain.',
        icon: <ScanBarcode className="w-8 h-8" />,
        features: ['QR Generation', 'Origin Verification', 'Logistics Tracking', 'Trust Badge'],
        color: 'text-slate-300',
        mockType: 'scan'
    },
    '/community': {
        title: 'Farmer Community',
        description: 'Connect with expert farmers. Ask questions, share success stories, and solve problems together.',
        icon: <User className="w-8 h-8" />,
        features: ['Expert Q&A', 'Local Groups', 'Success Stories', 'Agri-News'],
        color: 'text-yellow-500',
        mockType: 'list',
        mockData: {
            items: [
                { title: 'Best fertilizer for cotton?', subtitle: 'Asked by Raju • 23 replies', status: 'Hot' },
                { title: 'Tomato price drop today', subtitle: 'Market News • 2h ago', status: 'New' },
                { title: 'Organic vs Chemical', subtitle: 'General Discussion', status: 'Active' }
            ]
        }
    },
    'default': {
        title: 'Smart Dashboard',
        description: 'Your central command center for modern farming.',
        icon: <LayoutDashboard className="w-8 h-8" />,
        features: ['Weather Forecast', 'Market Ticker', 'Task Reminders', 'Farm Overview'],
        color: 'text-orange-500',
        mockType: 'dashboard',
        mockData: {
            stats: [
                { label: 'Profit', value: '₹ 24,500', trend: '+12%' },
                { label: 'Active Crops', value: '3 Fields', trend: 'Healthy' }
            ]
        }
    }
};

import PublicHeader from '@/components/PublicHeader';
import { useParams } from 'next/navigation';

export default function AppPreview({ pathname }: { pathname: string }) {
    const matchedKey = Object.keys(FEATURES).find(key => key !== 'default' && pathname.includes(key));
    const content = matchedKey ? FEATURES[matchedKey] : FEATURES['default'];
    const params = useParams();

    return (
        <div id="scrolling-container" className="w-full h-full bg-slate-950 text-white selection:bg-green-500/30 font-sans flex flex-col overflow-x-hidden overflow-y-auto">
            {/* Navbar */}
            <PublicHeader locale={params.locale as string} />

            <main className="flex-1 flex flex-col lg:flex-row lg:items-start items-center justify-center pt-20 md:pt-24 pb-12 px-6 md:px-12 gap-12 md:gap-24 w-full max-w-7xl mx-auto">

                {/* Left: Text Content - Top on Mobile, Left on Desktop */}
                <div className="flex-1 space-y-6 md:space-y-8 text-center lg:text-left order-1 lg:mt-12 max-w-xl">
                    <div className="space-y-4 md:space-y-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-white/10 text-xs font-semibold ${content.color} mx-auto lg:mx-0`}>
                            <Lock className="w-3 h-3" />
                            Protected Feature
                        </div>

                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
                            {content.title}
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                            {content.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-lg mx-auto lg:mx-0">
                        {content.features.map((feat, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-white/5">
                                <div className={`w-8 h-8 min-w-[2rem] rounded-full ${content.color.replace('text-', 'bg-')}/10 flex items-center justify-center ${content.color}`}>
                                    <Activity className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-slate-200 text-sm">{feat}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                        <Link href="/auth/signup" className={`px-8 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-xl text-lg hover:shadow-lg hover:shadow-green-500/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2`}>
                            Create Account <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link href="/#features" className="px-8 py-3.5 bg-slate-800 text-white font-semibold rounded-xl text-lg hover:bg-slate-700 transition-colors flex items-center justify-center border border-white/5">
                            View Features
                        </Link>
                    </div>
                </div>

                {/* Right: Dynamic UI Mockup - Bottom on Mobile, Right on Desktop */}
                <div className="flex-1 w-full flex justify-center lg:justify-start order-2 mt-8 lg:mt-0">
                    <MockAppScreen content={content} />
                </div>
            </main>
        </div>
    );
}

function MockAppScreen({ content }: { content: FeatureInfo }) {
    return (
        <div className="relative w-full max-w-[320px] md:max-w-sm mx-auto lg:mx-0 transform hover:scale-[1.02] transition-transform duration-500 ease-out">
            {/* Phone Bezel */}
            <div className="relative bg-slate-950 border-[8px] border-slate-800 rounded-[2.5rem] shadow-2xl shadow-black overflow-hidden aspect-[9/19]">

                {/* Status Bar */}
                <div className="absolute top-0 w-full h-8 bg-black z-20 flex justify-between items-center px-6">
                    <div className="text-[10px] font-medium text-white">9:41</div>
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 bg-white/20 rounded-full"></div>
                        <div className="w-3 h-3 bg-white/20 rounded-full"></div>
                    </div>
                </div>

                {/* Dynamic App Content */}
                <div className="w-full h-full bg-slate-900 pt-10 pb-20 overflow-hidden flex flex-col relative group">

                    {/* Header */}
                    <div className="px-5 pb-4 flex justify-between items-center border-b border-white/5">
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Agri-OS</p>
                            <h3 className="text-lg font-bold text-white leading-tight">{content.title.split(' ')[0]}</h3>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 ring-1 ring-white/10">
                            <Bell className="w-4 h-4" />
                        </div>
                    </div>

                    {content.mockType === 'dashboard' && content.mockData?.stats && (
                        <div className="p-5 space-y-4">
                            <div className={`p-4 rounded-2xl bg-gradient-to-br ${content.color.replace('text-', 'from-')}/20 to-slate-800 border border-white/10`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`p-2 rounded-lg ${content.color.replace('text-', 'bg-')}/20 ${content.color}`}>{content.icon}</div>
                                    <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-white">{content.mockData.stats[0].trend}</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{content.mockData.stats[0].value}</div>
                                <div className="text-xs text-slate-400">{content.mockData.stats[0].label}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {content.mockData.stats.slice(1).map((stat, i) => (
                                    <div key={i} className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                                        <div className="text-[10px] text-slate-500 mb-1">{stat.label}</div>
                                        <div className="text-white font-bold text-sm truncate">{stat.value}</div>
                                    </div>
                                ))}
                                {/* Dummy Extra */}
                                <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 flex items-center justify-center text-slate-600">
                                    <span className="text-xl">+</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {content.mockType === 'list' && content.mockData?.items && (
                        <div className="p-4 space-y-3">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Recent Items</div>
                            {content.mockData.items.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-white/5">
                                    <div className={`w-10 h-10 rounded-lg ${content.color.replace('text-', 'bg-')}/10 flex items-center justify-center`}>
                                        <span className={`text-xs font-bold ${content.color}`}>{item.title.charAt(0)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-white truncate">{item.title}</div>
                                        <div className="text-xs text-slate-500 truncate">{item.subtitle}</div>
                                    </div>
                                    {item.status && (
                                        <div className={`text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300`}>
                                            {item.status}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {content.mockType === 'grid' && content.mockData?.gridItems && (
                        <div className="p-4">
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-2.5 w-3 h-3 text-slate-500" />
                                <div className="w-full bg-slate-800 h-8 rounded-lg border border-white/5"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {content.mockData.gridItems.map((item, i) => (
                                    <div key={i} className="bg-slate-800/50 p-2 rounded-xl border border-white/5">
                                        <div className="aspect-square bg-slate-700/50 rounded-lg mb-2 flex items-center justify-center text-slate-600 text-xs">IMG</div>
                                        <div className="text-xs font-bold text-white truncate">{item.name}</div>
                                        <div className={`text-[10px] ${content.color}`}>{item.price}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {content.mockType === 'scan' && (
                        <div className="flex-1 relative">
                            {/* Scanning Overlay */}
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8">
                                <div className={`w-full aspect-square border-2 border-dashed ${content.color} rounded-2xl flex items-center justify-center bg-black/20 backdrop-blur-sm relative`}>
                                    <div className={`absolute inset-x-0 h-0.5 ${content.color.replace('text-', 'bg-')} top-1/2 animate-pulse shadow-[0_0_15px_rgba(0,255,0,0.5)]`}></div>
                                    <p className="text-white font-bold text-xs bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">Scanning Leaf...</p>
                                </div>
                                <div className="mt-8 flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg transform active:scale-90 transition-transform">
                                        <div className="w-10 h-10 rounded-full border-2 border-black"></div>
                                    </div>
                                </div>
                            </div>
                            {/* Background Image Placeholder */}
                            <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center">
                                <Sprout className="w-32 h-32 text-slate-700 opacity-20" />
                            </div>
                        </div>
                    )}

                    {content.mockType === 'map' && (
                        <div className="flex-1 relative">
                            <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur p-2 rounded-lg pointer-events-none">
                                <Map className="w-4 h-4 text-white" />
                            </div>
                            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                                <div className="absolute z-10 w-8 h-8 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center shadow-xl animate-pulse">
                                    <Plane className="w-4 h-4 text-white transform rotate-45" />
                                </div>
                                {/* Fake Map Grid */}
                                <div className="w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                            </div>
                            {/* Stats Overlay */}
                            <div className="absolute bottom-20 left-4 right-4 bg-black/80 backdrop-blur-md p-3 rounded-xl border border-white/10">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Battery</span>
                                    <span className="text-green-400">84%</span>
                                </div>
                                <div className="w-full h-1 bg-slate-700 rounded-full mt-1">
                                    <div className="w-[84%] h-full bg-green-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bottom Nav Mock */}
                    <div className="absolute bottom-0 w-full h-16 bg-slate-900 border-t border-white/5 flex justify-around items-center px-4 z-20">
                        <div className={`p-2 rounded-full ${content.color.replace('text-', 'bg-')}/10 ${content.color}`}>
                            {content.icon}
                        </div>
                        <div className="p-2 text-slate-600"><User className="w-5 h-5" /></div>
                        <div className="p-2 text-slate-600"><Menu className="w-5 h-5" /></div>
                    </div>

                    {/* Unlock Overlay */}
                    <Link href="/auth/login" className="absolute inset-0 z-30 flex flex-col items-center justify-end pb-32 bg-slate-950/80 backdrop-blur-[3px] opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer">
                        <div className="bg-white text-slate-950 font-bold px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform hover:scale-105">
                            <Lock className="w-4 h-4" /> Unlock {content.title}
                        </div>
                    </Link>

                </div>
            </div>

            {/* Blob effects behind phone - reduced opacity and size for mobile performance */}
            <div className={`absolute top-[20%] left-[10%] w-[80%] h-[60%] ${content.color.replace('text-', 'bg-')} blur-[80px] opacity-10 -z-10`}></div>
        </div>
    );
}
