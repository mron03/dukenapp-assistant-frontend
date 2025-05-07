import api from './api';
import { Chat, Message } from '../types';

export const getChats = async (): Promise<Chat[]> => {
  try {
    const app_user_id = localStorage.getItem('instagram_user_id');
    if (!app_user_id) {
      throw new Error('No app_user_id found. Please log in again.');
    }
    
    const response = await api.get('/chats', {
      params: {
        app_user_id
      }
    });
    
    // Backend returns { chats: [...] }
    if (response.data && response.data.chats) {
      return response.data.chats.map((chat: any) => ({
        id: chat.id,
        user: chat.user,
        messages: [], // We'll load messages separately when a chat is selected
        is_ai_active: chat.is_ai_active,
        last_message: chat.last_message,
        unread_count: 0 // Backend doesn't provide this, set default
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching chats:', error);
    throw error;
  }
};

export const getChatMessages = async (chatId: string): Promise<Message[]> => {
  try {
    
    const app_user_id = localStorage.getItem('instagram_user_id');
    if (!app_user_id) {
      throw new Error('No app_user_id found. Please log in again.');
    }
    // Get messages for a specific chat using the correct endpoint
    const response = await api.get(`/chats/${chatId}`, {
      params: {
        app_user_id
      }
    });
    
    // Backend returns { id, user, messages, is_ai_active }
    if (response.data && response.data.messages) {
      return response.data.messages;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    throw error;
  }
};

export const sendMessage = async (chatId: string, content: string): Promise<any> => {
  try {
    const app_user_id = localStorage.getItem('instagram_user_id');
    if (!app_user_id) {
      throw new Error('No app_user_id found. Please log in again.');
    }

    // Check message length - Instagram messages must be UTF-8 and <= 1000 bytes
    const messageBytes = new TextEncoder().encode(content).length;
    if (messageBytes > 1000) {
      throw new Error(`Message is too long (${messageBytes} bytes). Instagram allows maximum 1000 bytes.`);
    }
    
    // Use the correct endpoint structure from the backend with app_user_id as query param
    const response = await api.post(`/chats/${chatId}/send`, 
      { content }, // Request body
      { params: { app_user_id } } // Query params
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to send message");
    }
    
    // Return formatted message object
    return {
      id: response.data.details?.message_id || `temp_${Date.now()}`,
      sender_id: 'admin', // This will be the business account
      content: content,
      timestamp: new Date().toISOString(),
      is_ai_generated: false,
      is_from_business: true,
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const toggleAI = async (chatId: string, enabled: boolean): Promise<void> => {
  try {
    
    const app_user_id = localStorage.getItem('instagram_user_id');
    if (!app_user_id) {
      throw new Error('No app_user_id found. Please log in again.');
    }
    
    // Fix the structure - enabled in body, app_user_id as query param
    await api.post(`/chats/${chatId}/toggle-ai`, 
      { enabled }, // Request body
      { params: { app_user_id } } // Query params
    );
  } catch (error) {
    console.error('Error toggling AI:', error);
    throw error;
  }
};

// New method to manually refresh chats
export const refreshChats = async (): Promise<void> => {
  try {
    const app_user_id = localStorage.getItem('instagram_user_id');
    if (!app_user_id) {
      throw new Error('No app_user_id found. Please log in again.');
    }
    
    await api.post('/chats/refresh', null, {
      params: {
        app_user_id
      }
    });
  } catch (error) {
    console.error('Error refreshing chats:', error);
    throw error;
  }
};

// Add a polling function to check for new messages
export const pollForNewMessages = async (chatId: string): Promise<Message[]> => {
  try {
    const app_user_id = localStorage.getItem('instagram_user_id');
    if (!app_user_id) {
      throw new Error('No app_user_id found. Please log in again.');
    }
    
    // Get messages for this chat
    const response = await api.get(`/chats/${chatId}`, {
      params: {
        app_user_id
      }
    });
    
    if (response.data && response.data.messages) {
      return response.data.messages;
    }
    
    return [];
  } catch (error) {
    console.error('Error polling for new messages:', error);
    throw error;
  }
};