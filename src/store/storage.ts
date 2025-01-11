import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit } from '@t/habits';
import type { Measurement } from '@t/measurements';
import type { Account, User } from '@t/users';
import { Collections } from '@u/constants/Firestore';
import { Platform } from 'react-native';

type StorageKey = 'user' | (typeof Collections)[keyof typeof Collections] | 'activeUserId';
const StorageKeys: {[key: string]: StorageKey} = {
  USER: 'user',
  ACCOUNT: Collections.Accounts,
  MEASUREMENTS: Collections.Measurements,
  HABITS: Collections.Habits,
  ACTIVE_USER_ID: 'activeUserId',
}

// Create a storage interface
interface IStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
}

// Browser storage implementation
class BrowserStorage implements IStorage {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async multiRemove(keys: string[]): Promise<void> {
    keys.forEach(key => localStorage.removeItem(key));
  }
}

// Add a new NoopStorage for SSR
class NoopStorage implements IStorage {
  async getItem(): Promise<null> {
    return null;
  }

  async setItem(): Promise<void> {
    return;
  }

  async removeItem(): Promise<void> {
    return;
  }

  async multiRemove(): Promise<void> {
    return;
  }
}

// Update storage initialization to handle SSR case
const storage: IStorage = (() => {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') {
      return new NoopStorage();
    }
    return new BrowserStorage();
  }
  return AsyncStorage;
})();

class StorageService {
  // User methods
  async getUser(): Promise<User | null> {
    const data = await storage.getItem(StorageKeys.USER);
    return data ? JSON.parse(data) : null;
  }

  async setUser(user: User | null): Promise<void> {
    if (user) {
      await storage.setItem(StorageKeys.USER, JSON.stringify(user));
    } else {
      await storage.removeItem(StorageKeys.USER);
    }
  }

  // Data methods
  async getMeasurements(): Promise<Measurement[]> {
    return this.getDocuments<Measurement>(StorageKeys.MEASUREMENTS);
  }

  async setMeasurements(measurements: Measurement[]): Promise<void> {
    return this.setDocuments(StorageKeys.MEASUREMENTS, measurements);
  }

  async getHabits(): Promise<Habit[]> {
    return this.getDocuments<Habit>(StorageKeys.HABITS);
  }

  async setHabits(habits: Habit[]): Promise<void> {
    return this.setDocuments(StorageKeys.HABITS, habits);
  }

  async getAccount(): Promise<Account | null> {
    const accounts = await this.getDocuments<Account>(StorageKeys.ACCOUNT);
    return accounts.length ? accounts[0] : null;
  }

  async setAccount(account: Account | null): Promise<void> {
    await this.setDocuments(StorageKeys.ACCOUNT, account ? [account] : []);
  }

  // Utility methods
  async clearAll(): Promise<void> {
    await storage.multiRemove(Object.values(StorageKeys));
  }

  // Migration methods
  async migrateToCloud(userId: string): Promise<{
    measurements: Measurement[];
    habits: Habit[];
    account: Account | null;
  }> {
    const [measurements, habits, account] = await Promise.all([
      this.getMeasurements(),
      this.getHabits(),
      this.getAccount(),
    ]);

    const migratedData = {
      measurements: measurements.map(m => ({ ...m, userId })),
      habits: habits.map(h => ({ ...h, userId })),
      account: account ? { ...account, userId } : null,
    };

    await this.clearAll();
    return migratedData;
  }

  async migrateToLocal(measurements: Measurement[], habits: Habit[], account: Account | null): Promise<void> {
    await Promise.all([
      this.setMeasurements(measurements),
      this.setHabits(habits),
      this.setAccount(account),
    ]);
  }

  async getActiveUserId(): Promise<string | null> {
    const userId = await storage.getItem(StorageKeys.ACTIVE_USER_ID);
    return userId;
  }

  async setActiveUserId(userId: string | null): Promise<void> {
    if (userId) {
      await storage.setItem(StorageKeys.ACTIVE_USER_ID, userId);
    } else {
      await storage.removeItem(StorageKeys.ACTIVE_USER_ID);
    }
  }

  async getDocuments<T>(collectionName: StorageKey): Promise<T[]> {
    const data = await storage.getItem(collectionName);
    return data ? JSON.parse(data) : [];
  }

  async setDocuments<T>(collectionName: StorageKey, items: T[]): Promise<void> {
    await storage.setItem(collectionName, JSON.stringify(items));
  }

  async getDocument<T>(documentName: StorageKey): Promise<T | null> {
    const data = await storage.getItem(documentName);
    return data ? JSON.parse(data) : null;
  }

  async setDocument<T>(documentName: StorageKey, item: T | null): Promise<void> {
    if (item) {
      await storage.setItem(documentName, JSON.stringify(item));
    } else {
      await storage.removeItem(documentName);
    }
  }
}

export const storageService = new StorageService();

// const isUserPremium = async (): Promise<boolean> => {
//   try {
//     const idTokenResult = await auth.currentUser?.getIdTokenResult();
//     if (!idTokenResult) return false;

//     const claims = idTokenResult.claims as PremiumClaims;
    
//     // Check if user has premium and it hasn't expired
//     if (!claims.premium) return false;
//     if (claims.premiumUntil) {
//       const expiryDate = new Date(claims.premiumUntil);
//       if (expiryDate < new Date()) return false;
//     }
    
//     return true;
//   } catch (error) {
//     console.error('Error checking premium status:', error);
//     return false;
//   }
// };


// export const storageMiddleware: Middleware = () => next => action => {
//   if (dataActions.has(action.type)) {
//     return next(action);
//   }

//   const isPremium = !!auth.currentUser && 
// }
