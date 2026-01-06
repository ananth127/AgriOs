import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export const IoTControl: React.FC = () => {
    const [pumpStatus, setPumpStatus] = useState(false);
    const [valveStatus, setValveStatus] = useState<'A' | 'B' | 'None'>('None');

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Smart Irrigation Control</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pump Control */}
                    <div className="flex flex-col items-center justify-center p-6 border rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${pumpStatus ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Main Pump</h3>
                        <p className="text-sm text-gray-500 mb-4">{pumpStatus ? 'Running at 80% Load' : 'Switched Off'}</p>
                        <button
                            onClick={() => setPumpStatus(!pumpStatus)}
                            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${pumpStatus
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-green-500 hover:bg-green-600 text-white'
                                }`}
                        >
                            {pumpStatus ? 'Turn OFF' : 'Turn ON'}
                        </button>
                    </div>

                    {/* Valve Control */}
                    <div className="flex flex-col p-6 border rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Valve Control</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Field A (Wheat)</span>
                                <button
                                    onClick={() => setValveStatus(valveStatus === 'A' ? 'None' : 'A')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${valveStatus === 'A' ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${valveStatus === 'A' ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Field B (Fallow)</span>
                                <button
                                    onClick={() => setValveStatus(valveStatus === 'B' ? 'None' : 'B')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${valveStatus === 'B' ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${valveStatus === 'B' ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Water Pressure</span>
                                <span className="font-medium text-gray-900 dark:text-white">45 PSI</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
