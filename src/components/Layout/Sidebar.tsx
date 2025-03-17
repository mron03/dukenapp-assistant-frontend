import React from 'react';
import ChatList from '../Chat/ChatList';

const Sidebar: React.FC = () => {
  return (
    <div className="sidebar">
      <h3>Your Chats</h3>
      <ChatList />
    </div>
  );
};

export default Sidebar;