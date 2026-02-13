'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, MessageCircle, User, ThumbsUp, MessageSquare, Plus, Loader2 } from 'lucide-react';

interface Question {
    id: number;
    author: string;
    avatar_color: string;
    title: string;
    content: string;
    likes: number;
    comments: number;
    time_ago: string;
    tags: string[];
}

const MOCK_QUESTIONS: Question[] = [
    {
        id: 1,
        author: "Ramesh Kumar",
        avatar_color: "bg-orange-500",
        title: "Yellowing leaves on my tomato plants",
        content: "My tomato plants are 45 days old and the lower leaves are turning yellow with brown spots. I watered them regularly. What could be the issue?",
        likes: 12,
        comments: 4,
        time_ago: "2 hours ago",
        tags: ["Tomato", "Disease"]
    },
    {
        id: 2,
        author: "Sita Devi",
        avatar_color: "bg-purple-500",
        title: "Best fertilizer for Cotton at flowering stage?",
        content: "I am growing cotton in black soil. It is currently in the flowering stage. Should I apply Urea or DAP now?",
        likes: 8,
        comments: 2,
        time_ago: "5 hours ago",
        tags: ["Cotton", "Fertilizer"]
    },
    {
        id: 3,
        author: "Vikram Singh",
        avatar_color: "bg-blue-500",
        title: "Market price prediction for Onion next month",
        content: "I have 50 quintals of onion ready to harvest. Should I sell now or wait for next month? Any insights on Nasik market trends?",
        likes: 24,
        comments: 15,
        time_ago: "1 day ago",
        tags: ["Onion", "Market"]
    }
];

export default function CommunityPage({ params: { locale } }: { params: { locale: string } }) {
    // const t = useTranslations('Community'); // define keys later
    const [search, setSearch] = useState('');
    const [questions, setQuestions] = useState<Question[]>(MOCK_QUESTIONS);
    const [isAsking, setIsAsking] = useState(false);

    // New Question State
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    const handleAskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newContent.trim()) return;

        const newQ: Question = {
            id: Date.now(),
            author: "You",
            avatar_color: "bg-green-500",
            title: newTitle,
            content: newContent,
            likes: 0,
            comments: 0,
            time_ago: "Just now",
            tags: ["New"]
        };

        setQuestions([newQ, ...questions]);
        setIsAsking(false);
        setNewTitle('');
        setNewContent('');
    };

    return (
        <div className="relative min-h-full">
            <div className="absolute top-0 right-0 w-full h-96 bg-pink-500/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />

            <div className="p-6 md:p-8 relative z-10">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-2">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                                Community Forum
                            </h1>
                            <p className="text-slate-400 max-w-2xl text-lg">
                                Ask questions, share knowledge, and grow together.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsAsking(!isAsking)}
                            className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-green-900/20"
                        >
                            <Plus className="w-5 h-5" />
                            Ask Question
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search discussions..."
                            className="w-full bg-slate-900 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-green-500/50"
                        />
                    </div>

                    {/* Ask Form */}
                    {isAsking && (
                        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 animate-in slide-in-from-top-4">
                            <h3 className="text-lg font-bold text-white mb-4">Post a new question</h3>
                            <form onSubmit={handleAskSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-white focus:border-green-500/50 focus:outline-none"
                                        placeholder="e.g., How to treat leaf curl in chilli?"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Details</label>
                                    <textarea
                                        value={newContent}
                                        onChange={(e) => setNewContent(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-white focus:border-green-500/50 focus:outline-none min-h-[120px]"
                                        placeholder="Describe your problem in detail..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsAsking(false)}
                                        className="px-4 py-2 text-slate-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-green-500 hover:bg-green-400 text-slate-900 font-bold rounded-lg"
                                    >
                                        Post Question
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Feed */}
                    <div className="space-y-4">
                        {questions.map((q) => (
                            <div key={q.id} className="bg-slate-900/30 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors group">
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-full ${q.avatar_color} flex items-center justify-center text-white font-bold text-lg`}>
                                        {q.author.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-white">{q.author}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                            <span className="text-xs text-slate-500">{q.time_ago}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-green-400 transition-colors">{q.title}</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                            {q.content}
                                        </p>

                                        <div className="flex items-center gap-6">
                                            <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-green-400 transition-colors">
                                                <ThumbsUp className="w-4 h-4" />
                                                {q.likes} Likes
                                            </button>
                                            <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-400 transition-colors">
                                                <MessageSquare className="w-4 h-4" />
                                                {q.comments} Comments
                                            </button>
                                            <div className="flex-1 flex justify-end gap-2">
                                                {q.tags.map(tag => (
                                                    <span key={tag} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 border border-white/5">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
}
