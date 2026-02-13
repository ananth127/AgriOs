import React from 'react';
import { api } from '@/lib/api';
import { AddHealthLogModal } from './AddHealthLogModal';
import { X, Calendar, Weight, Ruler, Activity, QrCode, FileText, Edit, Syringe, Milk, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Card } from '@/components/ui/Card';
import { Link } from '@/navigation';

interface LivestockDetailModalProps {
    animal: any;
    onClose: () => void;
    onEdit: () => void;
    onLogProduction: () => void;
    onDelete: () => void;
    onPrintQr?: (animal: any) => void;
    onSell: (animal: any) => void;
}

export const LivestockDetailModal: React.FC<LivestockDetailModalProps> = ({ animal: initialAnimal, onClose, onEdit, onLogProduction, onDelete, onPrintQr, onSell }) => {
    const [animal, setAnimal] = React.useState(initialAnimal);
    const [loading, setLoading] = React.useState(true);
    const [isAddHealthOpen, setIsAddHealthOpen] = React.useState(false);

    React.useEffect(() => {
        if (initialAnimal?.id) {
            api.livestock.get(initialAnimal.id)
                .then(data => {
                    setAnimal(data);
                    setLoading(false);
                })
                .catch(err => console.error("Failed to load details", err));
        }
    }, [initialAnimal]);

    if (!animal) return null;

    const calculateAge = (dobStr: string) => {
        if (!dobStr) return 'Unknown';
        const dob = new Date(dobStr);
        const diff = Date.now() - dob.getTime();
        const ageDate = new Date(diff);
        const years = Math.abs(ageDate.getUTCFullYear() - 1970);
        const months = ageDate.getUTCMonth();
        return years > 0 ? `${years}y ${months}m` : `${months}m`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">

                {/* Left Side: Visuals & Key Info */}
                <div className="w-full md:w-1/3 bg-slate-950 p-6 flex flex-col items-center border-b md:border-b-0 md:border-r border-white/10 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 md:hidden p-2 bg-slate-800 rounded-full text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-blue-500 p-1 mb-4 shadow-lg shadow-green-900/20">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                            {/* Placeholder for Image */}
                            <span className="text-4xl">🐮</span>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white text-center">{animal.name || 'Unnamed'}</h2>
                    <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-mono mt-2 mb-6">
                        {animal.tag_id}
                    </div>

                    <div className="w-full grid grid-cols-2 gap-3 mb-6">
                        <div className="p-3 bg-slate-900 rounded-xl border border-white/5 text-center">
                            <p className="text-xs text-slate-500 uppercase">Status</p>
                            <p className="text-green-400 font-bold">{animal.health_status}</p>
                        </div>
                        <div className="p-3 bg-slate-900 rounded-xl border border-white/5 text-center">
                            <p className="text-xs text-slate-500 uppercase">Gender</p>
                            <p className="text-white font-bold">{animal.gender}</p>
                        </div>
                    </div>


                    {/* QR Code Preview */}
                    <div className="mt-auto w-full">
                        <div
                            id="detail-qr-container"
                            className="p-4 bg-white rounded-xl mb-3 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => onPrintQr && onPrintQr(animal)}
                        >
                            <QRCode
                                value={`https://agrios-web.vercel.app/en/verify/${animal.farm_id || '1'}/${animal.id}`}
                                size={120}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                viewBox={`0 0 256 256`}
                            />
                        </div>
                        <p className="text-center text-xs text-slate-500">Tap QR to Print / Download</p>
                    </div>
                </div>

                {/* Right Side: Details & History */}
                <div className="w-full md:w-2/3 bg-slate-900 p-6 md:p-8 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <p className="text-slate-400 text-sm">Detailed Profile</p>
                            <h3 className="text-xl font-bold text-white">General Information</h3>
                        </div>
                        <button onClick={onClose} className="hidden md:block p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                        <DetailItem icon={<Activity className="w-5 h-5 text-blue-400" />} label="Breed" value={animal.breed} />
                        <DetailItem icon={<Calendar className="w-5 h-5 text-purple-400" />} label="Age" value={calculateAge(animal.date_of_birth)} />
                        <DetailItem icon={<Weight className="w-5 h-5 text-orange-400" />} label="Weight" value={`${animal.weight_kg} kg`} />
                        <DetailItem icon={<Ruler className="w-5 h-5 text-indigo-400" />} label="Origin" value={animal.origin} />
                    </div>

                    {/* Nutritional Plan (Chain Link) */}
                    <div className="mb-8 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                        <h3 className="text-lg font-bold text-amber-200 mb-3 flex items-center gap-2">
                            <span className="text-xl">🌾</span> Nutritional Plan & Feed
                        </h3>
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-medium text-slate-300">Daily Intake Recommendations</p>
                                    {animal.housing && (
                                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-white/10">{animal.housing.name}</span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mb-2">Based on {animal.age || 'Current Age'}</p>

                                {animal.feed_plans && animal.feed_plans.length > 0 ? (
                                    <ul className="space-y-1">
                                        {animal.feed_plans.map((plan: any) => (
                                            <li key={plan.id} className="text-sm text-white flex items-center gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full ${plan.auto_feeder_enabled ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                                                {plan.feed_item_name} - {plan.quantity_per_day} kg
                                                {plan.housing_id && <span className="text-[10px] text-slate-500 ml-1">(Group)</span>}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No specific feed plans assigned.</p>
                                )}
                            </div>
                            <div className="w-full md:w-auto">
                                <Link
                                    href="/crops"
                                    onClick={onClose}
                                    className="flex items-center gap-2 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 px-4 py-3 rounded-xl border border-amber-600/30 transition-all text-sm font-bold"
                                >
                                    Check Fodder Stock <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                        <div className="flex flex-wrap gap-3">
                            <ActionBtn onClick={onLogProduction} icon={<Milk className="w-4 h-4" />} label="Log Production" color="bg-blue-600 hover:bg-blue-500" />
                            <ActionBtn onClick={() => onSell(animal)} icon={<ShoppingBag className="w-4 h-4" />} label="Sell" color="bg-indigo-600 hover:bg-indigo-500" />
                            <ActionBtn onClick={() => setIsAddHealthOpen(true)} icon={<Syringe className="w-4 h-4" />} label="Add Health Record" color="bg-emerald-600 hover:bg-emerald-500" />
                            <ActionBtn onClick={onEdit} icon={<Edit className="w-4 h-4" />} label="Edit" color="bg-slate-700 hover:bg-slate-600" />
                            <ActionBtn onClick={onDelete} icon={<Trash2 className="w-4 h-4" />} label="Delete" color="bg-red-900/50 hover:bg-red-900 text-red-200" />
                        </div>
                    </div>

                    {/* Medical & Activity History */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Medical & Activity History</h3>
                            <button
                                onClick={() => setIsAddHealthOpen(true)}
                                className="text-xs text-blue-400 hover:text-blue-300"
                            >
                                + Add Record
                            </button>
                        </div>
                        <div className="space-y-4 relative pl-4 border-l-2 border-slate-800">
                            {animal.health_logs && animal.health_logs.length > 0 ? (
                                animal.health_logs.map((log: any) => (
                                    <HistoryItem
                                        key={log.id}
                                        title={log.event_type}
                                        date={log.date}
                                        desc={log.description}
                                        cost={log.cost}
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 italic">No health records found.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <AddHealthLogModal
                isOpen={isAddHealthOpen}
                onClose={() => setIsAddHealthOpen(false)}
                animal={animal}
                onSuccess={() => {
                    api.livestock.get(animal.id).then(setAnimal);
                }}
            />
        </div>
    );
};

const DetailItem = ({ icon, label, value }: any) => (
    <div className="flex items-center gap-3">
        <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
        <div>
            <p className="text-xs text-slate-500 uppercase">{label}</p>
            <p className="font-medium text-white">{value || 'N/A'}</p>
        </div>
    </div>
);

const ActionBtn = ({ onClick, icon, label, color }: any) => (
    <button onClick={onClick} className={`${color} px-4 py-2.5 rounded-xl text-white text-sm font-medium flex items-center gap-2 transition-all active:scale-95`}>
        {icon} {label}
    </button>
);

const HistoryItem = ({ title, date, desc, cost }: any) => (
    <div className="relative">
        <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-slate-900 ${title === 'Vaccination' ? 'bg-emerald-500' :
                title === 'Sickness' || title === 'Injury' ? 'bg-red-500' :
                    title === 'Checkup' ? 'bg-blue-500' : 'bg-slate-500'
            }`}></div>
        <div className="flex justify-between items-start">
            <p className="text-sm font-bold text-white">{title} <span className="text-xs font-normal text-slate-500 ml-2">{new Date(date).toLocaleDateString()}</span></p>
            {cost > 0 && <span className="text-xs text-slate-400 font-mono">${Number(cost).toFixed(2)}</span>}
        </div>
        <p className="text-sm text-slate-400 mt-1">{desc}</p>
    </div>
);
