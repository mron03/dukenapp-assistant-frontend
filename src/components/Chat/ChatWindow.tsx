import React, { useEffect, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import MessageInput from './MessageInput';
import AiToggle from './AiToggle';

const ChatWindow: React.FC = () => {
  const { activeChat } = useChat();
  const { authState } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages when they change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  if (!activeChat) {
    return (
      <div className="chat-window empty">
        <div className="empty-state">
          Select a chat to start messaging
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-user-info">
          <span className="chat-username">{activeChat.user.username}</span>
        </div>
        <AiToggle
          chatId={activeChat.id}
          isActive={activeChat.is_ai_active}
        />
      </div>
      
      <div className="messages-container">
        {activeChat.messages.length === 0 ? (
          <div className="empty-state">No messages yet</div>
        ) : (
          activeChat.messages.map((message) => {
            const isSelf = message.sender_id === authState.user?.id;
            
            return (
              <div
                key={message.id}
                className={`message ${isSelf ? 'self' : 'other'} ${message.is_ai_generated ? 'ai' : ''}`}
              >
                {message.is_ai_generated && <div className="ai-indicator">AI</div>}
                <div className="message-content">{message.content}</div>
                <div className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput />
    </div>
  );
};

export default ChatWindow;