import React, { useState, useEffect } from 'react';
import { Copy, MessageSquare, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineCommandBuilderProps {
    deviceId: number;
    deviceSecret: string; // Wait, actually the frontend shouldn't know the secret for HMAC? 
    // Correction: In proper security, Frontend should NOT sign. The user copies the command and sends it.
    // BUT, the implementation plan said: "SMS FORMAT: ... SIG".
    // If the frontend generates the SIG, the frontend needs the Secret.
    // If the user is OFFLINE, the frontend (PWA) might have cached the secret?
    // OR, more securely: The user sends the command without signature, and the Server challenges?
    // The plan said: "Signature example: HASH = SHA256(...)".
    // For a true Offline PWA, we might cache a "Session Key" or the actual Secret (stored securely in IndexedDB/LocalStore if user trusts device).
    // For now, let's assume we pass a `tempSecret` or similar if we want to simulate the hash generation,
    // OR we just generate the TEXT for the user, but maybe without the hash if we can't sign?
    // WAIT: The plan says "User Phone - OFFLINE -> SMS".
    // If the user is offline, the App (running on phone) CANNOT call the server to get a signature.
    // So the App MUST calculate the signature locally.
    // This means the App needs the secret.
    // Security Warning: Storing secrets in JS code is risky, but for a PWA 'App' behavior, it relies on device security.

    // Let's implement the generation logic.
    deviceHardwareId: string; // The "F123" part
    // For the hash generation, we'll need a library like crypto-js if we want to do it client side without native crypto API issues on some older browsers, 
    // but modern browsers support window.crypto.subtle.
    // To keep it simple for this prototype, I'll assume we can use a basic JS SHA256 function or simple strict formatting.
}

async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(key: string, message: string): Promise<string> {
    const enc = new TextEncoder();
    const k = await crypto.subtle.importKey(
        "raw",
        enc.encode(key),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const s = await crypto.subtle.sign("HMAC", k, enc.encode(message));
    return Array.from(new Uint8Array(s)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function OfflineCommandBuilder({ deviceId, deviceHardwareId, deviceName }: { deviceId: number, deviceHardwareId: string, deviceName: string }) {
    const [action, setAction] = useState('OPEN');
    const [valve, setValve] = useState('V1');
    const [generatedCmd, setGeneratedCmd] = useState('');
    const [copied, setCopied] = useState(false);

    // In a real app, this key comes from secure storage
    // For demo, we might prompt user or use a placeholder if we don't have it.
    // Let's prompt user for the "Device Secret" if not available, OR 
    // we can just format the string and let the user know they need to append signature if strictly enforcing.
    // However, to make it "Just Work" for the demo, let's assume we allow an "Insecure/Dev" mode or 
    // we fetch the secret when ONLINE and cache it.

    // MOCK SECRET for Demo purposes if we can't get real one.
    // Ideally, we fetch this from API when mounting this component (if online) or read from localStorage.
    const [secret, setSecret] = useState('');

    useEffect(() => {
        generate();
    }, [action, valve, secret]);

    const generate = async () => {
        const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp
        // Command Format: AGRI OPEN V1 F123 T1735629000
        const base = `AGRI ${action} ${valve} ${deviceHardwareId} ${timestamp}`;

        let sig = "NO_SECRET";
        if (secret) {
            try {
                const fullHash = await hmacSha256(secret, base);
                sig = fullHash.substring(0, 5).toUpperCase();
            } catch (e) {
                console.error("Crypto Error", e);
            }
        }

        setGeneratedCmd(`${base} ${sig}`);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedCmd);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const sendSms = () => {
        const serverNumber = "+1234567890"; // Configurable
        window.open(`sms:${serverNumber}?body=${encodeURIComponent(generatedCmd)}`, '_self');
    };

    return (
        <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-white/10">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Offline Emergency Command</h3>
            <p className="text-sm text-slate-500 mb-4">
                No Internet? Generate a secure SMS command to control <b>{deviceName}</b> manually.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Action</label>
                    <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 mt-1 border border-slate-200 dark:border-white/5">
                        <button
                            onClick={() => setAction('OPEN')}
                            className={cn("flex-1 py-2 text-sm font-bold rounded-md transition-colors", action === 'OPEN' ? "bg-green-500 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700")}
                        >
                            ON
                        </button>
                        <button
                            onClick={() => setAction('CLOSE')}
                            className={cn("flex-1 py-2 text-sm font-bold rounded-md transition-colors", action === 'CLOSE' ? "bg-red-500 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700")}
                        >
                            OFF
                        </button>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Target</label>
                    <select
                        value={valve}
                        onChange={(e) => setValve(e.target.value)}
                        className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-lg py-2.5 px-3 text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none"
                    >
                        <option value="V1">Valve 1</option>
                        <option value="V2">Valve 2</option>
                        <option value="V3">Valve 3</option>
                        <option value="V4">Valve 4</option>
                    </select>
                </div>
            </div>

            <div className="mb-4">
                <label className="text-xs font-semibold text-slate-500 uppercase">Device Secret Key (For Signing)</label>
                <input
                    type="password"
                    placeholder="Enter Secret Key if known..."
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-lg py-2 px-3 text-sm font-mono tracking-widest"
                />
                <p className="text-[10px] text-slate-400 mt-1">Found in Device Settings. Required for verification.</p>
            </div>

            <div className="bg-slate-950 rounded-lg p-4 font-mono text-green-400 text-sm break-all border border-slate-800 relative group">
                {generatedCmd}
            </div>

            <div className="flex gap-3 mt-4">
                <button
                    onClick={copyToClipboard}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                    onClick={sendSms}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-green-900/20"
                >
                    <MessageSquare className="w-4 h-4" />
                    Open SMS App
                </button>
            </div>
        </div>
    );
}
