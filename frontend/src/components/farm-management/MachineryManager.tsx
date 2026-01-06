import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AddAssetModal } from './AddAssetModal';
import { EditAssetModal } from './EditAssetModal';
import { api } from '@/lib/api';
import { Pencil, Trash2 } from 'lucide-react';

export const MachineryManager: React.FC<{ farmId: number }> = ({ farmId }) => {
    const [assets, setAssets] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingAsset, setEditingAsset] = useState<any>(null);

    const fetchAssets = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.farmManagement.getAssets(farmId);
            setAssets(data as any);
        } catch (error) {
            console.error("Failed to fetch assets", error);
        } finally {
            setLoading(false);
        }
    }, [farmId]);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this asset?")) return;
        try {
            await api.farmManagement.deleteAsset(id);
            fetchAssets();
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete asset");
        }
    };

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    return (
        <>
            <Card className="w-full">
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>Tractor & Machinery</CardTitle>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        + Add Asset
                    </button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading assets...</div>
                    ) : assets.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No machinery added. Add tractors, pumps, etc.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {assets.map((asset) => (
                                <div key={asset.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 relative group">
                                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/50 p-1 rounded">
                                        <button
                                            onClick={() => setEditingAsset(asset)}
                                            className="text-blue-400 hover:text-blue-300"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(asset.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{asset.name}</h3>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded ${asset.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {asset.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">{asset.asset_type}</p>
                                    <div className="mt-3 text-sm text-gray-500">
                                        <p>Purchase Cost: ₹{asset.cost.toLocaleString()}</p>
                                        {asset.is_iot_enabled && (
                                            <p className="text-blue-500 flex items-center gap-1 mt-1">
                                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> IoT Connected
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            <AddAssetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchAssets}
                farmId={farmId}
            />
            {editingAsset && (
                <EditAssetModal
                    isOpen={!!editingAsset}
                    onClose={() => setEditingAsset(null)}
                    onSuccess={fetchAssets}
                    asset={editingAsset}
                />
            )}
        </>
    );
};
