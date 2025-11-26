import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { AuthResponse } from '../interfaces';

interface AuthContextType {
  user: AuthResponse['user'] | null;
  token: string | null;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string; fullName?: string; address?: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on mount
    const savedToken = authService.getToken();
    const savedUser = authService.getUser();

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
      // Verify token is still valid
      refreshUser().catch(() => {
        authService.logout();
        setUser(null);
        setToken(null);
      });
    }
    setIsLoading(false);
  }, []);

  const refreshUser = async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  };

  const login = async (usernameOrEmail: string, password: string) => {
    const response = await authService.login({ usernameOrEmail, password });
    authService.setAuth(response);
    setUser(response.user);
    setToken(response.token);
  };

  const register = async (data: { username: string; email: string; password: string; fullName?: string; address?: string }) => {
    const response = await authService.register(data);
    authService.setAuth(response);
    setUser(response.user);
    setToken(response.token);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!token,
        isLoading,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

