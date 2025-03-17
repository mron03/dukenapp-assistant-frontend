import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Connect Instagram Bot</h2>
        <p>Log in with your Instagram account to manage your automated chats</p>
        <button onClick={login} className="login-button">
          Login with Instagram
        </button>
      </div>
    </div>
  );
};

export default Login;