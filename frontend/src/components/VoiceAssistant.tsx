'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { Mic, X, Volume2, Loader2, ArrowUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from '@/navigation';

export default function VoiceAssistant() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState<any>(null);

    const toggleAssistant = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            startListening();
        } else {
            reset();
        }
    };

    const reset = () => {
        setStatus('idle');
        setTranscript('');
        setResponse(null);
    };

    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const chunks = useRef<BlobPart[]>([]);

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.current.push(e.data);
            };

            recorder.onstop = async () => {
                const blob = new Blob(chunks.current, { type: 'audio/webm' }); /* webm is standard for MediaRecorder */
                chunks.current = [];
                setStatus('processing');
                await processQuery(blob);
            };

            recorder.start();
            setMediaRecorder(recorder);
            setStatus('listening');
        } catch (err) {
            console.error("Mic Error:", err);
            setTranscript("Microphone access denied.");
            setStatus('idle');
        }
    };

    const stopListening = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            setStatus('processing');
        }
    };

    const processQuery = async (audioBlob: Blob) => {
        try {
            // Convert Blob to Base64
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result?.toString().split(',')[1];
                if (!base64Audio) return;

                const result = await api.voice.query(base64Audio);
                setResponse(result);
                setTranscript(result.transcription);

                // Speak Result
                if (result.response_text) {
                    const utterance = new SpeechSynthesisUtterance(result.response_text);
                    // Attempt to detect language
                    if (result.detected_language === 'hi') utterance.lang = 'hi-IN';
                    else utterance.lang = 'en-US';
                    window.speechSynthesis.speak(utterance);
                }

                setStatus('idle'); // Back to idle after processing (or 'speaking' if you want to block)

                // Handle Navigation
                if (result.intent === 'navigate' && result.parameters?.page) {
                    const page = result.parameters.page.toLowerCase();
                    setTimeout(() => {
                        setIsOpen(false); // Close modal
                        if (page.includes('market')) window.location.href = '/marketplace';
                        else if (page.includes('weather')) window.location.href = '/dashboard'; // Weather is on dashboard
                        else if (page.includes('crop')) window.location.href = '/crops';
                        else if (page.includes('profile')) window.location.href = '/profile';
                        else if (page.includes('setting')) window.location.href = '/settings';
                        else if (page.includes('home')) window.location.href = '/dashboard';
                    }, 1500);
                }
            };
        } catch (error) {
            console.error(error);
            setTranscript("Error connecting to Voice Service.");
            setStatus('idle');
        }
    };

    const { isAuthenticated } = useAuth();
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = (e: Event) => {
            const target = e.target as HTMLElement;
            if (target.scrollTop > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        let scrollContainer: HTMLElement | null = null;
        let retryCount = 0;
        const maxRetries = 20; // Try for ~4 seconds
        let timeoutId: NodeJS.Timeout;

        const attachListener = () => {
            scrollContainer = document.getElementById('scrolling-container');

            if (scrollContainer) {
                scrollContainer.addEventListener('scroll', handleScroll);
                // Initial check
                if (scrollContainer.scrollTop > 300) setShowScrollTop(true);
            } else if (retryCount < maxRetries) {
                retryCount++;
                timeoutId = setTimeout(attachListener, 200);
            }
        };

        attachListener();

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (scrollContainer) scrollContainer.removeEventListener('scroll', handleScroll);
        };
    }, [pathname]);

    const scrollToTop = () => {
        const scrollContainer = document.getElementById('scrolling-container');
        if (scrollContainer) {
            scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (!isAuthenticated) {
        if (!showScrollTop) return null;
        return (
            <button
                onClick={scrollToTop}
                className="fixed bottom-8 right-6 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all z-50 bg-slate-800 hover:bg-slate-700 hover:scale-110 border border-white/10"
                aria-label="Scroll to top"
            >
                <ArrowUp className="w-6 h-6 text-white" />
            </button>
        );
    }

    return (
        <>
            {/* Floating Trigger Button */}
            <button
                onClick={toggleAssistant}
                className={`fixed bottom-8 right-6 w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all z-50 ${isOpen ? 'bg-red-500 rotate-45' : 'bg-green-500 hover:scale-110 hover:bg-green-400'
                    }`}
            >
                {isOpen ? <X className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-slate-900" />}
            </button>

            {/* Overlay Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-green-500/30 shadow-2xl shadow-green-900/20 relative overflow-hidden transition-colors duration-300">

                        {/* Animated Background Pulse */}
                        {status === 'listening' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                <span className="w-64 h-64 bg-green-500 rounded-full animate-ping"></span>
                            </div>
                        )}

                        <div className="relative z-10 flex flex-col items-center text-center space-y-6 py-8">
                            <div
                                onClick={status === 'listening' ? stopListening : startListening}
                                className={`p-6 rounded-full transition-all duration-500 cursor-pointer hover:scale-105 ${status === 'listening' ? 'bg-red-500/20 text-red-500 animate-pulse border-2 border-red-500' :
                                    status === 'processing' ? 'bg-blue-500/20 text-blue-500 dark:text-blue-400 animate-spin-slow' :
                                        'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 border-2 border-transparent hover:border-green-500'
                                    }`}>
                                {status === 'listening' ? <div className="w-12 h-12 bg-red-500 rounded-lg animate-bounce" /> : <Mic className="w-12 h-12" />}
                            </div>

                            <div className="space-y-2 min-h-[80px]">
                                {status === 'listening' && <p className="text-xl font-light text-red-500 dark:text-red-400">Tap to Stop...</p>}
                                {status === 'processing' && <p className="text-xl font-light text-blue-500 dark:text-blue-400">Thinking...</p>}
                                {(status === 'idle' && !response) && <p className="text-slate-500">Tap mic to speak</p>}

                                {transcript && <p className="text-lg italic text-slate-600 dark:text-slate-300">&quot;{transcript}&quot;</p>}
                            </div>

                            {response && (
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl w-full text-left border border-slate-200 dark:border-white/5 animate-in fade-in slide-in-from-bottom-4 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 p-2 bg-green-500 rounded-lg text-white dark:text-slate-900">
                                            <Volume2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-green-600 dark:text-green-400 mb-1">Agri-OS</h4>
                                            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{response.response_text}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 p-3 bg-white/50 dark:bg-white/5 rounded text-sm text-slate-500 dark:text-slate-300">
                                        <p className="font-bold mb-1">Try saying:</p>
                                        <ul className="list-disc pl-4 space-y-1">
                                            <li>&quot;What is the price of Onion?&quot;</li>
                                            <li>&quot;Will it rain tomorrow?&quot;</li>
                                        </ul>
                                    </div>

                                    {response.intent === 'market_price' && (
                                        <div className="mt-4 p-3 bg-green-50/50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/20 rounded-lg flex justify-between items-center">
                                            <span className="text-sm text-green-700 dark:text-green-300">Market Action</span>
                                            <button className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded transition-colors" onClick={() => window.location.href = '/marketplace'}>
                                                View Market
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {status !== 'listening' && status !== 'processing' && (
                                <button onClick={startListening} className="text-sm text-slate-500 hover:text-green-600 dark:hover:text-white underline transition-colors">
                                    Try Again
                                </button>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
}
