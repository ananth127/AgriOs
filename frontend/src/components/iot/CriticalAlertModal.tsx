import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { AlertTriangle, Power } from 'lucide-react';

interface CriticalAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    alert: {
        title: string;
        message: string;
        device_name: string;
        timestamp?: string;
    } | null;
}

export const CriticalAlertModal: React.FC<CriticalAlertModalProps> = ({ isOpen, onClose, alert }) => {
    if (!alert) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Critical System Alert">
            <div className="flex flex-col items-center text-center space-y-4 p-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>

                <h3 className="text-xl font-bold text-red-600">
                    {alert.title}
                </h3>

                <div className="bg-red-50 border border-red-100 rounded-xl p-4 w-full text-left">
                    <div className="flex items-center gap-2 mb-2">
                        <Power className="w-4 h-4 text-red-500" />
                        <span className="font-bold text-slate-700">{alert.device_name}</span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        {alert.message}
                    </p>
                    {alert.timestamp && (
                        <p className="text-xs text-slate-400 mt-2 text-right">
                            {alert.timestamp}
                        </p>
                    )}
                </div>

                <div className="text-xs text-slate-400 max-w-xs">
                    The pump has been automatically stopped to prevent hardware damage or pipe bursting. Check valve configuration.
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all active:scale-95"
                >
                    Acknowledge & Dismiss
                </button>
            </div>
        </Modal>
    );
};
