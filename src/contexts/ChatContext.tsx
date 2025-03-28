// src/contexts/ChatContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Chat, Message } from '../types';
import { getChats, getChatMessages, sendMessage, toggleAI } from '../services/chat';

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  loading: boolean;
  error: string | null;
  setActiveChat: (chatId: string) => void;
  sendNewMessage: (content: string) => Promise<void>;
  toggleAIActive: (chatId: string, active: boolean) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Mock data for fallback when backend isn't available
const MOCK_CHATS: Chat[] = [
  {
    id: "1",
    user: {
      id: "user1",
      username: "john_doe",
      profile_picture: "https://via.placeholder.com/150"
    },
    messages: [
      {
        id: "msg1",
        sender_id: "user1",
        content: "Hey, I'm interested in your product!",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        is_ai_generated: false,
        is_from_business: false
      },
      {
        id: "msg2",
        sender_id: "admin",
        content: "Thanks for reaching out! What would you like to know?",
        timestamp: new Date(Date.now() - 3500000).toISOString(),
        is_ai_generated: false,
        is_from_business: true
      }
    ],
    is_ai_active: true,
    last_message: {
      id: "msg2",
      sender_id: "admin",
      content: "Thanks for reaching out! What would you like to know?",
      timestamp: new Date(Date.now() - 3500000).toISOString(),
      is_ai_generated: false,
      is_from_business: true
    },
    unread_count: 0
  }
];

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load all chats on initial render
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        let fetchedChats: Chat[] = [];
        
        try {
          // Try to get real chats from API
          fetchedChats = await getChats();
          console.log('Fetched chats from API:', fetchedChats);
          setChats(fetchedChats);
        } catch (error) {
          console.warn('Failed to fetch chats from API, using mock data:', error);
          // Fall back to mock data if API fails
          setChats(MOCK_CHATS);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error in chat fetching:', err);
        setError('Failed to load chats');
        setLoading(false);
        // Still use mock data as fallback
        setChats(MOCK_CHATS);
      }
    };

    fetchChats();
  }, []);

  const normalizeTimestamp = (timestamp: string): string => {
    if (!timestamp) {
      return new Date().toISOString();
    }
    
    try {
      // Check if the timestamp is valid by creating a Date object
      const date = new Date(timestamp);
      
      // If the date is invalid, use current time
      if (isNaN(date.getTime())) {
        console.warn(`Invalid timestamp format: ${timestamp}, using current time`);
        return new Date().toISOString();
      }
      
      return date.toISOString();
    } catch (error) {
      console.warn(`Error processing timestamp: ${timestamp}`, error);
      return new Date().toISOString();
    }
  };
  // WebSocket integration for real-time chat updates
  useEffect(() => {
    // Adjust the URL if necessary
    const ws = new WebSocket("ws://localhost:8001/api/v1/ws/chats");

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

   
    // Updated WebSocket message handler
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const { conversation_id, new_message } = data;
      
      // Normalize timestamp to ensure it's in a valid format
      if (new_message && new_message.created_at) {
        new_message.timestamp = normalizeTimestamp(new_message.created_at);
      } else if (new_message) {
        new_message.timestamp = new Date().toISOString();
      }
      
      // Format the message for frontend
      const formattedMessage = new_message ? {
        id: new_message.id || `temp_${Date.now()}`,
        sender_id: new_message.from?.id || "unknown",
        content: new_message.content || "",
        timestamp: new_message.timestamp,
        is_ai_generated: !!new_message.is_ai_generated,
        is_from_business: !!new_message.is_from_business,
      } : null;
      
      if (!formattedMessage) {
        console.error("Invalid message format received from WebSocket");
        return;
      }

      // Update chats state with the new message
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === conversation_id
            ? {
                ...chat,
                messages: [...(chat.messages || []), formattedMessage],
                last_message: formattedMessage,
              }
            : chat
        )
      );

      // Also update activeChat if it matches
      setActiveChat((prevActive) => {
        if (prevActive && prevActive.id === conversation_id) {
          return {
            ...prevActive,
            messages: [...(prevActive.messages || []), formattedMessage],
            last_message: formattedMessage,
          };
        }
        return prevActive;
      });
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      ws.close();
    };
  }, []);

  // Function to set active chat and load its messages
  const selectActiveChat = async (chatId: string) => {
    setLoading(true);
    try {
      // Find the chat in our current list
      const chat = chats.find(c => c.id === chatId);
      if (!chat) {
        setError(`Chat with ID ${chatId} not found`);
        setLoading(false);
        return;
      }

      // Try to load messages for this chat
      try {
        const messages = await getChatMessages(chatId);
        
        // Update the chat with messages
        const updatedChat = {
          ...chat,
          messages
        };
        
        // Update chats array with the new messages
        setChats(prevChats => 
          prevChats.map(c => c.id === chatId ? updatedChat : c)
        );
        
        // Set as active chat
        setActiveChat(updatedChat);
      } catch (error) {
        console.warn(`Failed to fetch messages for chat ${chatId}, using empty array:`, error);
        // If we can't fetch messages, just set the chat as active with empty messages
        setActiveChat(chat);
      }
    } catch (err) {
      console.error('Error selecting active chat:', err);
      setError('Failed to load chat messages');
    }
    setLoading(false);
  };

  // Function to send a new message
  const sendNewMessage = async (content: string) => {
    if (!activeChat) return;
    
    try {
      // Create temporary message to show immediately
      const tempMessage = {
        id: `temp_${Date.now()}`,
        sender_id: "admin", // The business account
        content,
        timestamp: new Date().toISOString(),
        is_ai_generated: false,
        is_from_business: true // This will be the business account
      };
      
      // Update UI immediately with temporary message
      const updatedChat = {
        ...activeChat,
        messages: [...activeChat.messages, tempMessage],
        last_message: tempMessage
      };
      
      setActiveChat(updatedChat);
      
      // Update all chats list
      setChats(prevChats => 
        prevChats.map(chat => chat.id === activeChat.id ? updatedChat : chat)
      );
      
      try {
        // Send message to backend
        const sentMessage = await sendMessage(activeChat.id, content);
        
        // Replace temporary message with actual sent message
        const finalMessages = updatedChat.messages.map(msg => 
          msg.id === tempMessage.id ? sentMessage : msg
        );
        
        // Update chat with confirmed message
        const finalChat = {
          ...updatedChat,
          messages: finalMessages,
          last_message: sentMessage
        };
        
        setActiveChat(finalChat);
        
        // Update all chats list
        setChats(prevChats => 
          prevChats.map(chat => chat.id === activeChat.id ? finalChat : chat)
        );
        
        // If AI is active, the backend will automatically generate a response.
        if (activeChat.is_ai_active) {
          setTimeout(async () => {
            try {
              // Fetch latest messages to get AI response
              const latestMessages = await getChatMessages(activeChat.id);
              
              const chatWithAIResponse = {
                ...finalChat,
                messages: latestMessages,
                last_message: latestMessages[latestMessages.length - 1]
              };
              
              setActiveChat(chatWithAIResponse);
              
              setChats(prevChats => 
                prevChats.map(chat => chat.id === activeChat.id ? chatWithAIResponse : chat)
              );
            } catch (error) {
              console.warn('Failed to fetch AI response:', error);
            }
          }, 2000);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        setError('Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Error in sendNewMessage:', err);
      setError('Failed to send message');
    }
  };

  // Function to toggle AI for a chat
  const toggleAIActive = async (chatId: string, active: boolean) => {
    try {
      // Update UI immediately
      const updatedChats = chats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            is_ai_active: active
          };
        }
        return chat;
      });
      
      setChats(updatedChats);
      
      // Update active chat if needed
      if (activeChat && activeChat.id === chatId) {
        setActiveChat({
          ...activeChat,
          is_ai_active: active
        });
      }
      
      try {
        // Send update to backend
        await toggleAI(chatId, active);
      } catch (error) {
        console.error('Error toggling AI on backend:', error);
        // Revert UI changes if backend update fails
        setChats(chats);
        
        if (activeChat && activeChat.id === chatId) {
          setActiveChat(activeChat);
        }
        
        setError('Failed to toggle AI. Please try again.');
      }
    } catch (err) {
      console.error('Error in toggleAIActive:', err);
      setError('Failed to toggle AI');
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        loading,
        error,
        setActiveChat: selectActiveChat,
        sendNewMessage,
        toggleAIActive
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
