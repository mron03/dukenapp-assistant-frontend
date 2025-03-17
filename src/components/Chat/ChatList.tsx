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

  if (chats.length === 0) {
    return <div className="empty-state">No chats available</div>;
  }

  return (
    <div className="chat-list">
      {chats.map((chat) => (
        <div
          key={chat.id}
          className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''}`}
          onClick={() => setActiveChat(chat.id)}
        >
          <div className="chat-avatar">
            {chat.user.profile_picture ? (
              <img src={chat.user.profile_picture} alt={chat.user.username} />
            ) : (
              <div className="avatar-placeholder">{chat.user.username[0]}</div>
            )}
          </div>
          <div className="chat-details">
            <div className="chat-header">
              <span className="chat-username">{chat.user.username}</span>
              {chat.unread_count > 0 && (
                <span className="unread-badge">{chat.unread_count}</span>
              )}
            </div>
            {chat.last_message && (
              <div className="chat-preview">
                {chat.last_message.is_ai_generated && <span className="ai-label">AI: </span>}
                {chat.last_message.content.length > 30
                  ? `${chat.last_message.content.substring(0, 30)}...`
                  : chat.last_message.content}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatList;