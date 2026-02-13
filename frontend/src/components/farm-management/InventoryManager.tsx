import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AddInventoryModal } from './AddInventoryModal';
import { EditInventoryModal } from './EditInventoryModal';
import { api } from '@/lib/api';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const InventoryManager: React.FC<{ farmId: number }> = ({ farmId }) => {
    const t = useTranslations('FarmManagement');
    const [items, setItems] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const fetchInventory = useCallback(async () => {
        setLoading(true);
        try {
            let data = await api.farmManagement.getInventory(farmId) as any[];
            if (!Array.isArray(data)) data = [];

            if (data.length === 0) {
                // Auto-create default inventory
                const payload = {
                    name: "Urea Premium",
                    item_type: "Fertilizer",
                    quantity: 500,
                    unit: "kg",
                    cost_per_unit: 45,
                    farm_id: farmId,
                    purchase_date: new Date().toISOString().split('T')[0]
                };

                // Optimistic Update
                setItems([{ ...payload, id: Date.now() }]);

                try {
                    await api.farmManagement.addInventory(payload);
                    const newData = await api.farmManagement.getInventory(farmId) as any[];
                    if (Array.isArray(newData) && newData.length > 0) setItems(newData);
                } catch (createErr) {
                    console.error("Failed to persist default inventory", createErr);
                    // Keep optimistic
                }
            } else {
                setItems(data);
            }
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        } finally {
            setLoading(false);
        }
    }, [farmId]);

    const handleDelete = async (id: number) => {
        if (!confirm(t('confirm_delete_item'))) return;
        try {
            await api.farmManagement.deleteInventory(id);
            fetchInventory();
        } catch (error) {
            console.error("Delete failed", error);
            alert(t('error_delete_item'));
        }
    };

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    return (
        <>
            <Card className="w-full">
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>{t('inventory_title')}</CardTitle>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        {t('btn_add_stock')}
                    </button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">{t('loading_inventory')}</div>
                    ) : items.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">{t('empty_inventory')}</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map((item) => (
                                <div key={item.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 relative group">
                                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/50 p-1 rounded">
                                        <button
                                            onClick={() => setEditingItem(item)}
                                            className="text-blue-400 hover:text-blue-300"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                            {item.item_type}
                                        </span>
                                        <span className="text-sm text-gray-500">₹{item.cost_per_unit}/{item.unit}</span>
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{item.name}</h3>
                                    <p className="text-2xl font-semibold mt-2 text-gray-700 dark:text-gray-300">
                                        {item.quantity} <span className="text-sm font-normal text-gray-500">{item.unit}</span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            <AddInventoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchInventory}
                farmId={farmId}
            />
            {editingItem && (
                <EditInventoryModal
                    isOpen={!!editingItem}
                    onClose={() => setEditingItem(null)}
                    onSuccess={fetchInventory}
                    item={editingItem}
                />
            )}
        </>
    );
};
