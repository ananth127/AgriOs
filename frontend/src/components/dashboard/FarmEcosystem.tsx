import React, { useState } from 'react';
import {
    Tractor, Droplets, Users, Wheat, Shell,
    ArrowRight, Activity, Battery, Wrench, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Link } from '@/navigation';

export const FarmEcosystem = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'machinery' | 'labor'>('overview');

    // Mock Data representing the connected farm
    const ecosystem = {
        crops: [
            { id: 1, name: 'Maize Field A', status: 'Harvest Ready', demand: { water: 'Satisfied', labor: 'Needed (Harvest)', machinery: 'Harvester' } },
            { id: 2, name: 'Tomato Zone', status: 'Growing', demand: { water: 'Pumping..', labor: 'None', machinery: 'None' } }
        ],
        livestock: [
            { id: 1, name: 'Dairy Cattle', count: 12, status: 'Healthy', feed: 'Maize Stalks (Stocked)', water: 'Auto-Refill' },
            { id: 2, name: 'Poultry', count: 50, status: 'Check Vet', feed: 'Grains (Low)', water: 'Satisfied' }
        ],
        machinery: [
            { id: 1, name: 'John Deere 5310', type: 'Tractor', status: 'Active', fuel: 45, maintenance: 'Good', task: 'Ploughing Field B' },
            { id: 2, name: 'Pest Drone X1', type: 'Drone', status: 'Charging', fuel: 80, maintenance: 'Propeller Check', task: 'Idle' },
            { id: 3, name: 'Auto-Weeder', type: 'Robot', status: 'Maintenance', fuel: 10, maintenance: 'Oil Change', task: 'Down' }
        ],
        resources: {
            water: { status: 'Pumps On', level: '85%', flow: '120L/min' },
            labor: { total: 8, active: 5, assigned: ['Maize Field A', 'Composting'] }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    Farm Ecosystem Monitor
                </h3>
                <div className="flex gap-2 text-xs bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === 'overview' ? 'bg-white dark:bg-slate-800 text-green-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Chain Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('machinery')}
                        className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === 'machinery' ? 'bg-white dark:bg-slate-800 text-green-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Machinery & Assets
                    </button>
                </div>
            </div>

            {/* MAIN CHAIN VIEW */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* COL 1: CROPS SECTOR */}
                    <Card className="border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10 group hover:bg-green-100/50 dark:hover:bg-green-900/20 transition-colors">
                        <CardHeader className="pb-2">
                            <Link href="/crops" className="block w-full">
                                <CardTitle className="text-sm font-bold text-green-700 dark:text-green-400 flex justify-between cursor-pointer">
                                    <span className="group-hover:text-green-800 dark:group-hover:text-green-300 transition-colors flex items-center gap-2">PRODUCERS (Crops) <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></span>
                                    <Wheat className="w-4 h-4" />
                                </CardTitle>
                            </Link>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {ecosystem.crops.map(crop => (
                                <Link href="/crops" key={crop.id} className="block group/item">
                                    <div className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm border border-slate-100 dark:border-white/5 group-hover/item:border-green-500/30 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover/item:text-green-600 dark:group-hover/item:text-green-400">{crop.name}</span>
                                            <span className="text-[10px] bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">{crop.status}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <Droplets className="w-3 h-3 text-blue-400" /> {crop.demand.water}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="w-3 h-3 text-amber-400" /> {crop.demand.labor}
                                            </div>
                                        </div>
                                        {/* Link to Livestock */}
                                        <div className="mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-white/10 flex items-center gap-1 text-[10px] text-slate-400 group-hover/item:text-slate-500">
                                            Output:
                                            <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center">
                                                Fodder <ArrowRight className="w-3 h-3 mx-1" /> Livestock
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>

                    {/* COL 2: SHARED RESOURCES */}
                    <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10 group hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors">
                        <CardHeader className="pb-2">
                            <Link href="/farm-management">
                                <CardTitle className="text-sm font-bold text-blue-700 dark:text-blue-400 flex justify-between cursor-pointer">
                                    <span className="group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors flex items-center gap-2">SHARED RESOURCES <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></span>
                                    <Activity className="w-4 h-4" />
                                </CardTitle>
                            </Link>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Water System */}
                            <Link href="/devices" className="block group/irrigation">
                                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden group-hover/irrigation:border-blue-500/30 transition-all">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 dark:bg-blue-500/10 rounded-bl-full -mr-2 -mt-2"></div>
                                    <h4 className="font-bold text-xs text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2 group-hover/irrigation:text-blue-600 dark:group-hover/irrigation:text-blue-400">
                                        <Droplets className="w-4 h-4 text-blue-500" /> Irrigation Network
                                    </h4>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-lg font-bold text-slate-800 dark:text-white">Active</p>
                                            <p className="text-[10px] text-slate-500">Flow: 120L/min</p>
                                        </div>
                                        <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-600 px-2 py-1 rounded-full animate-pulse">Pumping</span>
                                    </div>
                                </div>
                            </Link>

                            {/* Machinery Pool */}
                            <Link href="/farm-management?tab=machinery" className="block group/machines">
                                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm border border-slate-100 dark:border-white/5 group-hover/machines:border-amber-500/30 transition-all">
                                    <h4 className="font-bold text-xs text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2 group-hover/machines:text-amber-600 dark:group-hover/machines:text-amber-400">
                                        <Tractor className="w-4 h-4 text-amber-500" /> Machinery Pool
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Deployed</span>
                                            <span className="font-bold text-slate-800 dark:text-white">1/3</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Maintenance</span>
                                            <span className="font-bold text-red-500">1 Critical</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* COL 3: LIVESTOCK */}
                    <Card className="border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10 group hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors">
                        <CardHeader className="pb-2">
                            <Link href="/livestock">
                                <CardTitle className="text-sm font-bold text-amber-700 dark:text-amber-400 flex justify-between cursor-pointer">
                                    <span className="group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors flex items-center gap-2">CONSUMERS (Livestock) <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></span>
                                    <Shell className="w-4 h-4" />
                                </CardTitle>
                            </Link>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {ecosystem.livestock.map(herd => (
                                <Link href="/livestock" key={herd.id} className="block group/item">
                                    <div className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm border border-slate-100 dark:border-white/5 group-hover/item:border-amber-500/30 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover/item:text-amber-600 dark:group-hover/item:text-amber-400">{herd.name}</span>
                                            <span className="text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                {herd.count} Heads
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                                                <span>Diet (Input)</span>
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{herd.feed}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                                                <span>Water (IoT)</span>
                                                <span className="font-medium text-blue-500">{herd.water}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* MACHINERY & ASSETS TAB */}
            {activeTab === 'machinery' && (
                <div className="grid grid-cols-1 gap-4">
                    {ecosystem.machinery.map(machine => (
                        <Link href="/farm-management?tab=machinery" key={machine.id} className="block group">
                            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-center gap-4 shadow-sm hover:border-amber-500/30 transition-all">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${machine.status === 'Active' ? 'bg-green-100 text-green-600' :
                                    machine.status === 'Maintenance' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    <Tractor className="w-6 h-6" />
                                </div>

                                <div className="flex-1 w-full text-center md:text-left">
                                    <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{machine.name}</h4>
                                    <p className="text-xs text-slate-500">{machine.type} • {machine.task}</p>
                                </div>

                                {/* Status Indicators */}
                                <div className="flex gap-6 w-full md:w-auto justify-around md:justify-end">
                                    <div className="text-center">
                                        <div className="flex items-center gap-1 text-xs text-slate-400 mb-1 justify-center">
                                            <Battery className="w-3 h-3" /> Fuel/Energy
                                        </div>
                                        <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                                            <div
                                                className={`h-full ${machine.fuel < 20 ? 'bg-red-500' : 'bg-green-500'} transition-all`}
                                                style={{ width: `${machine.fuel}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[10px] font-mono">{machine.fuel}%</span>
                                    </div>

                                    <div className="text-center">
                                        <div className="flex items-center gap-1 text-xs text-slate-400 mb-1 justify-center">
                                            <Wrench className="w-3 h-3" /> Maintenance
                                        </div>
                                        <div className={`text-xs font-bold ${machine.maintenance === 'Good' ? 'text-green-500' : 'text-red-500 flex items-center gap-1'}`}>
                                            {machine.maintenance !== 'Good' && <AlertTriangle className="w-3 h-3" />}
                                            {machine.maintenance}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};
