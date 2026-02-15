'use client';

import { useState, useEffect, useRef } from 'react';
import { Conversation, Message, User } from './types';
import { Send, MoreVertical, Phone, Video, Image as ImageIcon, Mic, Paperclip, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ChatWindowProps {
    conversation: Conversation;
    onSendMessage: (text: string, type: Message['message_type'], attachment?: string) => void;
    onBack: () => void;
}

export function ChatWindow({ conversation, onSendMessage, onBack }: ChatWindowProps) {
    const { user } = useAuth();
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    const [isCalling, setIsCalling] = useState(false);
    const [callType, setCallType] = useState<'audio' | 'video' | null>(null);

    const otherParticipant = conversation.participants.find(p => p.id !== user?.id) || conversation.participants[0];
    const displayName = conversation.name || otherParticipant?.full_name || 'Unknown User';

    const [messages, setMessages] = useState<Message[]>([]);

    // Initialize messages from props if available (simplified)
    useEffect(() => {
        if (conversation.last_message) {
            setMessages([conversation.last_message]);
        } else {
            setMessages([]);
        }
    }, [conversation]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim()) return;

        // Optimistic UI
        const optimisticMsg: Message = {
            id: Date.now(),
            conversation_id: conversation.id,
            sender_id: user!.id,
            content: input,
            message_type: 'text',
            is_read: false,
            created_at: new Date().toISOString(),
            sender: { ...user!, full_name: user?.full_name || 'Me' }
        };

        onSendMessage(input, 'text');
        setMessages(prev => [...prev, optimisticMsg]);
        setInput('');
    };

    // Simulate Video/Audio Call
    const startCall = (type: 'audio' | 'video') => {
        setCallType(type);
        setIsCalling(true);
        // Simulate end call after 5s or manual
    };

    const handleFileUpload = () => {
        // Simulate file upload
        const url = "https://via.placeholder.com/300"; // Mock URL
        const optimisticMsg: Message = {
            id: Date.now(),
            conversation_id: conversation.id,
            sender_id: user!.id,
            content: "Shared an image",
            message_type: 'image',
            attachment_url: url,
            is_read: false,
            created_at: new Date().toISOString(),
            sender: { ...user!, full_name: user?.full_name || 'Me' }
        };
        onSendMessage("Shared an image", 'image', url);
        setMessages(prev => [...prev, optimisticMsg]);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden">

            {/* Call Overlay */}
            {isCalling && (
                <div className="absolute inset-0 z-50 bg-slate-900/95 flex flex-col items-center justify-center text-white backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-green-500 to-teal-500 flex items-center justify-center text-4xl font-bold mb-6 shadow-[0_0_50px_rgba(34,197,94,0.3)] border-4 border-white/10 animate-pulse">
                        {displayName.charAt(0)}
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{callType === 'video' ? 'Video Calling...' : 'Calling...'}</h2>
                    <p className="text-slate-400 mb-12 text-lg">{displayName}</p>

                    <div className="flex gap-8">
                        <button className="p-4 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors">
                            <Mic className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => { setIsCalling(false); setCallType(null); }}
                            className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all scale-110"
                        >
                            <Phone className="w-6 h-6 rotate-[135deg]" />
                        </button>
                        <button className="p-4 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors">
                            <Video className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}

            {/* Header - Static */}
            <div className="flex-none h-16 border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full bg-slate-100 dark:bg-white/10"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white dark:ring-slate-900">
                        {displayName.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{displayName}</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)] animate-pulse"></span>
                            <span className="text-xs text-slate-500 font-medium">Online</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => startCall('audio')}
                        className="p-2.5 text-slate-500 hover:text-white hover:bg-green-500 rounded-full transition-all active:scale-95"
                        title="Voice Call"
                    >
                        <Phone className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => startCall('video')}
                        className="p-2.5 text-slate-500 hover:text-white hover:bg-green-500 rounded-full transition-all active:scale-95"
                        title="Video Call"
                    >
                        <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-slate-50/50 dark:bg-black/20">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                            <Send className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="font-medium">No messages yet</p>
                        <p className="text-sm">Start the conversation!</p>
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                        <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                            <div className={cn(
                                "max-w-[85%] md:max-w-[70%] flex gap-2",
                                isMe ? "flex-row-reverse" : "flex-row"
                            )}>
                                {!isMe && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-auto shadow-sm">
                                        {msg.sender?.full_name?.charAt(0)}
                                    </div>
                                )}

                                <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                    {/* Message Bubble */}
                                    {msg.message_type === 'image' ? (
                                        <div className={cn(
                                            "overflow-hidden rounded-2xl border shadow-sm",
                                            isMe ? "bg-green-100 border-green-200 dark:bg-green-900/20 dark:border-green-500/20" : "bg-white border-slate-200 dark:bg-slate-800 dark:border-white/5"
                                        )}>
                                            <div className="relative max-w-sm w-full h-64">
                                                <Image
                                                    src={msg.attachment_url || ''}
                                                    alt="Shared image"
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="px-3 py-2 text-xs text-slate-500 flex justify-end gap-1 items-center bg-black/5 dark:bg-white/5">
                                                <span>Image</span>
                                                <span>•</span>
                                                <span>{format(new Date(msg.created_at), 'HH:mm')}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={cn(
                                            "px-4 py-2.5 shadow-sm relative group max-w-full break-words",
                                            isMe
                                                ? "bg-green-500 text-white rounded-2xl rounded-tr-sm"
                                                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-white/5"
                                        )}>
                                            <p className="leading-relaxed text-sm md:text-base whitespace-pre-wrap">{msg.content}</p>
                                            <span className={cn(
                                                "text-[10px] block mt-1 text-right opacity-70",
                                                isMe ? "text-green-100" : "text-slate-400"
                                            )}>
                                                {format(new Date(msg.created_at), 'HH:mm')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input Area - Static */}
            <div className="flex-none p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5 z-20">
                <form onSubmit={handleSend} className="flex gap-2 items-end max-w-4xl mx-auto w-full">
                    <button
                        type="button"
                        onClick={handleFileUpload}
                        className="p-3 text-slate-400 hover:text-green-600 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors shrink-0"
                        title="Attach Media"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>

                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 transition-all flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 min-h-[48px]"
                        />
                        <button type="button" className="p-2 mr-1 text-slate-400 hover:text-green-600 rounded-full transition-colors">
                            <Mic className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="p-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-full transition-all shadow-lg shadow-green-500/20 shrink-0"
                    >
                        <Send className="w-5 h-5 ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
