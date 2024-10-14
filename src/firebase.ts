import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, initializeAuth, getReactNativePersistence, type User } from '@firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBCQaOpC-0qpNpmzKAPRCuywrXUJJJFLrA",
  authDomain: "habits-f8cb0.firebaseapp.com",
  projectId: "habits-f8cb0",
  storageBucket: "habits-f8cb0.appspot.com",
  messagingSenderId: "314125171305",
  appId: "1:314125171305:web:7f9117842d6b41429880f8",
  measurementId: "G-JH6LCTVLJC"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getReactNativePersistence ? initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
}) : getAuth(app);

export const firestore = getFirestore(app);

let currentUser: User | null = null;
export const setCurrentUser = (user: User | null) => { currentUser = user; };
export const getCurrentUser = () => currentUser;