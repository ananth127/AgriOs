
import { useInfiniteQuery, useMutation, InfiniteData, useQueryClient } from '@tanstack/react-query';
import { feedService } from '../services/feed.service';
import { FeedResponse, Post } from '../types/feed.types';
import { useAuth } from '@/lib/auth-context';

export const useInfiniteFeed = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    const query = useInfiniteQuery<FeedResponse, Error, InfiniteData<FeedResponse>, string[], number>({
        queryKey: ['feed'],
        queryFn: async ({ pageParam = 0 }) => {
            if (!token) throw new Error("Not authenticated");
            const response = await feedService.getFeed(token, pageParam);
            return response;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.hasMore && lastPage.nextCursor !== undefined ? lastPage.nextCursor : undefined,
        enabled: !!token, // Only fetch if authenticated
    });

    const likeMutation = useMutation({
        mutationFn: (postId: number) => {
            if (!token) throw new Error("Not authenticated");
            return feedService.likePost(token, postId);
        },
        onSuccess: (data, variables) => {
            // Invalidate or update cache optimistically
            queryClient.invalidateQueries({ queryKey: ['feed'] });
        }
    });

    const shareMutation = useMutation({
        mutationFn: (postId: number) => {
            if (!token) throw new Error("Not authenticated");
            return feedService.sharePost(token, postId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
        }
    });

    const createPostMutation = useMutation({
        mutationFn: ({ content, images }: { content: string; images?: File[] }) => {
            if (!token) throw new Error("Not authenticated");
            return feedService.createPost(token, content, images);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
        }
    });

    // Comment mutation might be needed too if used here
    const commentMutation = useMutation({
        mutationFn: ({ postId, content }: { postId: number; content: string }) => {
            if (!token) throw new Error("Not authenticated");
            return feedService.createComment(token, postId, content);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
        }
    });

    return {
        ...query,
        posts: query.data?.pages.flatMap((page) => page.posts) || [],
        likePost: likeMutation.mutate,
        sharePost: shareMutation.mutate,
        createPost: createPostMutation.mutateAsync,
        createComment: commentMutation.mutateAsync
    };
};
