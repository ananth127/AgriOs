'use client';

import {
    LayoutDashboard, Sprout, Tractor, ShoppingBag,
    ScrollText, Users, Camera, Calculator, Mic,
    MapPin, Activity, Globe, ShieldCheck
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function DocsPage() {
    const features = [
        {
            title: "Smart Dashboard",
            icon: LayoutDashboard,
            desc: "Your central command center. View real-time weather forecasts, market prices for your location (e.g., Nasik Onion prices), and ai-driven alerts for your crops.",
            details: ["Real-time Weather", "Market Price Ticker", "AI Crop Health Alerts"]
        },
        {
            title: "Farm Management",
            icon: Tractor,
            desc: "Digitize your land. Map your farm boundaries using satellite imagery, divide them into active zones (Plots), and track specific crop cycles per zone.",
            details: ["Satellite Map View", "Zone/Plot Management", "Soil Health Records"]
        },
        {
            title: "Crop Registry",
            icon: Sprout,
            desc: "End-to-end lifecycle tracking. Register crops from sowing to harvest. Log irrigation, fertilization, and pest control activities to ensure quality.",
            details: ["Sowing Dates", "Harvest Planning", "Activity Logs"]
        },
        {
            title: "Marketplace",
            icon: ShoppingBag,
            desc: "Direct B2B/B2C trading. Sell your produce directly to buyers or purchase high-quality seeds and fertilizers. Eliminates middlemen for better margins.",
            details: ["Sell Produce", "Buy Inputs", "Price Discoverv"]
        },
        {
            title: "Voice Assistant (Prophet)",
            icon: Mic,
            desc: "Multilingual AI support. Speak in your local language to ask about weather, prices, or advice. 'What is the price of Onion in Nasik?'",
            details: ["Multi-language Support", "Hands-free Operation", "Context-aware Answers"]
        },
        {
            title: "Supply Chain & Traceability",
            icon: ScrollText,
            desc: "Blockchain-ready transparency. Generate QR codes for your harvest so buyers can trace the origin and quality of the produce back to your farm.",
            details: ["QR Generation", "Origin Tracing", "Quality Certification"]
        },
        {
            title: "Livestock",
            icon: Users,
            desc: "Manage your animal husbandry. Track health records, breeding cycles, and vaccination schedules for cattle, poultry, and more.",
            details: ["Health Records", "Breeding Log", "Vaccination Alerts"]
        },
        {
            title: "Drone AI",
            icon: Camera,
            desc: "Advanced monitoring. Integrate drone imagery to detect pest infestations or water stress in large fields automatically.",
            details: ["Aerial Imaging", "Pest Detection", "Water Stress Analysis"]
        }
    ];

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="space-y-4 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                    How Agri-OS Works
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl">
                    A comprehensive guide to managing your farm, crops, and market connect using the Universal Farm Operating System.
                </p>
            </div>

            {/* User Flow Section */}
            <div className="grid md:grid-cols-4 gap-6">
                {[
                    { step: "01", title: "Create Profile", desc: "Set your role (Farmer, Officer) and Pin your farming location." },
                    { step: "02", title: "Map Farm", desc: "Go to 'My Farms' and define your land boundaries and zones." },
                    { step: "03", title: "Manage Cycles", desc: "Log activities in 'Crops' to maintain a healthy yield history." },
                    { step: "04", title: "Connect & Sell", desc: "List harvest on 'Marketplace' or check prices via Voice AI." }
                ].map((item, i) => (
                    <div key={i} className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-green-500/30 transition-colors">
                        <div className="absolute -right-4 -top-4 text-8xl font-bold text-white/5 z-0 group-hover:text-green-500/5 transition-colors">
                            {item.step}
                        </div>
                        <div className="relative z-10">
                            <div className="text-green-500 font-mono text-sm mb-2">Step {item.step}</div>
                            <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detailed Features Grid */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white border-l-4 border-green-500 pl-4">
                    Platform Features
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <Card key={i} className="p-6 bg-slate-900 border-white/10 hover:border-green-500/40 transition-all hover:shadow-lg hover:shadow-green-900/10 group">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                                <feature.icon className="w-6 h-6 text-green-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                                {feature.desc}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {feature.details.map((detail, j) => (
                                    <span key={j} className="px-2 py-1 rounded-md bg-white/5 text-[10px] text-slate-300 border border-white/5">
                                        {detail}
                                    </span>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Footer / CTA */}
            <div className="bg-gradient-to-br from-green-900/20 to-slate-900 border border-green-500/20 rounded-2xl p-8 text-center space-y-4">
                <Globe className="w-10 h-10 text-green-400 mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-white">Join the Smart Farming Revolution</h2>
                <p className="text-slate-400 max-w-xl mx-auto">
                    Agri-OS is designed to empower farmers with data. Start by setting your location to get hyper-local predictions today.
                </p>
            </div>
        </div>
    );
}
