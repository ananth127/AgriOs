'use client';

import React, { useEffect, useRef } from "react";
import { useInfiniteFeed } from "../hooks/useInfiniteFeed";
import { FeedCard } from "./FeedCard";
import { Loader2 } from "lucide-react";

export function FeedList() {
    const {
        data,
        posts,
        isLoading,
        isError,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        likePost,
        sharePost,
        createComment
    } = useInfiniteFeed();

    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.5 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [hasNextPage, fetchNextPage]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="py-8 text-center text-slate-500">
                <p>That&apos;s all for now!</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-0 pb-20">
            <div className="space-y-6">
                {posts?.map((post) => (
                    <FeedCard
                        key={post.id}
                        post={post}
                        onLike={(id) => likePost(id)}
                        onComment={(id, content) => createComment({ postId: id, content })}
                        onShare={(id) => sharePost(id)}
                    />
                ))}

                {posts?.length === 0 && (
                    <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">No posts yet. Be the first to share something!</p>
                    </div>
                )}
            </div>

            <div ref={loadMoreRef} className="py-8 flex justify-center">
                {isFetchingNextPage ? (
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                ) : hasNextPage ? (
                    <span className="text-sm text-gray-400">Loading more updates...</span>
                ) : posts.length > 0 ? (
                    <span className="text-sm text-gray-400">You&apos;re all caught up!</span>
                ) : null}
            </div>
        </div>
    );
}
