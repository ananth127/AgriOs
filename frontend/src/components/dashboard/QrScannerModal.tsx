import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, ScanLine, AlertCircle } from 'lucide-react';
import { useRouter } from '@/navigation';

interface QrScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose }) => {
    const router = useRouter();
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        // Small delay to ensure DOM is ready
        const timeoutId = setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );

            scanner.render(
                (decodedText) => {
                    setScanResult(decodedText);
                    scanner.clear();
                    handleScan(decodedText);
                },
                (errorMessage) => {
                    // console.warn(errorMessage); // Ignore scan errors as they happen every frame
                }
            );

            return () => {
                scanner.clear().catch(err => console.error("Failed to clear scanner", err));
            };
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [isOpen]);

    const handleScan = (data: string) => {
        console.log("Scanned:", data);
        let animalId: string | null = null;

        try {
            if (data.includes('/verify/')) {
                // Parse URL: .../verify/[farmId]/[animalId]
                const parts = data.split('/verify/')[1].split('/');
                if (parts.length >= 2) {
                    animalId = parts[1];
                }
            } else if (data.startsWith('agrios://livestock/')) {
                animalId = data.split('agrios://livestock/')[1];
            } else if (!isNaN(Number(data))) {
                animalId = data;
            }
        } catch (e) {
            console.error("Parse error", e);
        }

        if (animalId) {
            onClose();
            router.push(`/livestock?animalId=${animalId}`);
        } else {
            if (data.startsWith('http')) {
                window.location.href = data;
            } else {
                setError("Invalid or Unrecognized QR Code");
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-red-500/20 z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6 text-center">
                    <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                        <ScanLine className="w-6 h-6 text-green-500" />
                        Scan QR Code
                    </h2>
                    <p className="text-slate-400 text-sm mb-6">
                        Point your camera at a livestock tag QR code
                    </p>

                    <div id="reader" className="overflow-hidden rounded-xl border-2 border-dashed border-slate-700 bg-black"></div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-500/10 text-red-400 rounded-lg text-sm flex items-center gap-2 justify-center">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
