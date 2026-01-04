'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Sprout, Calculator, DollarSign, Droplets, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function CalculatorPage() {
    const [crop, setCrop] = useState('Wheat');
    const [acres, setAcres] = useState(1);
    const [pricePerQuintal, setPricePerQuintal] = useState(2200);

    // Hardcoded agronomical data (In production, fetch from DB/Registry)
    const CROP_DATA: Record<string, any> = {
        'Wheat': { yieldPerAcre: 18, seedCost: 1200, fertilizerCost: 3500, laborCost: 5000, waterCost: 1000, color: '#F5DEB3' },
        'Rice': { yieldPerAcre: 22, seedCost: 1500, fertilizerCost: 4000, laborCost: 8000, waterCost: 2000, color: '#90EE90' },
        'Onion': { yieldPerAcre: 120, seedCost: 8000, fertilizerCost: 6000, laborCost: 10000, waterCost: 3000, color: '#E9967A' },
        'Tomato': { yieldPerAcre: 250, seedCost: 12000, fertilizerCost: 8000, laborCost: 15000, waterCost: 4000, color: '#FF6347' },
    };

    const calculation = useMemo(() => {
        const data = CROP_DATA[crop];
        const totalYield = data.yieldPerAcre * acres;
        const totalRevenue = totalYield * pricePerQuintal;

        const costs = {
            seed: data.seedCost * acres,
            fertilizer: data.fertilizerCost * acres,
            labor: data.laborCost * acres,
            water: data.waterCost * acres
        };

        const totalCost = Object.values(costs).reduce((a, b) => a + b, 0);
        const netProfit = totalRevenue - totalCost;
        const roi = (netProfit / totalCost) * 100;

        return { totalYield, totalRevenue, costs, totalCost, netProfit, roi };
    }, [crop, acres, pricePerQuintal]);

    // Mock Historical Data for Chart
    const historyData = [
        { year: '2021', yield: CROP_DATA[crop].yieldPerAcre * 0.9, price: pricePerQuintal * 0.85 },
        { year: '2022', yield: CROP_DATA[crop].yieldPerAcre * 0.95, price: pricePerQuintal * 0.9 },
        { year: '2023', yield: CROP_DATA[crop].yieldPerAcre * 0.8, price: pricePerQuintal * 1.1 }, // Drought year logic
        { year: '2024', yield: CROP_DATA[crop].yieldPerAcre * 1.05, price: pricePerQuintal * 1.0 },
    ];

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent flex items-center gap-3">
                    <Calculator className="w-8 h-8 text-yellow-400" />
                    Farming ROI Calculator
                </h1>
                <p className="text-slate-400 mt-2">Estimate yields, costs, and profits based on current market rates.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Inputs */}
                <Card className="col-span-1 border-white/10 bg-slate-900/50">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Sprout className="w-5 h-5 text-green-400" /> Farm Inputs
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-500 mb-1">Select Crop</label>
                            <select
                                className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-green-500"
                                value={crop}
                                onChange={(e) => setCrop(e.target.value)}
                            >
                                {Object.keys(CROP_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-500 mb-1">Area (Acres)</label>
                            <input
                                type="number"
                                min="0.1"
                                className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-green-500"
                                value={acres}
                                onChange={(e) => setAcres(parseFloat(e.target.value) || 0)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-slate-500 mb-1">Market Price (₹ / Quintal)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-green-500"
                                value={pricePerQuintal}
                                onChange={(e) => setPricePerQuintal(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-slate-800 rounded-lg">
                        <div className="text-sm text-slate-500 mb-2">Cost Breakdown</div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>🌱 Seeds</span> <span>₹{calculation.costs.seed.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span>🧪 Fertilizer</span> <span>₹{calculation.costs.fertilizer.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span>👨‍🌾 Labor</span> <span>₹{calculation.costs.labor.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span>💧 Water</span> <span>₹{calculation.costs.water.toLocaleString()}</span></div>
                            <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-white">
                                <span>Total Input</span>
                                <span>₹{calculation.totalCost.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Results - Big Cards */}
                <div className="col-span-1 md:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30 flex flex-col justify-center items-center py-8">
                            <h4 className="text-slate-400 text-sm font-medium mb-1">Expected Yield</h4>
                            <div className="text-3xl font-bold text-white">{calculation.totalYield.toLocaleString()} <span className="text-sm font-normal text-slate-400">Quintals</span></div>
                        </Card>
                        <Card className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-500/30 flex flex-col justify-center items-center py-8">
                            <h4 className="text-slate-400 text-sm font-medium mb-1">Est. Revenue</h4>
                            <div className="text-3xl font-bold text-white">₹{calculation.totalRevenue.toLocaleString()}</div>
                        </Card>
                        <Card className={`bg-gradient-to-br border flex flex-col justify-center items-center py-8 ${calculation.netProfit >= 0 ? 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30' : 'from-red-500/20 to-pink-500/20 border-red-500/30'}`}>
                            <h4 className="text-slate-400 text-sm font-medium mb-1">Net Profit</h4>
                            <div className={`text-3xl font-bold ${calculation.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ₹{calculation.netProfit.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">ROI: {calculation.roi.toFixed(1)}%</div>
                        </Card>
                    </div>

                    {/* Historical Analysis Chart */}
                    <Card className="border-white/10 bg-slate-900/50 p-6">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-400" /> Historical Analysis (Past 4 Years)
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={historyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                    <XAxis dataKey="year" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Line type="monotone" dataKey="yield" name="Yield (Q)" stroke="#10b981" strokeWidth={2} />
                                    <Line type="monotone" dataKey="price" name="Price/Q (₹)" stroke="#f59e0b" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-xs text-slate-500 mt-4 text-center">
                            * Historical data is simulated based on regional averages.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
