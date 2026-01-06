import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CreateLaborJobModal } from './CreateLaborJobModal';
import { api } from '@/lib/api';
import { Trash2, Users } from 'lucide-react';

export const LaborManager: React.FC = () => {
    const [jobs, setJobs] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const farmId = 1; // Default

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const data = await api.farmManagement.getJobs(farmId);
            setJobs(data as any);
        } catch (error) {
            console.error("Failed to fetch jobs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Close this job position?")) return;
        try {
            await api.farmManagement.deleteJob(id);
            fetchJobs();
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    return (
        <>
            <Card className="w-full">
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>Labor Management</CardTitle>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Post New Job
                    </button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading jobs...</div>
                    ) : jobs.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <p>No active job listings.</p>
                            <p className="text-xs mt-2 text-slate-600">Post a job to find workers.</p>
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
                                            {job.required_count} Workers needed • ₹{job.wage_per_day}/day • {job.duration_days} Days
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold dark:text-white">{job.filled_count}/{job.required_count}</p>
                                            <p className="text-xs text-gray-500">Filled</p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(job.id)}
                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                                            title="Close Job"
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
                    alert("Job Posted Successfully!");
                }}
            />
        </>
    );
};
