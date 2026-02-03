"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { CloudLightning, Loader2 } from "lucide-react";

export default function ServerWakeupIndicator() {
    const [isVisible, setIsVisible] = useState(false);
    const [isWakingUp, setIsWakingUp] = useState(false);

    useEffect(() => {
        // Check if we've already done this in this session
        if (sessionStorage.getItem("server_awake")) {
            return;
        }

        let timeoutId: NodeJS.Timeout;

        const wakeUpServer = async () => {
            // Set a timeout to show the indicator if the request takes more than 1.5s
            timeoutId = setTimeout(() => {
                setIsVisible(true);
                setIsWakingUp(true);
            }, 1000);

            try {
                // We just want to ping the server. Even a 404 means it's awake.
                // Using a simple fetch for the base API URL or a lightweight endpoint.
                // Assuming /api/v1/ might return something or just standard 404/docs
                // We'll append a timestamp to avoid caching behavior
                await fetch(`${API_BASE_URL}/?t=${Date.now()}`, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
            } catch (error) {
                // Even if it fails (e.g. 404 or network error), as long as we got a response,
                // we consider the server interaction attempted. 
                // However, for pure network errors (server down), this might also trigger.
                // But for "cold start", it will eventually return.
                console.log("Server wakeup ping completed", error);
            } finally {
                clearTimeout(timeoutId);
                // Mark as awake in session storage so we don't annoy user on reload
                sessionStorage.setItem("server_awake", "true");

                // If it was visible, wait a moment before hiding to show "Connected" state if desired,
                // or just hide it.
                if (isVisible) {
                    setIsWakingUp(false);
                    // Keep the "Connected" message for 2 seconds then hide
                    setTimeout(() => {
                        setIsVisible(false);
                    }, 2000);
                }
            }
        };

        wakeUpServer();

        return () => clearTimeout(timeoutId);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-6 right-6 z-50 max-w-sm"
                >
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-lg p-4 flex items-center gap-4">
                        <div className={`p-2 rounded-full ${isWakingUp ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                            {isWakingUp ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <CloudLightning className="w-6 h-6" />
                            )}
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                {isWakingUp ? "Waking up Server..." : "Server Ready!"}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {isWakingUp
                                    ? "This might take up to a minute on first load."
                                    : "You are connected and ready to go."}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
