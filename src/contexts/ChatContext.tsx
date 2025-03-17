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
        is_ai_generated: false
      },
      {
        id: "msg2",
        sender_id: "admin",
        content: "Thanks for reaching out! What would you like to know?",
        timestamp: new Date(Date.now() - 3500000).toISOString(),
        is_ai_generated: false
      }
    ],
    is_ai_active: true,
    last_message: {
      id: "msg2",
      sender_id: "admin",
      content: "Thanks for reaching out! What would you like to know?",
      timestamp: new Date(Date.now() - 3500000).toISOString(),
      is_ai_generated: false
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
        is_ai_generated: false
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
        
        // If AI is active, the backend will automatically generate a response
        // We'll need to poll for new messages or implement websockets for real-time updates
        if (activeChat.is_ai_active) {
          // For now, we'll just show a simulated response after a delay
          setTimeout(async () => {
            try {
              // Fetch latest messages to get AI response
              const latestMessages = await getChatMessages(activeChat.id);
              
              // Update chat with latest messages including AI response
              const chatWithAIResponse = {
                ...finalChat,
                messages: latestMessages,
                last_message: latestMessages[latestMessages.length - 1]
              };
              
              setActiveChat(chatWithAIResponse);
              
              // Update all chats list
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
        // Message already shown in UI with temporary ID
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