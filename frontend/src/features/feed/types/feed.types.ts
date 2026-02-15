
export interface User {
    id: number;
    full_name: string;
    avatar?: string;
    role: string;
}

export interface Comment {
    id: number;
    post_id: number;
    user_id: number;
    author: User;
    content: string;
    created_at: string;
}

export interface Post {
    id: number;
    user_id: number;
    author: User;
    content: string;
    image_url?: string;
    likes_count: number;
    comments: Comment[];
    shares_count: number;
    created_at: string;
    updated_at?: string;
    is_liked: boolean;
}

export interface FeedResponse {
    posts: Post[];
    nextCursor?: number;
    hasMore: boolean;
}

export interface Notification {
    id: number;
    user_id: number;
    actor_id: number;
    actor: User;
    type: 'like' | 'comment' | 'share' | 'system';
    message: string;
    is_read: boolean;
    related_id?: number;
    created_at: string;
}
