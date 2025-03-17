import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Login from './components/Auth/Login';
import CallbackHandler from './components/Auth/CallbackHandler';
import ChatWindow from './components/Chat/ChatWindow';
import './styles/index.css';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState } = useAuth();
  
  if (authState.loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!authState.isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

// Dashboard component
const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <Sidebar />
      <ChatWindow />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Header />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<CallbackHandler />} />
            <Route path="/auth/success" element={<CallbackHandler />} />
            <Route path="/auth/error" element={<CallbackHandler />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ChatProvider>
                    <Dashboard />
                  </ChatProvider>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;