import { Platform } from 'react-native';

// Production Render backend as primary fallback so physical tablet never fails on 10.0.2.2 emulator IP
const PRODUCTION_API_URL = 'https://breastcare-backend-atyz.onrender.com/api';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL).trim();
export const TABLET_ID = (process.env.EXPO_PUBLIC_TABLET_ID || 'TABLET-CLINIC-01').trim();

if (__DEV__) {
  console.log(`[Config] Active Backend API: ${API_URL}`);
  console.log(`[Config] Tablet ID: ${TABLET_ID}`);
}

export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'breastcare-ai.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'breastcare-ai',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'breastcare-ai.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:1234567890:web:abcdef'
};
