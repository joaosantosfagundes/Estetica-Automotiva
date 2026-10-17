import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import AppError from '../utils/AppError';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let auth;
let db;
try {
  if (Object.values(config).some(valor => !valor)) {
    throw new AppError('Preencha as variáveis EXPO_PUBLIC_FIREBASE_* e reinicie o Expo.', 'config/firebase');
  }
  const app = getApps().length ? getApp() : initializeApp(config);
  try {
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch (erro) {
    if (erro.code !== 'auth/already-initialized') throw erro;
    auth = getAuth(app);
  }
  db = getDatabase(app);
} catch (erro) {
  throw erro instanceof AppError ? erro : new AppError('Não foi possível inicializar o Firebase. Confira a configuração.', 'config/firebase');
}

export { auth, db };
