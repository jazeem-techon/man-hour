import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router';
import api from '@/lib/api';

export interface User {
  id: string;
  username: string;
  role: string; // 'salesperson', 'company admin', etc.
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isSalesperson: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // If we have a token but no user, fetch the user permissions
    const initAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/permission/user');
          setUser(response.data);
        } catch (error) {
          console.error("Failed to fetch user permissions", error);
          setToken(null);
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  useEffect(() => {
    // Listen for global 401 unauthorized events from Axios
    const handleUnauthorized = () => logout();
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    navigate('/dashboard');
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/logout');
      }
    } catch (error) {
      console.error("Logout API failed", error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      // navigate('/login');
    }
  };

  const isAdmin = ['CompanyAdmin', 'Admin', 'admin', 'company_admin', 'companyadmin'].includes(user?.role || '')
    || user?.permissions?.[0]?.fullAdminAccess === true;
  const isSalesperson = !!user?.salesPersonId;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, isLoading, isAdmin, isSalesperson }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
