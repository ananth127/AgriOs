'use client';

import { Link } from '@/navigation';
import { ArrowRight } from 'lucide-react';

export default function UseCasesSection() {
    return (
        <section id="use-cases" className="py-20 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-t border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 to-indigo-700 dark:from-blue-400 dark:to-indigo-600 bg-clip-text text-transparent mb-6">
                        Who uses Agri-OS?
                    </h2>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Tailored solutions for every stakeholder in the agriculture ecosystem.
                    </p>
                </div>

                <div className="space-y-12">
                    <UseCaseRow
                        role="Smallholder Farmers"
                        desc="Manage your land, detect diseases early with AI, and connect directly to buyers to get fair prices."
                        image="/images/usecase-farmer.jpg" // Placeholder path
                        features={['Crop Doctor', 'Marketplace', 'Weather Alerts']}
                        color="text-green-500 dark:text-green-400"
                    />
                    <UseCaseRow
                        role="Agri-Cooperatives (FPOs)"
                        desc="Digitize member records, aggregate produce for bulk selling, and manage collective resources like tractors."
                        image="/images/usecase-fpo.jpg"
                        features={['Member Registry', 'Bulk Sales', 'Inventory Mgmt']}
                        reversed
                        color="text-blue-500 dark:text-blue-400"
                    />
                    <UseCaseRow
                        role="Government Officers"
                        desc="Monitor regional crop health, estimate yields accurately using satellite data, and disburse subsidies transparently."
                        image="/images/usecase-govt.jpg"
                        features={['Regional Dashboard', 'Yield Estimation', 'Digital Records']}
                        color="text-orange-500 dark:text-orange-400"
                    />
                </div>
            </div>
        </section>
    );
}

function UseCaseRow({ role, desc, features, reversed, color }: any) {
    return (
        <div className={`flex flex-col md:flex-row items-center gap-8 md:gap-12 ${reversed ? 'md:flex-row-reverse' : ''}`}>
            <div className="flex-1 space-y-4">
                <h3 className={`text-3xl font-bold ${color}`}>{role}</h3>
                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">{desc}</p>
                <ul className="space-y-2">
                    {features.map((f: string) => (
                        <li key={f} className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <span className={`w-2 h-2 rounded-full ${color.replace('text-', 'bg-')}`}></span>
                            {f}
                        </li>
                    ))}
                </ul>
                <div className="pt-4">
                    <Link href="/auth/signup" className="text-slate-900 dark:text-white border-b border-slate-300 dark:border-white/20 pb-1 hover:border-green-500 dark:hover:border-white transition-colors inline-flex items-center gap-2 font-medium">
                        View Solution <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
            <div className="flex-1 w-full bg-slate-100 dark:bg-slate-900 aspect-video rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-slate-600">
                {/* Placeholder for image */}
                <span className="text-sm">Image: {role}</span>
            </div>
        </div>
    )
}
