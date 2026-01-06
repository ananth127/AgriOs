import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AddInventoryModal } from './AddInventoryModal';
import { EditInventoryModal } from './EditInventoryModal';
import { api } from '@/lib/api';
import { Pencil, Trash2 } from 'lucide-react';

export const InventoryManager: React.FC<{ farmId: number }> = ({ farmId }) => {
    const [items, setItems] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const data = await api.farmManagement.getInventory(farmId);
            setItems(data as any);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            await api.farmManagement.deleteInventory(id);
            fetchInventory();
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete item");
        }
    };

    useEffect(() => {
        fetchInventory();
    }, [farmId]);

    return (
        <>
            <Card className="w-full">
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>Inventory Management</CardTitle>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        + Add Stock
                    </button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading inventory...</div>
                    ) : items.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">Inventory is empty. Add fertilizers, seeds, etc.</div>
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
