import React, { createContext, useContext, useState, useEffect } from 'react';
import { DoctorUser } from '../types';
import { ApiService } from '../services/api.service';

interface AuthContextType {
  user: DoctorUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  loginDemoDoctor: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  loginDemoDoctor: async () => {},
  logout: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<DoctorUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await ApiService.getToken();
        if (storedToken) {
          const session = await ApiService.establishSession(storedToken);
          setUser(session.user);
          setToken(storedToken);
        }
      } catch (err) {
        console.log('[AuthContext] Session restore note:', (err as Error).message);
        await ApiService.setToken(null);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (idToken: string) => {
    setIsLoading(true);
    try {
      const session = await ApiService.establishSession(idToken);
      setUser(session.user);
      setToken(idToken);
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemoDoctor = async () => {
    await login('demo-doctor-token');
  };

  const logout = async () => {
    await ApiService.setToken(null);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginDemoDoctor, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
