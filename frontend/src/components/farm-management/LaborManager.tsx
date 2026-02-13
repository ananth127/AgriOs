import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CreateLaborJobModal } from './CreateLaborJobModal';
import { api } from '@/lib/api';
import { Trash2, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const LaborManager: React.FC = () => {
    const t = useTranslations('FarmManagement');
    const [jobs, setJobs] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [farmId, setFarmId] = useState<number | null>(null);

    useEffect(() => {
        api.farmManagement.getUserFarmId()
            .then(res => {
                if (res.farm_id) setFarmId(res.farm_id);
            })
            .catch(err => console.error("Failed to load user farm ID", err));
    }, []);

    const fetchJobs = async () => {
        if (!farmId) return;
        setLoading(true);
        try {
            let data = await api.farmManagement.getJobs(farmId) as any[];
            if (!Array.isArray(data)) data = [];

            if (data.length === 0) {
                // Auto-create default job
                const payload = {
                    title: "Harvest Helpers",
                    description: "Looking for help with wheat harvesting.",
                    wage_per_day: 450,
                    duration_days: 5,
                    start_date: new Date().toISOString().split('T')[0],
                    required_count: 3,
                    farm_id: farmId,
                    provides_food: false,
                    provides_travel: false
                };

                // Optimistic Update
                setJobs([{ ...payload, id: Date.now(), filled_count: 0, status: 'Open' }]);

                try {
                    await api.farmManagement.postJob(payload);
                    const newData = await api.farmManagement.getJobs(farmId) as any[];
                    if (Array.isArray(newData) && newData.length > 0) setJobs(newData);
                } catch (createErr) {
                    console.error("Failed to persist default job", createErr);
                    // Keep optimistic
                }
            } else {
                setJobs(data);
            }
        } catch (error) {
            console.error("Failed to fetch jobs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('confirm_close_job'))) return;
        try {
            await api.farmManagement.deleteJob(id);
            fetchJobs();
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    useEffect(() => {
        if (farmId) fetchJobs();
    }, [farmId]);

    return (
        <>
            <Card className="w-full">
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>{t('labor_title')}</CardTitle>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        disabled={!farmId}
                        className={`px-3 py-2 text-white rounded-lg text-sm font-medium transition-colors ${!farmId ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {t('btn_post_new_job')}
                    </button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">{t('loading_jobs')}</div>
                    ) : jobs.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <p>{t('no_jobs')}</p>
                            <p className="text-xs mt-2 text-slate-600">{t('post_job_hint')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {jobs.map((job) => (
                                <div key={job.id} className="flex justify-between items-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg dark:text-white">{job.title}</h3>
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{job.status}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {job.required_count} {t('text_workers_needed')} • ₹{job.wage_per_day}{t('text_per_day')} • {job.duration_days} {t('text_days')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold dark:text-white">{job.filled_count}/{job.required_count}</p>
                                            <p className="text-xs text-gray-500">{t('text_filled')}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(job.id)}
                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                                            title={t('tooltip_close_job')}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            <CreateLaborJobModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchJobs();
                    alert(t('success_post_job'));
                }}
                farmId={farmId || 0}
            />
        </>
    );
};
