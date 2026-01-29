import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import { Download, Printer, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface QrPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    animal: any;
}

export const QrPrintModal: React.FC<QrPrintModalProps> = ({ isOpen, onClose, animal }) => {
    const qrRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContent = qrRef.current;
        if (!printContent) return;

        const win = window.open('', '', 'height=600,width=800');
        if (win) {
            win.document.write('<html><head><title>Print QR</title>');
            win.document.write('<style>body { font-family: sans-serif; text-align: center; } .tag-container { border: 2px solid black; display: inline-block; padding: 20px; border-radius: 10px; } .tag-header { font-size: 24px; font-weight: bold; margin-bottom: 10px; } .tag-details { font-size: 14px; margin-top: 10px; } </style>');
            win.document.write('</head><body>');
            win.document.write(printContent.innerHTML);
            win.document.write('</body></html>');
            win.document.close();
            win.focus();
            win.print();
        }
    };

    const handleDownload = () => {
        const svg = document.getElementById("qr-code-svg");
        if (!svg) return;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        img.onload = () => {
            const padding = 20;
            const extraBottom = 40; // Space for text
            canvas.width = img.width + (padding * 2);
            canvas.height = img.height + (padding * 2) + extraBottom;

            if (ctx) {
                // Background
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw QR
                ctx.drawImage(img, padding, padding);

                // Draw Text
                ctx.font = "bold 16px Arial";
                ctx.fillStyle = "black";
                ctx.textAlign = "center";

                const label = `${animal.name || 'Animal'} - ${animal.tag_id}`;
                ctx.fillText(label, canvas.width / 2, canvas.height - 15);

                // Download
                const pngUrl = canvas.toDataURL("image/png");
                const a = document.createElement("a");
                a.download = `QR-${animal.tag_id}.png`;
                a.href = pngUrl;
                a.click();
            }
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    if (!animal) return null;

    // Construct Public Verify URL
    // Format: {origin}/[locale]/verify/[farmerId]/[animalId]
    // We need to access parameters. For now, assume locale='en' (default) or grab it if possible.
    // Also, we need farmId. Assuming animal.farm_id exists or falling back to '1' for demo.

    // Use a safe origin check for SSR
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://agrios.com';
    const farmId = animal.farm_id || 1;
    const qrValue = `${origin}/en/verify/${farmId}/${animal.id}`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Print Animal Tag">
            <div className="flex flex-col items-center justify-center space-y-6 p-4">

                {/* Visual Preview */}
                <div ref={qrRef} className="bg-white p-6 rounded-xl border border-dashed border-slate-300 shadow-xl max-w-sm w-full text-center">
                    <div className="tag-container border-2 border-black p-4 rounded-lg inline-block">
                        <div className="tag-header font-bold text-xl uppercase mb-2 text-black">{animal.tag_id}</div>
                        <div className="bg-white p-2 flex justify-center">
                            <QRCode
                                id="qr-code-svg"
                                value={qrValue}
                                size={150}
                            />
                        </div>
                        <div className="tag-details text-sm mt-2 text-black">
                            <p className="font-bold">{animal.species} • {animal.breed}</p>
                            <p className="text-xs mt-1">Scan for Health Logs</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 w-full">
                    <button
                        onClick={handlePrint}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-colors"
                    >
                        <Printer className="w-5 h-5" /> Print Tag
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-colors border border-white/10"
                    >
                        <Download className="w-5 h-5" /> Download
                    </button>
                </div>
            </div>
        </Modal>
    );
};
