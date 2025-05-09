import React, { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';

interface AiToggleProps {
  chatId: string;
  isActive: boolean;
}

const AiToggle: React.FC<AiToggleProps> = ({ chatId, isActive }) => {
  const { toggleAIActive } = useChat();
  const [toggling, setToggling] = useState(true);

  const handleToggle = async () => {
    if (toggling) return;
    
    try {
      setToggling(true);
      await toggleAIActive(chatId, !isActive);
    } catch (error) {
      console.error('Error toggling AI:', error);
      // Error is handled in the chat context
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="ai-toggle">
      <span className="toggle-label">
        {toggling ? "Updating..." : "AI Active"}
      </span>
      <label className={`switch ${toggling ? 'disabled' : ''}`}>
        <input
          type="checkbox"
          checked={isActive}
          onChange={handleToggle}
          disabled={toggling}
        />
        <span className="slider round"></span>
      </label>
    </div>
  );
};

export default AiToggle;