import React, { useState, useEffect } from 'react';
import { Camera, X } from 'lucide-react';

interface QRScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (deviceId: string) => void;
}

export const QRScannerModal: React.FC<QRScannerProps> = ({ isOpen, onClose, onScanSuccess }) => {
    const [scanning, setScanning] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setScanning(true); // Reset on open
            const timer = setTimeout(() => {
                setScanning(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleOpenControls = () => {
        // Pass a mock ID or detected ID
        onScanSuccess("PUMP-101-MOCK");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
            <button onClick={onClose} className="absolute top-4 right-4 text-white p-2 bg-white/10 rounded-full">
                <X className="w-6 h-6" />
            </button>

            <div className="relative w-full max-w-sm aspect-square bg-black rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl">
                {scanning ? (
                    <>
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1626309852026-666d95368a5c?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-50 blur-sm"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-48 h-48 border-2 border-green-500 rounded-2xl relative">
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-500 -mt-1 -ml-1"></div>
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-500 -mt-1 -mr-1"></div>
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-500 -mb-1 -ml-1"></div>
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500 -mb-1 -mr-1"></div>
                                <div className="w-full h-1 bg-green-500/50 absolute top-0 animate-scan"></div>
                            </div>
                        </div>
                        <p className="absolute bottom-8 left-0 right-0 text-center text-white font-medium">Align QR code within frame</p>
                    </>
                ) : (
                    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-center p-6 space-y-4">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-2">
                            <span className="text-2xl">✓</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">Device Found</h3>
                        <p className="text-slate-400 text-sm">Pump Station A-1</p>
                        <button
                            onClick={handleOpenControls}
                            className="bg-white text-slate-900 font-bold py-3 px-8 rounded-xl w-full hover:bg-slate-200 transition-colors"
                        >
                            Open Controls
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-8 flex gap-4 text-white/50 text-sm">
                <span>Scan</span>
                <span>My Code</span>
                <span>History</span>
            </div>

            <style jsx>{`
                @keyframes scan {
                    0% { top: 10%; opacity: 0; }
                    50% { opacity: 1; }
                    100% { top: 90%; opacity: 0; }
                }
                .animate-scan {
                    animation: scan 2s linear infinite;
                }
            `}</style>
        </div>
    );
};
