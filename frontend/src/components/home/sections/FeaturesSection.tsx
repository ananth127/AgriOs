'use client';

import { ArrowLeft, CheckCircle2, Zap, Shield, BarChart3, Globe } from 'lucide-react';
import { Link } from '@/navigation';

export default function FeaturesSection() {
    return (
        <section id="features" className="py-20 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white relative transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-500 to-emerald-700 dark:from-green-400 dark:to-emerald-600 bg-clip-text text-transparent mb-6">
                        Powerful Features
                    </h2>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Everything you need to manage your crops, livestock, and finances in one place.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Zap className="w-8 h-8 text-yellow-500 dark:text-yellow-400" />}
                        title="AI Crop Doctor"
                        desc="Instant disease diagnosis using computer vision. Just snap a photo of your plant."
                    />
                    <FeatureCard
                        icon={<BarChart3 className="w-8 h-8 text-blue-500 dark:text-blue-400" />}
                        title="Market Analytics"
                        desc="Real-time price tracking and profit calculators to maximize your revenue."
                    />
                    <FeatureCard
                        icon={<Globe className="w-8 h-8 text-green-500 dark:text-green-400" />}
                        title="Satellite Monitoring"
                        desc="Monitor field health and water stress levels from space with NDVI indices."
                    />
                    <FeatureCard
                        icon={<Shield className="w-8 h-8 text-purple-500 dark:text-purple-400" />}
                        title="Secure Blockchain"
                        desc="Traceability for your supply chain. Generate QR codes for trust and transparency."
                    />
                    <FeatureCard
                        icon={<CheckCircle2 className="w-8 h-8 text-orange-500 dark:text-orange-400" />}
                        title="Livestock Management"
                        desc="Track health, breeding cycles, and milk production for your herd."
                    />
                    <FeatureCard
                        icon={<Zap className="w-8 h-8 text-pink-500 dark:text-pink-400" />}
                        title="Community Forum"
                        desc="Connect with other farmers and experts to solve problems together."
                    />
                </div>
            </div>
        </section>
    );
}

function FeatureCard({ icon, title, desc }: any) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-8 rounded-2xl hover:border-green-500/30 transition-colors shadow-sm dark:shadow-none">
            <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{title}</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {desc}
            </p>
        </div>
    )
}
