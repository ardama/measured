import { type Dispatch, type Middleware, type MiddlewareAPI, type PayloadAction } from '@reduxjs/toolkit';
import { auth } from '@/firebase';
import { 
  callCreateMeasurement,
  callUpdateMeasurement,
  callDeleteMeasurement,
  callCreateHabit,
  callUpdateHabit,
  callDeleteHabit,
  callUpdateAccount,
} from '@s/dataReducer';
import Purchases, { type CustomerInfo } from 'react-native-purchases';
import type { RootState } from '@t/redux';
import type { AnyAction } from 'redux-saga';

export type StorageType = 'cloud' | 'local';
type StorageAction = 
  | ReturnType<typeof callCreateMeasurement>
  | ReturnType<typeof callUpdateMeasurement>
  | ReturnType<typeof callDeleteMeasurement>
  | ReturnType<typeof callCreateHabit>
  | ReturnType<typeof callUpdateHabit>
  | ReturnType<typeof callDeleteHabit>
  | ReturnType<typeof callUpdateAccount>;

const STORAGE_ACTIONS = new Set<string>([
  callCreateMeasurement.type,
  callUpdateMeasurement.type,
  callDeleteMeasurement.type,
  callCreateHabit.type,
  callUpdateHabit.type,
  callDeleteHabit.type,
  callUpdateAccount.type,
]);

export const isStorageAction = (action: AnyAction): action is StorageAction => {
  return STORAGE_ACTIONS.has(action.type);
};

// const PREMIUM_ENTITLEMENT_ID = 'premium'; // TODO: Replace with actual entitlement ID
// const isPremiumUser = async (customerInfo: CustomerInfo): Promise<boolean> => {
//   return customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;
// };

export const storageMiddleware = () => next => (action: AnyAction) => {
  // Only process storage-related actions
  if (!isStorageAction(action)) {
    return next(action);
  }

  // Add a storage flag to the action
  const isAuthenticated = !!auth.currentUser;
  return next({
    ...action,
    meta: {
      ...action.meta?,
      storage: isAuthenticated ? 'cloud' : 'local'
    }
  });
};

// export const storageMiddleware: Middleware<{}, RootState> = store => next => async (action: PayloadAction<any>) => {
//   // Only process storage-related actions
//   if (!STORAGE_ACTIONS.has(action.type)) {
//     return next(action);
//   }

//   try {
//     const isAuthenticated = !!auth.currentUser;
    
//     // If not authenticated, always use local storage
//     if (!isAuthenticated) {
//       return next({
//         ...action,
//         meta: {
//           ...action.meta,
//           storage: 'local' as StorageType
//         }
//       });
//     }

//     // Check RevenueCat premium status
//     const customerInfo = await Purchases.getCustomerInfo();
//     const isPremium = await isPremiumUser(customerInfo);

//     return next({
//       ...action,
//       meta: {
//         ...action.meta,
//         storage: (isAuthenticated && isPremium) ? 'cloud' : 'local' as StorageType
//       }
//     });
//   } catch (error) {
//     console.error('Error checking premium status:', error);
//     // Fallback to local storage on error
//     return next({
//       ...action,
//       meta: {
//         ...action.meta,
//         storage: 'local' as StorageType
//       }
//     });
//   }
// };