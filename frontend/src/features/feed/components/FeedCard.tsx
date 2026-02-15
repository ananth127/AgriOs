'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Post } from '../types/feed.types';
import { Heart, MessageCircle, Share2, MoreHorizontal, User, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FeedCardProps {
    post: Post;
    onLike: (postId: number) => void;
    onComment: (postId: number, content: string) => void;
    onShare: (postId: number) => void;
}

export function FeedCard({ post, onLike, onComment, onShare }: FeedCardProps) {
    const [isLiked, setIsLiked] = useState(post.is_liked);
    const [likesCount, setLikesCount] = useState(post.likes_count);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState(post.comments || []);

    useEffect(() => {
        setIsLiked(post.is_liked);
        setLikesCount(post.likes_count);
        setComments(post.comments || []);
    }, [post]);

    const handleLike = () => {
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
        onLike(post.id);
    };

    const handleShare = () => {
        onShare(post.id);
        // Maybe show toast
    };

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        onComment(post.id, commentText);
        setCommentText('');
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4 transition-all hover:shadow-md">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
                        {post.author.avatar ? (
                            <Image
                                src={post.author.avatar}
                                alt={post.author.full_name}
                                width={40}
                                height={40}
                                className="h-full w-full object-cover"
                                unoptimized
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full bg-gradient-to-tr from-emerald-400 to-teal-500 text-white font-bold">
                                {post.author.full_name?.charAt(0) || 'U'}
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{post.author.full_name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                            <span>•</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300`}>
                                {post.author.role || 'Farmer'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="mb-3 space-y-3">
                <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

                {post.image_url && (
                    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 relative">
                        <Image
                            src={post.image_url}
                            alt="Post content"
                            width={500}
                            height={300}
                            className="w-full h-auto max-h-96 object-cover"
                            unoptimized
                        />
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                <span>{likesCount} Likes</span>
                <div className="flex gap-3">
                    <button onClick={() => setShowComments(!showComments)} className="hover:underline">
                        {comments.length} Comments
                    </button>
                    <span>{post.shares_count} Shares</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center py-1">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isLiked ? 'text-red-500 bg-red-50 dark:bg-red-900/10' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                    <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span>Like</span>
                </button>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <MessageCircle className="h-5 w-5" />
                    <span>Comment</span>
                </button>

                <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <Share2 className="h-5 w-5" />
                    <span>Share</span>
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-4 mb-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                        {comments.length > 0 ? (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        {comment.author.avatar ? (
                                            <Image
                                                src={comment.author.avatar}
                                                alt={comment.author.full_name}
                                                width={32}
                                                height={32}
                                                className="h-full w-full object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <span className="text-xs font-bold text-gray-500">{comment.author.full_name?.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl px-4 py-2 flex-1">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{comment.author.full_name}</span>
                                            <span className="text-[10px] text-gray-500">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-sm text-gray-500 py-2">No comments yet. Be the first!</p>
                        )}
                    </div>

                    <form onSubmit={handleCommentSubmit} className="flex gap-2 sticky bottom-0 bg-white dark:bg-gray-800 pt-2">
                        <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        <button
                            type="submit"
                            disabled={!commentText.trim()}
                            className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
