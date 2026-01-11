"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
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
    const t = useTranslations('FarmManagement');
    const [loans, setLoans] = useState<Loan[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchLoans = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.farmManagement.getLoans(farmId);
            setLoans(data as any);
        } catch (error) {
            console.error("Failed to fetch loans", error);
        } finally {
            setLoading(false);
        }
    }, [farmId]);

    useEffect(() => {
        fetchLoans();
    }, [fetchLoans]);

    return (
        <>
            <Card className="w-full">
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>{t('active_loans')}</CardTitle>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        {t('apply_loan')}
                    </button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">{t('loading_loans')}</div>
                    ) : loans.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">{t('no_loans')}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">{t('col_purpose')}</th>
                                        <th scope="col" className="px-6 py-3">{t('col_amount')}</th>
                                        <th scope="col" className="px-6 py-3">{t('col_balance')}</th>
                                        <th scope="col" className="px-6 py-3">{t('col_interest')}</th>
                                        <th scope="col" className="px-6 py-3">{t('col_action')}</th>
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
                                                <button className="font-medium text-blue-600 dark:text-blue-500 hover:underline">{t('btn_repay')}</button>
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
