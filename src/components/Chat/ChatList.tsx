import React from 'react';
import { useChat } from '../../contexts/ChatContext';

const ChatList: React.FC = () => {
  const { chats, activeChat, setActiveChat, loading, error } = useChat();

  if (loading) {
    return <div className="loading">Loading chats...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!chats || chats.length === 0) {
    return <div className="empty-state">No chats available</div>;
  }

  return (
    <div className="chat-list">
      {chats.map((chat) => {
        // Ensure chat and chat.user exist before accessing properties
        if (!chat || !chat.user) {
          return null; // Skip this chat if data is incomplete
        }
        
        return (
          <div
            key={chat.id}
            className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''}`}
            onClick={() => setActiveChat(chat.id)}
          >
            <div className="chat-avatar">
              {chat.user.profile_picture ? (
                <img src={chat.user.profile_picture} alt={chat.user.username || 'User'} />
              ) : (
                <div className="avatar-placeholder">
                  {chat.user.username ? chat.user.username[0] : '?'}
                </div>
              )}
            </div>
            <div className="chat-details">
              <div className="chat-header">
                <span className="chat-username">{chat.user.username || 'Unknown User'}</span>
                {chat.unread_count > 0 && (
                  <span className="unread-badge">{chat.unread_count}</span>
                )}
              </div>
              {chat.last_message && (
                <div className="chat-preview">
                  {chat.last_message.is_ai_generated && <span className="ai-label">AI: </span>}
                  {chat.last_message.content 
                    ? (chat.last_message.content.length > 30
                        ? `${chat.last_message.content.substring(0, 30)}...`
                        : chat.last_message.content)
                    : 'No message content'}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatList;