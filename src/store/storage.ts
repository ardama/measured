import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit } from '@t/habits';
import type { Measurement } from '@t/measurements';
import type { Account, User } from '@t/users';

type StorageKey = 'user' | 'account' | 'measurements' | 'habits' | 'activeUserId';
const StorageKeys: {[key: string]: StorageKey} = {
  USER: 'user',
  ACCOUNT: 'account',
  MEASUREMENTS: 'measurements',
  HABITS: 'habits',
  ACTIVE_USER_ID: 'activeUserId',
}

class StorageService {
  // User methods
  async getUser(): Promise<User | null> {
    const data = await AsyncStorage.getItem(StorageKeys.USER);
    return data ? JSON.parse(data) : null;
  }

  async setUser(user: User | null): Promise<void> {
    if (user) {
      await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(StorageKeys.USER);
    }
  }

  // Data methods
  async getMeasurements(): Promise<Measurement[]> {
    const data = await AsyncStorage.getItem(StorageKeys.MEASUREMENTS);
    return data ? JSON.parse(data) : [];
  }

  async setMeasurements(measurements: Measurement[]): Promise<void> {
    await AsyncStorage.setItem(StorageKeys.MEASUREMENTS, JSON.stringify(measurements));
  }

  async getHabits(): Promise<Habit[]> {
    const data = await AsyncStorage.getItem(StorageKeys.HABITS);
    return data ? JSON.parse(data) : [];
  }

  async setHabits(habits: Habit[]): Promise<void> {
    await AsyncStorage.setItem(StorageKeys.HABITS, JSON.stringify(habits));
  }

  async getAccount(): Promise<Account | null> {
    const data = await AsyncStorage.getItem(StorageKeys.ACCOUNT);
    return data ? JSON.parse(data) : null;
  }

  async setAccount(account: Account | null): Promise<void> {
    if (account) {
      await AsyncStorage.setItem(StorageKeys.ACCOUNT, JSON.stringify(account));
    } else {
      await AsyncStorage.removeItem(StorageKeys.ACCOUNT);
    }
  }

  // Utility methods
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(StorageKeys));
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
    const userId = await AsyncStorage.getItem(StorageKeys.ACTIVE_USER_ID);
    return userId;
  }

  async setActiveUserId(userId: string | null): Promise<void> {
    if (userId) {
      await AsyncStorage.setItem(StorageKeys.ACTIVE_USER_ID, userId);
    } else {
      await AsyncStorage.removeItem(StorageKeys.ACTIVE_USER_ID);
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
