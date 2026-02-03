import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { Loader2, CreditCard, Truck, MapPin } from 'lucide-react';
import { api } from '@/lib/api';

interface PurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: any;
    onSuccess: () => void;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, item, onSuccess }) => {
    // const t = useTranslations('Marketplace'); // Fallback if regular text needed
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [address, setAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cod');

    if (!item) return null;

    const total = (parseFloat(item.price) * quantity).toFixed(2);

    const handlePurchase = async () => {
        setLoading(true);
        // Simulate API call delay
        await new Promise(r => setTimeout(r, 1500));

        // In a real app, we would call the API:
        // await api.marketplace.orders.create({
        //     listing_id: item.id,
        //     quantity,
        //     total_price: total,
        //     address
        // });

        // For DEMO: Save to localStorage so Track & Trace can pick it up
        const newOrder = {
            id: `ORD-${Date.now().toString().slice(-4)}`,
            product_name: item.product_name,
            status: 'Confirmed', // Initial status
            date: new Date().toISOString().split('T')[0],
            seller: `Seller #${item.seller_id || 'Unknown'}`,
            eta: '3 Days',
            step: 1, // Progress step
            image_url: item.image_url,
            quantity: quantity,
            total: total
        };

        const existingmode = localStorage.getItem('demo_orders');
        const orders = existingmode ? JSON.parse(existingmode) : [];
        orders.push(newOrder);
        localStorage.setItem('demo_orders', JSON.stringify(orders));

        setLoading(false);
        setStep(3); // Success Screen
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={step === 3 ? "Order Placed!" : "Complete Purchase"}>
            <div className="space-y-4">

                {/* Step 1: Review & Address */}
                {step === 1 && (
                    <>
                        {/* Item Summary */}
                        <div className="flex gap-4 bg-slate-900 border border-white/10 p-3 rounded-lg">
                            <div className="w-16 h-16 bg-slate-800 rounded-md overflow-hidden">
                                {item.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.image_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-xl">📦</div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-white">{item.product_name}</h3>
                                <p className="text-emerald-400 font-mono">₹{item.price} <span className="text-slate-500 text-xs">/ {item.unit}</span></p>
                            </div>
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Quantity</label>
                            <input
                                type="number"
                                min="1"
                                max={item.quantity}
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value))}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Delivery Address</label>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Enter full farm address..."
                                className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white h-20"
                            />
                        </div>

                        <div className="pt-2 flex justify-between items-center border-t border-white/5">
                            <span className="text-slate-400">Total:</span>
                            <span className="text-xl font-bold text-white">₹{total}</span>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={!address}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl mt-2 transition-all"
                        >
                            Proceed to Payment
                        </button>
                    </>
                )}

                {/* Step 2: Payment */}
                {step === 2 && (
                    <>
                        <div className="space-y-3">
                            <p className="text-sm text-slate-400 mb-2">Select Payment Method</p>

                            <button
                                onClick={() => setPaymentMethod('upi')}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${paymentMethod === 'upi' ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-slate-900 border-white/10 text-slate-400'}`}
                            >
                                <span className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">₹</div> UPI / NetBanking</span>
                                {paymentMethod === 'upi' && <div className="w-4 h-4 rounded-full bg-emerald-500"></div>}
                            </button>

                            <button
                                onClick={() => setPaymentMethod('cod')}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${paymentMethod === 'cod' ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-slate-900 border-white/10 text-slate-400'}`}
                            >
                                <span className="flex items-center gap-3"><Truck className="w-5 h-5" /> Cash on Delivery</span>
                                {paymentMethod === 'cod' && <div className="w-4 h-4 rounded-full bg-emerald-500"></div>}
                            </button>
                        </div>

                        <div className="mt-4 bg-slate-900 p-4 rounded-lg flex justify-between items-center">
                            <span className="text-slate-400">Amount to Pay:</span>
                            <span className="text-2xl font-bold text-white">₹{total}</span>
                        </div>

                        <div className="flex gap-3 mt-2">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl"
                            >
                                Back
                            </button>
                            <button
                                onClick={handlePurchase}
                                disabled={loading}
                                className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {loading ? 'Processing...' : `Pay ₹${total}`}
                            </button>
                        </div>
                    </>
                )}

                {/* Step 3: Success */}
                {step === 3 && (
                    <div className="text-center py-6">
                        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Truck className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Order Confirmed!</h3>
                        <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">Your order for <b>{item.product_name}</b> has been placed successfully. You can track its status in the Track & Trace dashboard.</p>

                        <button
                            onClick={() => {
                                onSuccess();
                                onClose();
                            }}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl"
                        >
                            Back to Marketplace
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};
