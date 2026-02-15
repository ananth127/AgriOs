'use client';

import { useState } from 'react';
import { User } from './types';
import { X, Search, Scan, QrCode, Phone, UserPlus } from 'lucide-react';
import Image from 'next/image';
// import { api } from '@/services/api'; 
// A real QR Scanner would use 'react-qr-reader' or similar
// import { QrReader } from 'react-qr-reader';

interface AddContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (user: User) => void;
}

// Mock users extended
const MOCK_USERS: User[] = [
    { id: 101, full_name: "Dr. A. Sharma (Expert)", role: "Expert", phone_number: "+919876543210" },
    { id: 102, full_name: "Rahul Vendor", role: "Seller", phone_number: "+911234567890" },
    { id: 103, full_name: "Priya Officer", role: "Officer", phone_number: "+918888888888" },
];

export function AddContactModal({ isOpen, onClose, onSelect }: AddContactModalProps) {
    const [activeTab, setActiveTab] = useState<'search' | 'scan' | 'my-qr'>('search');
    const [search, setSearch] = useState('');
    const [simulateScan, setSimulateScan] = useState(false);

    if (!isOpen) return null;

    const filteredUsers = MOCK_USERS.filter(u =>
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.phone_number?.includes(search)
    );

    const handleScanResult = (result: string) => {
        // Assume result is a Unique ID or JSON
        const found = MOCK_USERS.find(u => u.phone_number === result || u.user_unique_id === result);
        if (found) {
            onSelect(found);
            onClose();
        } else {
            alert("User not found from QR: " + result);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-white/10">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">New Chat</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-white/10">
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'search' ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50 dark:bg-green-500/10' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                        Search
                    </button>
                    <button
                        onClick={() => setActiveTab('scan')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'scan' ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50 dark:bg-green-500/10' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                        Scan QR
                    </button>
                    <button
                        onClick={() => setActiveTab('my-qr')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'my-qr' ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50 dark:bg-green-500/10' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                        My Code
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    {/* SEARCH TAB */}
                    {activeTab === 'search' && (
                        <>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or number (+91...)"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-green-500 text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Suggestions</p>
                                {filteredUsers.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => onSelect(user)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-400 font-bold group-hover:scale-110 transition-transform">
                                            {user.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900 dark:text-white">{user.full_name}</div>
                                            <div className="text-xs text-slate-500">{user.role} • {user.phone_number}</div>
                                        </div>
                                    </button>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <div className="text-center py-8">
                                        <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500">No users found.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* SCAN TAB */}
                    {activeTab === 'scan' && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-64 h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center relative overflow-hidden mb-4">
                                {!simulateScan ? (
                                    <>
                                        <Scan className="w-16 h-16 text-slate-400 animate-pulse" />
                                        <p className="text-sm text-slate-500 mt-4">Camera Access Required</p>
                                        <button
                                            onClick={() => setSimulateScan(true)}
                                            className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                                        >
                                            Simulate Scan
                                        </button>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white p-4">
                                        <div>
                                            <p className="mb-4">Simulated: Found &apos;Rahul Vendor&apos;</p>
                                            <button
                                                onClick={() => handleScanResult('+911234567890')}
                                                className="px-4 py-2 bg-green-500 rounded-lg text-sm font-bold"
                                            >
                                                Add Contact
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 max-w-xs">
                                Point camera at a user&apos;s QR code to instantly start a chat.
                            </p>
                        </div>
                    )}

                    {/* MY QR TAB */}
                    {activeTab === 'my-qr' && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="bg-white p-4 rounded-2xl shadow-lg mb-4 border border-slate-100">
                                {/* Placeholder for QR Code */}
                                <div className="w-48 h-48 relative">
                                    <Image
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=user-mock-id`}
                                        alt="My QR Code"
                                        fill
                                        className="object-contain"
                                        unoptimized // External URL
                                    />
                                </div>
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg">My Contact Code</h4>
                            <p className="text-sm text-slate-500 mt-1">Share this code to let others add you.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
