import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface QRScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);

    useEffect(() => {
        // Initialize scanner
        // Use a unique ID for the element
        const elementId = "qr-reader";

        if (!scannerRef.current) {
            const scanner = new Html5QrcodeScanner(
                elementId,
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );

            scanner.render(
                (decodedText) => {
                    // Success callback
                    scanner.clear().then(() => {
                        onScanSuccess(decodedText);
                    }).catch(console.error);
                },
                (errorMessage) => {
                    // Error callback (scanning in progress...)
                    // We typically ignore these as they happen every frame no QR is found
                    // setScanError(errorMessage);
                }
            );

            scannerRef.current = scanner;
        }

        // Cleanup
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode scanner. ", error);
                });
                scannerRef.current = null;
            }
        };
    }, [onScanSuccess]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-lg dark:text-white">Scan Device QR</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 dark:text-gray-400" />
                    </button>
                </div>

                <div className="p-4 bg-black">
                    <div id="qr-reader" className="w-full"></div>
                </div>

                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>Point your camera at the QR code on the valve or pump.</p>
                </div>
            </div>
        </div>
    );
};
