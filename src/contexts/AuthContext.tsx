import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { getAuthUser } from '../services/auth';

interface AuthContextType {
  authState: AuthState;
  login: () => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const user = await getAuthUser();
          setAuthState({
            isAuthenticated: true,
            user,
            loading: false,
            error: null
          });
        } else {
          setAuthState({
            ...initialAuthState,
            loading: false
          });
        }
      } catch (error) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: 'Authentication failed'
        });
      }
    };

    checkAuth();
  }, []);

  const login = () => {
    // Redirect to backend auth endpoint
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/instagram`;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null
    });
  };

  const setUser = (user: User) => {
    setAuthState({
      isAuthenticated: true,
      user,
      loading: false,
      error: null
    });
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};