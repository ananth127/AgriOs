'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { AddContactModal } from '@/components/chat/AddContactModal';
import { Conversation, User, Message } from '@/components/chat/types';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function ChatPage() {
    const { user } = useAuth();
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pageHeight, setPageHeight] = useState('calc(100vh - 4rem)');
    const containerRef = useRef<HTMLDivElement>(null);

    // Dynamic Height Calculation
    useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                const top = containerRef.current.getBoundingClientRect().top;
                // Leave a tiny buffer or exact calculation
                const availableHeight = window.innerHeight - top;
                setPageHeight(`${availableHeight}px`);
                // document.body.style.overflow = 'hidden'; // Optional: force body lock
            }
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
        // Timeout to handle any layout shifts (animation/loading)
        setTimeout(updateHeight, 100);
        setTimeout(updateHeight, 500);

        return () => {
            window.removeEventListener('resize', updateHeight);
            // document.body.style.overflow = '';
        };
    }, []);

    // Mock Data for "Restoration"
    const [conversations, setConversations] = useState<Conversation[]>([
        {
            id: 1,
            participants: [{ id: 101, full_name: "Dr. A. Sharma (Expert)", role: "Expert" }],
            updated_at: new Date().toISOString(),
            last_message: {
                id: 1,
                conversation_id: 1,
                sender_id: 101,
                content: "Your soil report looks good, but add more Nitrogen.",
                message_type: 'text',
                is_read: false,
                created_at: new Date(Date.now() - 3600000).toISOString()
            }
        },
        {
            id: 2,
            participants: [{ id: 102, full_name: "Rahul Vendor", role: "Seller" }],
            updated_at: new Date().toISOString(),
            last_message: {
                id: 2,
                conversation_id: 2,
                sender_id: 102,
                content: "I have the new seeds in stock.",
                message_type: 'text',
                is_read: true,
                created_at: new Date(Date.now() - 86400000).toISOString()
            }
        }
    ]);

    const handleNewChat = () => {
        setIsModalOpen(true);
    };

    const handleSelectUser = (user: User) => {
        // Check if conversation exists
        const existing = conversations.find(c => c.participants.some(p => p.id === user.id));
        if (existing) {
            setSelectedConv(existing);
        } else {
            // Create new mock conversation
            const newConv: Conversation = {
                id: Date.now(),
                participants: [user],
                updated_at: new Date().toISOString(),
                last_message: undefined
            };
            setConversations([newConv, ...conversations]);
            setSelectedConv(newConv);
        }
        setIsModalOpen(false);
    };

    const handleSendMessage = (text: string, type: Message['message_type'], attachment?: string) => {
        console.log("Sending:", text, type, attachment);
        // In real app, call API here
        // Update local state if needed for strict sync
    };

    return (
        <div
            ref={containerRef}
            style={{ height: pageHeight }}
            className="flex overflow-hidden bg-white dark:bg-slate-950 shadow-inner w-full"
        >
            <div className={`w-full md:w-80 h-full border-r border-slate-200 dark:border-white/5 ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
                {/* Ensure Sidebar takes full height of this container */}
                <ChatSidebar
                    conversations={conversations}
                    selectedId={selectedConv?.id}
                    onSelect={setSelectedConv}
                    onNewChat={handleNewChat}
                />
            </div>

            {selectedConv ? (
                <div className="flex-1 h-full w-full relative">
                    <ChatWindow
                        key={selectedConv.id}
                        conversation={selectedConv}
                        onSendMessage={handleSendMessage}
                        onBack={() => setSelectedConv(null)}
                    />
                </div>
            ) : (
                <div className="hidden md:flex flex-1 flex-col items-center justify-center text-slate-400 bg-slate-50/30 dark:bg-black/20 h-full">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-500 dark:text-slate-400">Agri-OS Chat</h3>
                    <p className="max-w-xs text-center mt-2 text-sm text-slate-400">
                        Select a conversation or start a new one to connect with experts and buyers.
                    </p>
                </div>
            )}

            <AddContactModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={handleSelectUser}
            />
        </div>
    );
}
