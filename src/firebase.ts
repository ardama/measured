import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, type User } from '@firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config/firebase.config';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getReactNativePersistence ? initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
}) : getAuth(app);

export const firestore = getFirestore(app);

let currentUser: User | null = null;
export const setCurrentUser = (user: User | null) => { currentUser = user; };
export const getCurrentUser = () => currentUser;