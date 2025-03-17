import React, { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';

const MessageInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { activeChat, sendNewMessage } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !activeChat || sending) return;
    
    // Check message length (Instagram limit is 1000 bytes)
    if (new TextEncoder().encode(message).length > 1000) {
      setError("Message is too long. Instagram messages must be 1000 bytes or less.");
      return;
    }
    
    try {
      setSending(true);
      setError(null);
      
      await sendNewMessage(message);
      setMessage('');
    } catch (err: any) {
      console.error('Error sending message:', err);
      
      // Extract meaningful error message if available
      let errorMsg = "Failed to send message. Please try again.";
      
      if (err.response && err.response.data) {
        errorMsg = err.response.data.detail || errorMsg;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setSending(false);
    }
  };

  if (!activeChat) return null;

  return (
    <div className="message-input-container">
      {error && (
        <div className="error-message">
          {error}
          <button 
            className="error-dismiss" 
            onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}
      
      <form className="message-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            sending 
              ? "Sending..." 
              : "Type a message..."
          }
          disabled={sending}
          className={sending ? "sending" : ""}
        />
        <button
          type="submit"
          disabled={sending || !message.trim()}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;