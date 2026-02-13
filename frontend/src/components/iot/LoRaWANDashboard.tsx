/**
 * LoRaWAN Network Dashboard
 * Real-time monitoring of gateways, nodes, and signal quality
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Radio,
    Wifi,
    WifiOff,
    Signal,
    Battery,
    Thermometer,
    Droplets,
    RefreshCw,
    Plus,
    ChevronRight,
    AlertCircle,
    CheckCircle,
} from 'lucide-react';

interface Gateway {
    id: number;
    gateway_id: string;
    name: string;
    hardware_type: string;
    frequency_plan: string;
    is_online: boolean;
    last_seen: string | null;
    rx_packets_total: number;
    tx_packets_total: number;
}

interface Node {
    id: number;
    dev_eui: string;
    name: string;
    node_type: string;
    sensor_type: string | null;
    is_online: boolean;
    battery_level: number | null;
    rssi: number | null;
    snr: number | null;
    last_seen: string | null;
    last_telemetry: Record<string, unknown>;
    zone: string | null;
}

interface NetworkHealth {
    gateways_total: number;
    gateways_online: number;
    nodes_total: number;
    nodes_online: number;
    average_rssi: number;
    average_snr: number;
    network_coverage: number;
}

interface LoRaWANDashboardProps {
    apiBaseUrl?: string;
}

export function LoRaWANDashboard({ apiBaseUrl = '/api/v1' }: LoRaWANDashboardProps) {
    const [gateways, setGateways] = useState<Gateway[]>([]);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [health, setHealth] = useState<NetworkHealth | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedGateway, setSelectedGateway] = useState<number | null>(null);

    // Fetch data
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

            const [gatewaysRes, nodesRes, healthRes] = await Promise.all([
                fetch(`${apiBaseUrl}/iot/lorawan/gateways`, { headers }),
                fetch(`${apiBaseUrl}/iot/lorawan/nodes`, { headers }),
                fetch(`${apiBaseUrl}/iot/lorawan/health`, { headers }),
            ]);

            if (gatewaysRes.ok) {
                setGateways(await gatewaysRes.json());
            }
            if (nodesRes.ok) {
                setNodes(await nodesRes.json());
            }
            if (healthRes.ok) {
                setHealth(await healthRes.json());
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            setIsLoading(false);
        }
    }, [apiBaseUrl]);

    useEffect(() => {
        fetchData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Get signal quality indicator
    const getSignalQuality = (rssi: number | null) => {
        if (!rssi) return { color: 'text-gray-400', label: 'Unknown' };
        if (rssi > -70) return { color: 'text-green-500', label: 'Excellent' };
        if (rssi > -90) return { color: 'text-yellow-500', label: 'Good' };
        if (rssi > -110) return { color: 'text-orange-500', label: 'Fair' };
        return { color: 'text-red-500', label: 'Poor' };
    };

    // Get battery indicator
    const getBatteryColor = (level: number | null) => {
        if (!level) return 'text-gray-400';
        if (level > 50) return 'text-green-500';
        if (level > 20) return 'text-yellow-500';
        return 'text-red-500';
    };

    // Format last seen
    const formatLastSeen = (lastSeen: string | null) => {
        if (!lastSeen) return 'Never';
        const date = new Date(lastSeen);
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    // Filter nodes by gateway
    const filteredNodes = selectedGateway
        ? nodes.filter((n) => n.zone === `gateway_${selectedGateway}`)
        : nodes;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Radio className="w-8 h-8 text-purple-500" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">LoRaWAN Network</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Long-range IoT sensor network management
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchData}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-2 text-red-700 dark:text-red-300">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Network Health Overview */}
            {health && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Gateways</span>
                            <Radio className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {health.gateways_online}
                            </span>
                            <span className="text-sm text-gray-500">/ {health.gateways_total}</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Nodes</span>
                            <Signal className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {health.nodes_online}
                            </span>
                            <span className="text-sm text-gray-500">/ {health.nodes_total}</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Avg RSSI</span>
                            <Wifi className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="mt-2">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {health.average_rssi.toFixed(0)} dBm
                            </span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Coverage</span>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="mt-2">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {health.network_coverage.toFixed(0)}%
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Gateways */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Radio className="w-5 h-5 text-purple-500" />
                        Gateways
                    </h3>
                    <button className="text-sm text-purple-500 hover:text-purple-600 flex items-center gap-1">
                        <Plus className="w-4 h-4" />
                        Add Gateway
                    </button>
                </div>

                <div className="divide-y dark:divide-gray-700">
                    {gateways.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Radio className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No gateways registered yet</p>
                            <p className="text-sm">Add a gateway to start collecting sensor data</p>
                        </div>
                    ) : (
                        gateways.map((gateway) => (
                            <div
                                key={gateway.id}
                                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors ${selectedGateway === gateway.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                                    }`}
                                onClick={() => setSelectedGateway(selectedGateway === gateway.id ? null : gateway.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-3 h-3 rounded-full ${gateway.is_online ? 'bg-green-500' : 'bg-gray-400'
                                                }`}
                                        />
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">{gateway.name}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {gateway.hardware_type} • {gateway.frequency_plan} • {gateway.gateway_id}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span>RX: {gateway.rx_packets_total}</span>
                                        <span>TX: {gateway.tx_packets_total}</span>
                                        <span>{formatLastSeen(gateway.last_seen)}</span>
                                        <ChevronRight
                                            className={`w-5 h-5 transition-transform ${selectedGateway === gateway.id ? 'rotate-90' : ''
                                                }`}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Nodes */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Signal className="w-5 h-5 text-blue-500" />
                        Sensor Nodes
                        {selectedGateway && (
                            <span className="text-sm font-normal text-gray-500">
                                (Filtered by gateway)
                            </span>
                        )}
                    </h3>
                    <button className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1">
                        <Plus className="w-4 h-4" />
                        Add Node
                    </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {filteredNodes.length === 0 ? (
                        <div className="col-span-full p-8 text-center text-gray-500">
                            <Signal className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No sensor nodes found</p>
                        </div>
                    ) : (
                        filteredNodes.map((node) => {
                            const signal = getSignalQuality(node.rssi);
                            return (
                                <div
                                    key={node.id}
                                    className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {node.is_online ? (
                                                <Wifi className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <WifiOff className="w-5 h-5 text-gray-400" />
                                            )}
                                            <span className="font-medium text-gray-900 dark:text-white">{node.name}</span>
                                        </div>
                                        {node.battery_level !== null && (
                                            <div className={`flex items-center gap-1 ${getBatteryColor(node.battery_level)}`}>
                                                <Battery className="w-4 h-4" />
                                                <span className="text-xs">{node.battery_level.toFixed(0)}%</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                        <div>{node.sensor_type || node.node_type}</div>
                                        <div>{node.dev_eui}</div>
                                    </div>

                                    {/* Signal Quality */}
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-gray-500">Signal</span>
                                        <span className={signal.color}>
                                            {node.rssi ? `${node.rssi} dBm` : '-'} ({signal.label})
                                        </span>
                                    </div>

                                    {/* Last Telemetry */}
                                    {node.last_telemetry && Object.keys(node.last_telemetry).length > 0 && (
                                        <div className="mt-3 pt-3 border-t dark:border-gray-700 space-y-1">
                                            {node.last_telemetry.temperature !== undefined && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="flex items-center gap-1 text-gray-500">
                                                        <Thermometer className="w-4 h-4" />
                                                        Temp
                                                    </span>
                                                    <span className="text-gray-900 dark:text-white">
                                                        {(node.last_telemetry.temperature as number).toFixed(1)}°C
                                                    </span>
                                                </div>
                                            )}
                                            {node.last_telemetry.soil_moisture !== undefined && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="flex items-center gap-1 text-gray-500">
                                                        <Droplets className="w-4 h-4" />
                                                        Moisture
                                                    </span>
                                                    <span className="text-gray-900 dark:text-white">
                                                        {(node.last_telemetry.soil_moisture as number).toFixed(1)}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-3 text-xs text-gray-400">{formatLastSeen(node.last_seen)}</div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

export default LoRaWANDashboard;
