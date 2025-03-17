import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const { authState, logout } = useAuth();
  const { user } = authState;

  return (
    <header className="app-header">
      <div className="logo">Instagram Bot Manager</div>
      {user && (
        <div className="user-info">
          <span className="username">{user.username}</span>
          {user.profile_picture && (
            <img
              src={user.profile_picture}
              alt={user.username}
              className="profile-pic"
            />
          )}
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;