export interface User {
    id: number;
    full_name: string;
    avatar?: string;
    role?: string;
    phone_number?: string;
    user_unique_id?: string;
}

export interface Message {
    id: number;
    conversation_id: number;
    sender_id: number;
    content: string;
    message_type: 'text' | 'image' | 'video' | 'audio' | 'call' | 'file';
    attachment_url?: string;
    is_read: boolean;
    created_at: string;
    sender?: User;
}

export interface Conversation {
    id: number;
    participants: User[];
    last_message?: Message;
    updated_at: string;
    name?: string;
    avatar?: string;
}
