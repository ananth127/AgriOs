import React from 'react';
import { Card, CardContent } from "@/components/ui/Card";

interface FinancialStats {
    totalInvestment: number;
    totalRevenue: number;
    netProfit: number;
    projectedProfit: number;
}

export const FinancialDashboard: React.FC<{ stats: FinancialStats }> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                <CardContent>
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Investment</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">₹{stats.totalInvestment.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">across all crops</div>
                </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                <CardContent>
                    <div className="text-sm font-medium text-green-600 dark:text-green-400">Total Revenue</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">₹{stats.totalRevenue.toLocaleString()}</div>
                    <div className="text-xs text-green-600 mt-1 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" /></svg>
                        Last Season
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200">
                <CardContent>
                    <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Net Profit</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">₹{stats.netProfit.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">Realized</div>
                </CardContent>
            </Card>

            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200">
                <CardContent>
                    <div className="text-sm font-medium text-amber-600 dark:text-amber-400">Projected Profit</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">₹{stats.projectedProfit.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">Current Season</div>
                </CardContent>
            </Card>
        </div>
    );
};
