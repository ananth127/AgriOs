'use client';

import { useState } from 'react';
import { Conversation, User } from './types';
import { Plus, Search, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ChatSidebarProps {
    conversations: Conversation[];
    selectedId?: number;
    onSelect: (conv: Conversation) => void;
    onNewChat: () => void;
}

export function ChatSidebar({ conversations, selectedId, onSelect, onNewChat }: ChatSidebarProps) {
    const [search, setSearch] = useState('');

    const filtered = conversations.filter(c => {
        const name = c.name || c.participants[0]?.full_name || 'Unknown';
        return name.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <div className="w-full md:w-80 h-full border-r border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-white/5">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Messages</h2>
                    <button
                        onClick={onNewChat}
                        className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg shadow-green-500/20 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {filtered.map(conv => {
                    // Logic to display correct name (not current user)
                    const displayName = conv.name || conv.participants[0]?.full_name || 'User';
                    const lastMsg = conv.last_message?.content || 'Started a conversation';
                    const time = conv.last_message?.created_at
                        ? formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: true })
                        : '';

                    return (
                        <button
                            key={conv.id}
                            onClick={() => onSelect(conv)}
                            className={cn(
                                "w-full p-4 flex gap-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-left border-l-4",
                                selectedId === conv.id
                                    ? "bg-slate-100 dark:bg-white/5 border-green-500"
                                    : "border-transparent"
                            )}
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                                {displayName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="font-semibold text-slate-900 dark:text-white truncate">{displayName}</span>
                                    <span className="text-[10px] text-slate-400 shrink-0">{time}</span>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{lastMsg}</p>
                            </div>
                        </button>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No conversations found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
