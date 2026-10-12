import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DoctorUser } from '../types';
import { ApiService } from '../services/api.service';
import {
  initAuthListener,
  getFreshIdToken,
  signInWithDoctorCredentials,
  signOutDoctor,
  waitForAuthState,
  TOKEN_STORAGE_KEY,
} from '../services/firebaseAuth';
import { setUnauthorizedHandler } from '../api/client';

import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_STORAGE_KEY = 'breastcare_doctor_user';

interface AuthContextType {
  user: DoctorUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  loginWithCredentials: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  loginWithCredentials: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<DoctorUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveCachedUser = async (u: DoctorUser | null) => {
    try {
      if (u) {
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
      } else {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('[AuthContext] Failed saving cached user:', e);
    }
  };

  const handleUnauthorized = useCallback(async () => {
    console.warn('[AuthContext] Session unauthorized or expired. Logging out.');
    setUser(null);
    setToken(null);
    await saveCachedUser(null);
    signOutDoctor().catch(() => {});
  }, []);

  useEffect(() => {
    // Register global 401 unauthorized handler
    setUnauthorizedHandler(handleUnauthorized);

    // Initialize Firebase Auth listener
    initAuthListener(async (freshToken) => {
      if (freshToken) {
        setToken(freshToken);
      }
    });

    async function restoreSession() {
      try {
        // 1. Wait for Firebase Auth persistence to initialize and resolve auth state
        const firebaseUser = await waitForAuthState();

        if (!firebaseUser) {
          // Unauthenticated app launch: ensure clean state and show Sign In
          console.log('[AuthContext] No active Firebase Auth session. Navigating to Sign In.');
          setUser(null);
          setToken(null);
          await saveCachedUser(null);
          await AsyncStorage.removeItem(TOKEN_STORAGE_KEY).catch(() => {});
          return;
        }

        // 2. Active Firebase session exists: get fresh ID token
        console.log('[AuthContext] Active Firebase session detected for:', firebaseUser.email);
        const activeToken = await firebaseUser.getIdToken();
        if (activeToken) {
          setToken(activeToken);
          try {
            const session = await ApiService.establishSession(activeToken);
            setUser(session.user);
            await saveCachedUser(session.user);
          } catch (sessionErr: any) {
            console.log('[AuthContext] Session verification note:', sessionErr.message);
            if (sessionErr?.status === 401 || sessionErr?.name === 'UnauthorizedError') {
              await signOutDoctor();
              await saveCachedUser(null);
              setUser(null);
              setToken(null);
            } else {
              // Server wake-up or network unavailable: retain credentials if user was previously cached
              console.warn('[AuthContext] Server wake-up or network issue. Retaining credentials.');
              const cachedUserStr = await AsyncStorage.getItem(USER_STORAGE_KEY);
              if (cachedUserStr) {
                try {
                  setUser(JSON.parse(cachedUserStr));
                } catch (e) {
                  setUser({
                    id: firebaseUser.uid,
                    firebase_uid: firebaseUser.uid,
                    name: firebaseUser.displayName || 'Doctor',
                    email: firebaseUser.email || '',
                    role: 'DOCTOR',
                  });
                }
              } else {
                setUser({
                  id: firebaseUser.uid,
                  firebase_uid: firebaseUser.uid,
                  name: firebaseUser.displayName || 'Doctor',
                  email: firebaseUser.email || '',
                  role: 'DOCTOR',
                });
              }
            }
          }
        } else {
          setUser(null);
          setToken(null);
          await saveCachedUser(null);
        }
      } catch (err: any) {
        console.log('[AuthContext] Session restore note:', err.message);
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [handleUnauthorized]);

  const login = async (idToken: string) => {
    setIsLoading(true);
    try {
      const session = await ApiService.establishSession(idToken);
      setUser(session.user);
      setToken(idToken);
      await saveCachedUser(session.user);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithCredentials = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const idToken = await signInWithDoctorCredentials(email, pass);
      const session = await ApiService.establishSession(idToken);
      setUser(session.user);
      setToken(idToken);
      await saveCachedUser(session.user);
    } finally {
      setIsLoading(false);
    }
  };


  const logout = async () => {
    try {
      await signOutDoctor();
      await saveCachedUser(null);
    } catch (err) {
      console.warn('[AuthContext] Error signing out:', err);
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginWithCredentials,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
