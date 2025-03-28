export interface User {
    id: string;
    username: string;
    profile_picture?: string;
}

export interface Message {
    id: string;
    sender_id: string;
    content: string;
    timestamp: string;
    is_ai_generated: boolean;
    is_from_business: boolean;
}

export interface Chat {
    id: string;
    user: User;
    messages: Message[];
    is_ai_active: boolean;
    last_message?: Message;
    unread_count: number;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    error: string | null;
}