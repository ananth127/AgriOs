import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CreateLoanModal } from './CreateLoanModal';
import { api } from '@/lib/api';

interface Loan {
    id: number;
    purpose: string;
    amount: number;
    outstanding_balance: number;
    interest_rate: number;
    duration_months: number;
}

export const LoanManager: React.FC<{ farmId: number }> = ({ farmId }) => {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchLoans = async () => {
        setLoading(true);
        try {
            const data = await api.farmManagement.getLoans(farmId);
            setLoans(data);
        } catch (error) {
            console.error("Failed to fetch loans", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLoans();
    }, [farmId]);

    return (
        <>
            <Card className="w-full">
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>Active Loans</CardTitle>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        + New Loan
                    </button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading loans...</div>
                    ) : loans.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No active loans found. Create one to get started.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Purpose</th>
                                        <th scope="col" className="px-6 py-3">Amount</th>
                                        <th scope="col" className="px-6 py-3">Balance</th>
                                        <th scope="col" className="px-6 py-3">Interest</th>
                                        <th scope="col" className="px-6 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loans.map((loan) => (
                                        <tr key={loan.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                                {loan.purpose}
                                            </th>
                                            <td className="px-6 py-4">₹{loan.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-red-500 font-bold">
                                                ₹{(loan.outstanding_balance || loan.amount).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">{loan.interest_rate}%</td>
                                            <td className="px-6 py-4">
                                                <button className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Repay</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <CreateLoanModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchLoans}
                farmId={farmId}
            />
        </>
    );
};
