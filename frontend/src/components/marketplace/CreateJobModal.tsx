import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';

interface CreateJobProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateJobModal: React.FC<CreateJobProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        farm_id: 1, // Default for demo
        description: '',
        requirements: '',
        wage: '',
        wage_unit: 'per_day',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        positions: 1,
        job_type: 'Temporary', // Temporary, Permanent, Contract
        location: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.farmManagement.postJob({
                ...formData,
                wage: parseFloat(formData.wage),
                positions: parseInt(formData.positions as any),
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to post job", error);
            // alert('Failed to post job'); // In real app, show toast
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Post New Job Opportunity">
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Job Basics */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Job Title</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        placeholder="e.g. Tractor Driver, Harvest Helper"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Job Type</label>
                        <select
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.job_type}
                            onChange={e => setFormData({ ...formData, job_type: e.target.value })}
                        >
                            <option value="Temporary">Temporary</option>
                            <option value="Full Time">Full Time</option>
                            <option value="Contract">Contract</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Positions</label>
                        <input
                            type="number"
                            min="1"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.positions}
                            onChange={e => setFormData({ ...formData, positions: e.target.value as any })}
                        />
                    </div>
                </div>

                {/* Wage & Location */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Wage (₹)</label>
                        <input
                            type="number"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            placeholder="500"
                            value={formData.wage}
                            onChange={e => setFormData({ ...formData, wage: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Per</label>
                        <select
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.wage_unit}
                            onChange={e => setFormData({ ...formData, wage_unit: e.target.value })}
                        >
                            <option value="per_day">Day</option>
                            <option value="per_month">Month</option>
                            <option value="per_hour">Hour</option>
                            <option value="total">Total Contract</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Location</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        placeholder="City, Village or Farm Address"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                    <textarea
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white h-24"
                        placeholder="Describe the role and responsibilities..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                    <div>
                        <label className="block mb-1">Start Date</label>
                        <input
                            type="date"
                            className="w-full bg-slate-900 border border-white/10 rounded p-1"
                            value={formData.start_date}
                            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl mt-4 flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Job Opportunity"}
                </button>
            </form>
        </Modal>
    );
};
