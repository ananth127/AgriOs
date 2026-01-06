'use client';

import {
    LayoutDashboard, MapPin, Globe,
    ShieldCheck, BarChart, Sprout, Tractor, ShoppingBag, ScrollText, Users, Camera, Mic
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useTranslations } from 'next-intl';

export default function DocsPage() {
    const t = useTranslations('Docs');

    const features = [
        {
            title: t('feat_dashboard_title'),
            icon: LayoutDashboard,
            desc: t('feat_dashboard_desc'),
            details: t('feat_dashboard_tags').split(',')
        },
        {
            title: t('feat_auth_title'),
            icon: ShieldCheck,
            desc: t('feat_auth_desc'),
            details: t('feat_auth_tags').split(',')
        },
        {
            title: t('feat_location_title'),
            icon: MapPin,
            desc: t('feat_location_desc'),
            details: t('feat_location_tags').split(',')
        },
        {
            title: t('feat_analytics_title'),
            icon: BarChart,
            desc: t('feat_analytics_desc'),
            details: t('feat_analytics_tags').split(',')
        },
        {
            title: t('feat_farm_mgmt_title'),
            icon: Tractor,
            desc: t('feat_farm_mgmt_desc'),
            details: t('feat_farm_mgmt_tags').split(',')
        },
        {
            title: t('feat_crops_title'),
            icon: Sprout,
            desc: t('feat_crops_desc'),
            details: t('feat_crops_tags').split(',')
        },
        {
            title: t('feat_marketplace_title'),
            icon: ShoppingBag,
            desc: t('feat_marketplace_desc'),
            details: t('feat_marketplace_tags').split(',')
        },
        {
            title: t('feat_voice_title'),
            icon: Mic,
            desc: t('feat_voice_desc'),
            details: t('feat_voice_tags').split(',')
        },
        {
            title: t('feat_supply_title'),
            icon: ScrollText,
            desc: t('feat_supply_desc'),
            details: t('feat_supply_tags').split(',')
        },
        {
            title: t('feat_livestock_title'),
            icon: Users,
            desc: t('feat_livestock_desc'),
            details: t('feat_livestock_tags').split(',')
        },
        {
            title: t('feat_drone_title'),
            icon: Camera,
            desc: t('feat_drone_desc'),
            details: t('feat_drone_tags').split(',')
        }
    ];

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="space-y-4 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                    {t('title')}
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl">
                    {t('subtitle')}
                </p>
            </div>

            {/* User Flow Section */}
            <div className="grid md:grid-cols-4 gap-6">
                {[
                    { step: "01", title: t('step_profile_title'), desc: t('step_profile_desc') },
                    { step: "02", title: t('step_map_title'), desc: t('step_map_desc') },
                    { step: "03", title: t('step_cycles_title'), desc: t('step_cycles_desc') },
                    { step: "04", title: t('step_connect_title'), desc: t('step_connect_desc') }
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
                    {t('section_features')}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, i) => (
                        <Card key={i} className="p-6 bg-slate-900 border-white/10 hover:border-green-500/40 transition-all hover:shadow-lg hover:shadow-green-900/10 group">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                                <feature.icon className="w-6 h-6 text-green-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                            <p className="text-slate-400 text-sm mb-4 leading-relaxed line-clamp-3">
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
