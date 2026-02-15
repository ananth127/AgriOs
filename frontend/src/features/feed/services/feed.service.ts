
import { FeedResponse, Post, User, Notification } from '../types/feed.types';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1").trim();

export const feedService = {
    async getFeed(token: string, cursor: number = 0, limit: number = 5): Promise<FeedResponse> {
        const res = await fetch(`${API_BASE_URL}/feed/posts?skip=${cursor}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Failed to fetch feed');
        const posts = await res.json();

        return {
            posts: posts,
            nextCursor: posts.length === limit ? cursor + limit : undefined,
            hasMore: posts.length === limit,
        };
    },

    async likePost(token: string, postId: number): Promise<void> {
        const res = await fetch(`${API_BASE_URL}/feed/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Failed to like post');
    },

    async sharePost(token: string, postId: number): Promise<void> {
        const res = await fetch(`${API_BASE_URL}/feed/posts/${postId}/share`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Failed to share post');
    },

    async createPost(token: string, content: string, images?: File[]): Promise<Post> {
        const res = await fetch(`${API_BASE_URL}/feed/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });
        if (!res.ok) throw new Error('Failed to create post');
        return await res.json();
    },

    async createComment(token: string, postId: number, content: string): Promise<Comment> {
        const res = await fetch(`${API_BASE_URL}/feed/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });
        if (!res.ok) throw new Error('Failed to create comment');
        return await res.json();
    },

    async getNotifications(token: string, skip: number = 0, limit: number = 20): Promise<Notification[]> {
        const res = await fetch(`${API_BASE_URL}/feed/notifications?skip=${skip}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Failed to fetch notifications');
        return await res.json();
    },

    async markNotificationRead(token: string, notificationId: number): Promise<void> {
        const res = await fetch(`${API_BASE_URL}/feed/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Failed to mark notification as read');
    }
};
