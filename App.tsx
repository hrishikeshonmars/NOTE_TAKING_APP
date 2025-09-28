import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import type { User } from './types';
import { api } from './services/api';
import AuthForm from './components/AuthForm';
import HomePage from './components/HomePage';
import { Header, Spinner } from './components/ui';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>(null!);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('token');

    if (storedToken) {
        try {
            // Validate token with backend and get user info
            const currentUser = await api.getMe();
            setUser(currentUser);
            setToken(storedToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
        } catch (error) {
            console.error("Session validation failed:", error);
            // If token is invalid/expired, clear it
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    }
    setIsLoading(false);
  }, []);
  
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (email: string, password: string) => {
    const { user, token } = await api.login(email, password);
    setUser(user);
    setToken(token);
    // User and token are already saved in localStorage by api.login
  };

  const signup = async (username: string, email: string, password: string) => {
    const { user, token } = await api.signup(username, email, password);
    setUser(user);
    setToken(token);
     // User and token are already saved in localStorage by api.signup -> api.login
  };
  
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };
  
  const authContextValue = {
    user,
    token,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
  };

  if (isLoading) {
      return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center">
            <Spinner size="lg" />
        </div>
      );
  }

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};

const MainContent: React.FC = () => {
    const { isAuthenticated, user, logout } = useContext(AuthContext);

    return (
        <div className="bg-amber-50 min-h-screen font-sans text-gray-800">
            {isAuthenticated ? (
                <>
                    <Header user={user} onLogout={logout} />
                    <HomePage />
                </>
            ) : (
                <AuthForm />
            )}
        </div>
    );
};

function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

export default App;
