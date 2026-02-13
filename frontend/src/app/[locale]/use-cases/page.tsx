import { Link } from '@/navigation';
import PublicHeader from '@/components/PublicHeader';
import { ArrowRight } from 'lucide-react';

export default function UseCasesPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <PublicHeader locale={locale} />

            <main className="max-w-7xl mx-auto px-6 pt-24 pb-12 md:pt-28 md:pb-20">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent mb-6">
                        Who uses Agri-OS?
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Tailored solutions for every stakeholder in the agriculture ecosystem.
                    </p>
                </div>

                <div className="space-y-12">
                    <UseCaseRow
                        role="Smallholder Farmers"
                        desc="Manage your land, detect diseases early with AI, and connect directly to buyers to get fair prices."
                        image="/images/usecase-farmer.jpg" // Placeholder path
                        features={['Crop Doctor', 'Marketplace', 'Weather Alerts']}
                        color="text-green-400"
                    />
                    <UseCaseRow
                        role="Agri-Cooperatives (FPOs)"
                        desc="Digitize member records, aggregate produce for bulk selling, and manage collective resources like tractors."
                        image="/images/usecase-fpo.jpg"
                        features={['Member Registry', 'Bulk Sales', 'Inventory Mgmt']}
                        reversed
                        color="text-blue-400"
                    />
                    <UseCaseRow
                        role="Government Officers"
                        desc="Monitor regional crop health, estimate yields accurately using satellite data, and disburse subsidies transparently."
                        image="/images/usecase-govt.jpg"
                        features={['Regional Dashboard', 'Yield Estimation', 'Digital Records']}
                        color="text-orange-400"
                    />
                </div>
            </main>
        </div>
    );
}

function UseCaseRow({ role, desc, features, reversed, color }: any) {
    return (
        <div className={`flex flex-col md:flex-row items-center gap-8 md:gap-12 ${reversed ? 'md:flex-row-reverse' : ''}`}>
            <div className="flex-1 space-y-4">
                <h3 className={`text-3xl font-bold ${color}`}>{role}</h3>
                <p className="text-lg text-slate-300 leading-relaxed">{desc}</p>
                <ul className="space-y-2">
                    {features.map((f: string) => (
                        <li key={f} className="flex items-center gap-2 text-slate-400">
                            <span className={`w-2 h-2 rounded-full ${color.replace('text-', 'bg-')}`}></span>
                            {f}
                        </li>
                    ))}
                </ul>
                <div className="pt-4">
                    <Link href="/auth/signup" className="text-white border-b border-white/20 pb-1 hover:border-white transition-colors inline-flex items-center gap-2">
                        View Solution <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
            <div className="flex-1 w-full bg-slate-900 aspect-video rounded-2xl border border-white/10 flex items-center justify-center text-slate-600">
                {/* Placeholder for image */}
                <span className="text-sm">Image: {role}</span>
            </div>
        </div>
    )
}
