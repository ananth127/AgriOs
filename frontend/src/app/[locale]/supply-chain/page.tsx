'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import {
    ShoppingBag,
    Tag,
    Tractor,
    Briefcase,
    Search,
    Filter,
    MapPin,
    DollarSign,
    Package,
    Truck,
    CheckCircle,
    Clock,
    AlertCircle,
    ClipboardList
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { CreateListingModal } from '@/components/marketplace/CreateListingModal';

/**
 * TRACK & TRACE DASHBOARD
 * 
 * Purpose: Operational dashboard for items that are ACTIVE in the ecosystem.
 * - My Purchases (Orders) -> Tracking status (Shipped, Delivered)
 * - My Sales (Listings) -> Tracking interest (Bids) or fulfillment
 * - My Jobs -> Tracking applicants/status
 * - Farm/Livestock -> Internal production tracking
 */

export default function SupplyChainDashboard() {
    const searchParams = useSearchParams();

    // Updated Tabs to reflect "Status" nature, not "Shopping" nature
    type Tab = 'orders' | 'sales' | 'jobs' | 'production';

    const [activeTab, setActiveTab] = useState<Tab>(
        (searchParams.get('tab') as any) || 'sales'
    );

    const [dataList, setDataList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list'); // Default to list for tracking
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Fetch Logic
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                let data: any[] = [];

                if (activeTab === 'sales') {
                    // Fetch MY Listings (Items I am selling)
                    // In a real app, this would be api.marketplace.products.list({ seller_id: myId })
                    // reusing list() for now and filtering locally for demo
                    const res = await api.marketplace.products.list();
                    // Mock filter: Assume all are mine or filter by some logic if possible
                    data = Array.isArray(res) ? res.filter((i: any) => i.listing_type === 'SELL').map((i: any) => ({
                        ...i,
                        status: i.status || 'Active',
                        views: i.views || 0,
                        bids: i.bids || 0,
                        date: i.date || new Date().toISOString().split('T')[0]
                    })) : [];
                }
                else if (activeTab === 'orders') {
                    // Fetch My Orders (Items I bought)
                    // DEMO: Read from localStorage + some mock data
                    const stored = localStorage.getItem('demo_orders');
                    const localOrders = stored ? JSON.parse(stored) : [];
                    data = [...localOrders];
                }
                else if (activeTab === 'jobs') {
                    // Fetch My Job Posts
                    // api.farmManagement.getJobs(farmId)
                    // data = await api.farmManagement.getJobs(1); // Mock ID
                    data = [];
                }

                // If empty/mock mode, populated with sample data for visualization
                if (data.length === 0) {
                    if (activeTab === 'orders') {
                        // If no local orders, show mock ones
                        // Check again if we have data from localStorage, if so don't overwrite
                        if (data.length === 0) data = MOCK_ORDERS;
                    } else if (activeTab === 'sales') {
                        data = MOCK_SALES_TRACKING;
                    } else if (activeTab === 'jobs') {
                        data = MOCK_JOBS_TRACKING;
                    }
                }

                setDataList(data);
            } catch (e) {
                console.error("Failed to fetch tracking data", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeTab]);

    // Mock Data for "Tracking" Visualization
    const MOCK_ORDERS = [
        { id: 'ORD-101', product_name: "Premium Seeds Batch", status: 'In Transit', date: '2024-03-20', seller: 'AgriCorp Ltd', eta: '2 Days', step: 2 },
        { id: 'ORD-102', product_name: "Tractor Rental", status: 'Confirmed', date: '2024-03-21', seller: 'User #404', eta: 'Tomorrow', step: 1 },
        { id: 'ORD-99', product_name: "Organic Fertilizer", status: 'Delivered', date: '2024-03-15', seller: 'Green Earth', eta: '-', step: 3 },
    ];

    const MOCK_SALES_TRACKING = [
        { id: 201, product_name: "Fresh Tomatoes (500kg)", status: 'Active', views: 45, bids: 3, date: '2024-03-19', listing_type: 'SELL' },
        { id: 202, product_name: "Holstein Cow #99", status: 'Pending Handover', views: 120, bids: 1, date: '2024-03-10', listing_type: 'SELL' },
    ];

    const MOCK_JOBS_TRACKING = [
        { id: 301, title: "Harvest Assistant", status: 'Open', applicants: 5, posted_date: '2024-03-18' },
        { id: 302, title: "Tractor Driver", status: 'Closed', applicants: 12, posted_date: '2024-02-01' },
    ];

    const getStatusColor = (status: string) => {
        if (!status) return 'text-slate-400 bg-slate-800';
        switch (status.toLowerCase()) {
            case 'delivered': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'in transit': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'confirmed': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            case 'active': return 'text-emerald-400 bg-emerald-500/10';
            case 'pending': return 'text-orange-400 bg-orange-500/10';
            default: return 'text-slate-400 bg-slate-800';
        }
    };

    const renderTabButton = (id: string, label: string, icon: any) => (
        <button
            onClick={() => setActiveTab(id as any)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl transition-all font-medium border whitespace-nowrap ${activeTab === id
                ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {icon}
            {label}
        </button>
    );

    const renderTrackingCard = (item: any) => (
        <div key={item.id} className="bg-slate-900 border border-white/5 rounded-xl p-4 md:p-5 hover:border-teal-500/30 transition-all group relative overflow-hidden">
            {/* Background Progress Bar for Orders */}
            {activeTab === 'orders' && item.status !== 'Delivered' && (
                <div className="absolute bottom-0 left-0 h-1 bg-teal-500/20 w-full">
                    <div className="h-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]" style={{ width: item.step === 1 ? '33%' : '66%' }}></div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 
                        ${activeTab === 'orders' ? 'bg-blue-500/10 text-blue-400' :
                            activeTab === 'sales' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'}`}>
                        {activeTab === 'orders' && <Package className="w-6 h-6" />}
                        {activeTab === 'sales' && <Tag className="w-6 h-6" />}
                        {activeTab === 'jobs' && <Briefcase className="w-6 h-6" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-white text-lg">{item.product_name || item.title}</h3>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getStatusColor(item.status)}`}>
                                {item.status}
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            {item.date || item.posted_date}
                            {item.seller && `• Seller: ${item.seller}`}
                        </p>
                    </div>
                </div>

                {/* Status / Metric Column */}
                <div className="flex items-center gap-6 pl-16 md:pl-0">
                    {activeTab === 'orders' && (
                        <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase font-bold">ETA</p>
                            <p className="text-teal-400 font-mono font-bold">{item.eta}</p>
                        </div>
                    )}
                    {activeTab === 'sales' && (
                        <>
                            <div className="text-center">
                                <p className="text-xs text-slate-500 uppercase font-bold">Views</p>
                                <p className="text-white font-bold">{item.views}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-500 uppercase font-bold">Bids/Offers</p>
                                <p className="text-teal-400 font-bold">{item.bids}</p>
                            </div>
                        </>
                    )}
                    {activeTab === 'jobs' && (
                        <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase font-bold">Applicants</p>
                            <p className="text-blue-400 font-bold">{item.applicants}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Footer */}
            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                <div className="text-xs text-slate-500 font-mono">
                    ID: #{item.id}
                </div>
                <div className="flex gap-2">
                    <button className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg transition-colors">
                        Details
                    </button>
                    {activeTab === 'orders' && item.status !== 'Delivered' && (
                        <button className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-lg shadow-teal-900/20">
                            <MapPin className="w-3.5 h-3.5" /> Track Live
                        </button>
                    )}
                    {activeTab === 'jobs' && (
                        <button className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg transition-colors shadow-lg shadow-blue-900/20">
                            View Applicants
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-screen space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Track & Trace</h1>
                    <p className="text-sm md:text-base text-slate-400">Monitor your orders, active listings, and operations.</p>
                </div>
                {activeTab === 'sales' && (
                    <button
                        onClick={() => setIsPostModalOpen(true)}
                        className="w-full md:w-auto px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                    >
                        <span>+</span> Post New Listing
                    </button>
                )}
                {activeTab === 'jobs' && (
                    <button
                        className="w-full md:w-auto px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                    >
                        <span>+</span> New Job Post
                    </button>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex gap-2 md:gap-3 min-w-max">
                    {renderTabButton('orders', 'My Orders', <Package className="w-4 h-4" />)}
                    {renderTabButton('sales', 'My Sales', <Tag className="w-4 h-4" />)}
                    {renderTabButton('jobs', 'My Jobs', <ClipboardList className="w-4 h-4" />)}
                    {renderTabButton('production', 'Farm & Livestock', <Tractor className="w-4 h-4" />)}
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 opacity-50">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mb-4"></div>
                        <p className="text-sm text-slate-500">Retrieving tracking data...</p>
                    </div>
                ) : (
                    <>
                        {/* ORDERS, SALES, JOBS VIEW */}
                        {(activeTab === 'orders' || activeTab === 'sales' || activeTab === 'jobs') && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                {dataList.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 rounded-3xl border border-white/5 border-dashed">
                                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 text-3xl opacity-50">
                                            ∅
                                        </div>
                                        <p className="text-slate-400 font-medium">No active items found</p>
                                        <p className="text-xs text-slate-600 max-w-xs text-center mt-2">
                                            {activeTab === 'orders' && "You haven't placed any orders yet."}
                                            {activeTab === 'sales' && "You don't have any active listings."}
                                            {activeTab === 'jobs' && "No job openings posted."}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                                        {dataList.map(renderTrackingCard)}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PRODUCTION VIEW */}
                        {activeTab === 'production' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                                {/* Farming Card */}
                                <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:border-teal-500/30 transition-all cursor-pointer group">
                                    <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Tractor className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Crop Production</h3>
                                    <p className="text-slate-400 text-sm mb-6">Track batch #2024-WHT, harvest timelines, and growth stages.</p>
                                    <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>Current: Harvest</span>
                                        <span>75% Complete</span>
                                    </div>
                                </div>

                                {/* Livestock Card */}
                                <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:border-teal-500/30 transition-all cursor-pointer group">
                                    <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <div className="text-xl">🐮</div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Livestock Health</h3>
                                    <p className="text-slate-400 text-sm mb-6">Monitor vaccination schedules, milk production logs, and breeding cycles.</p>
                                    <div className="flex gap-2">
                                        <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded border border-yellow-500/20">2 Alerts</span>
                                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20">All Healthy</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create Listing Modal (Only for Sales Tab) */}
            <CreateListingModal
                isOpen={isPostModalOpen}
                onClose={() => setIsPostModalOpen(false)}
                onSuccess={() => {
                    // In real implementation, reload data list
                    setActiveTab('sales');
                }}
            />
        </div>
    );
}
