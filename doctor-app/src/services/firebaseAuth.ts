import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  // @ts-ignore - getReactNativePersistence is provided by React Native resolution of firebase/auth
  getReactNativePersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
  onAuthStateChanged,
  browserLocalPersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { FIREBASE_CONFIG } from '../config/constants';

const TOKEN_STORAGE_KEY = 'breastcare_doctor_token';

// Safely initialize Firebase Client App with React Native persistence
const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();

function getOrCreateAuth() {
  try {
    if (Platform.OS === 'web') {
      return initializeAuth(app, {
        persistence: browserLocalPersistence,
      });
    }
    // Official React Native persistence with AsyncStorage v2
    const storageImpl = (AsyncStorage as any)?.default || AsyncStorage;
    return initializeAuth(app, {
      persistence: (getReactNativePersistence as any)(storageImpl),
    });
  } catch (err: any) {
    // If already initialized (e.g. during Fast Refresh / HMR), reuse existing instance
    return getAuth(app);
  }
}

export const auth = getOrCreateAuth();

let currentCachedToken: string | null = null;
let authStateListenerInitialized = false;

/**
 * Ensures auth state listener is active to cache fresh tokens
 */
export function initAuthListener(onTokenChange?: (token: string | null) => void) {
  if (authStateListenerInitialized) return;
  authStateListenerInitialized = true;

  onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        const token = await user.getIdToken();
        currentCachedToken = token;
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
        onTokenChange?.(token);
      } catch (err) {
        console.warn('[FirebaseAuth] Error getting user token:', err);
      }
    } else {
      currentCachedToken = null;
      onTokenChange?.(null);
    }
  });
}

/**
 * Returns a fresh, valid Firebase ID Token or stored authenticated session token.
 * If user is authenticated in Firebase Auth, requests fresh token.
 * Never throws unhandled errors; returns null if not logged in.
 */
export async function getFreshIdToken(forceRefresh = false): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const freshToken = await currentUser.getIdToken(forceRefresh);
      currentCachedToken = freshToken;
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, freshToken);
      return freshToken;
    } catch (err) {
      console.warn('[FirebaseAuth] Failed refreshing token from Firebase Auth:', err);
    }
  }

  if (currentCachedToken) {
    return currentCachedToken;
  }

  try {
    const stored = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      currentCachedToken = stored;
      return stored;
    }
  } catch (err) {
    console.warn('[FirebaseAuth] Failed reading token from storage:', err);
  }

  return null;
}

/**
 * Explicitly set a session token (e.g. after demo doctor login or session restore)
 */
export async function setSessionToken(token: string | null): Promise<void> {
  currentCachedToken = token;
  if (token) {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    if (auth.currentUser) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        // Safe to ignore on local signout
      }
    }
  }
}

/**
 * Authenticates with real Firebase Email & Password
 */
export async function signInWithDoctorCredentials(email: string, pass: string): Promise<string> {
  const creds = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const token = await creds.user.getIdToken(true);
  await setSessionToken(token);
  return token;
}

/**
 * Authenticates with Demo Doctor session (verified by backend)
 */
export async function signInDemoDoctorSession(): Promise<string> {
  const demoToken = 'demo-doctor-token';
  await setSessionToken(demoToken);
  return demoToken;
}

/**
 * Logs out and clears all session tokens
 */
export async function signOutDoctor(): Promise<void> {
  await setSessionToken(null);
}
