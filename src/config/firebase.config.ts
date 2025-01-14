import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra;

// Debug logging
if (!extra?.FIREBASE_API_KEY) {
  console.error('Firebase API key is missing! Extra config:', extra);
}

// Validate required config
const validateConfig = {
  apiKey: extra?.FIREBASE_API_KEY,
  authDomain: extra?.FIREBASE_AUTH_DOMAIN,
  projectId: extra?.FIREBASE_PROJECT_ID,
  storageBucket: extra?.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: extra?.FIREBASE_MESSAGING_SENDER_ID,
  appId: extra?.FIREBASE_APP_ID,
  measurementId: extra?.FIREBASE_MEASUREMENT_ID
};

// Check if any required fields are missing
const missingFields = Object.entries(validateConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingFields.length > 0) {
  throw new Error(
    `Missing required Firebase configuration fields: ${missingFields.join(', ')}`
  );
}

export const firebaseConfig = validateConfig; 