import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, CheckCircle2, Zap, Shield, BarChart3, Globe } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';

export default function FeaturesPage({ params: { locale } }: { params: { locale: string } }) {
    // Ideally use translations, but hardcoding for speed/demo as requested "found what are there"
    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <PublicHeader locale={locale} />

            <main className="max-w-7xl mx-auto px-6 pt-20 pb-12 md:pt-28 md:pb-20">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent mb-6">
                        Powerful Features for Modern Farms
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Everything you need to manage your crops, livestock, and finances in one place.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Zap className="w-8 h-8 text-yellow-400" />}
                        title="AI Crop Doctor"
                        desc="Instant disease diagnosis using computer vision. Just snap a photo of your plant."
                    />
                    <FeatureCard
                        icon={<BarChart3 className="w-8 h-8 text-blue-400" />}
                        title="Market Analytics"
                        desc="Real-time price tracking and profit calculators to maximize your revenue."
                    />
                    <FeatureCard
                        icon={<Globe className="w-8 h-8 text-green-400" />}
                        title="Satellite Monitoring"
                        desc="Monitor field health and water stress levels from space with NDVI indices."
                    />
                    <FeatureCard
                        icon={<Shield className="w-8 h-8 text-purple-400" />}
                        title="Secure Blockchain"
                        desc="Traceability for your supply chain. Generate QR codes for trust and transparency."
                    />
                    <FeatureCard
                        icon={<CheckCircle2 className="w-8 h-8 text-orange-400" />}
                        title="Livestock Management"
                        desc="Track health, breeding cycles, and milk production for your herd."
                    />
                    <FeatureCard
                        icon={<Zap className="w-8 h-8 text-pink-400" />}
                        title="Community Forum"
                        desc="Connect with other farmers and experts to solve problems together."
                    />
                </div>

                <div className="mt-20 text-center">
                    <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-white text-slate-950 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform">
                        Get Started for Free
                    </Link>
                </div>
            </main>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: any) {
    return (
        <div className="bg-slate-900 border border-white/5 p-8 rounded-2xl hover:border-green-500/30 transition-colors">
            <div className="bg-slate-800 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
            <p className="text-slate-400 leading-relaxed">
                {desc}
            </p>
        </div>
    )
}
