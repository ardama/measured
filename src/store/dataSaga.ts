import { all, call, cancel, delay, fork, put, race, select, take, takeEvery, type CallEffect } from 'redux-saga/effects';
import {
  setHabits,
  setMeasurements,

  callCreateMeasurement,
  callCreateMeasurementStatus,
  callUpdateMeasurement,
  callUpdateMeasurementStatus,
  callDeleteMeasurement,
  callDeleteMeasurementStatus,

  callCreateHabit,
  callCreateHabitStatus,
  callUpdateHabit,
  callUpdateHabitStatus,
  callDeleteHabit,
  callDeleteHabitStatus,
  callUpdateMeasurements,
  callUpdateHabits,
  setAccount,
  callUpdateAccountStatus,
  callUpdateAccount,
  callDeleteAll,
  callDeleteAllStatus,
  callGenerateSampleData,
  callCreateMeasurementsStatus,
  callCreateHabitsStatus,
  callCreateMeasurements,
  callCreateHabits,
} from './dataReducer';
import type { ActionCreatorWithPayload, PayloadAction } from '@reduxjs/toolkit';
import { computeHabit, constructHabitUpdate, isEmptyHabitUpdate, type ComputedHabit, type Habit } from '@t/habits';
import Status from '@u/constants/Status';
import { SimpleDate } from '@u/dates';
import { removeUndefined } from '@u/helpers';
import { initialAuthCheckComplete, signInSuccess, signOutRequest, signOutSuccess, signUpSuccess } from '@s/authReducer';
import { collection, deleteDoc, doc, DocumentReference, getDocs, onSnapshot, Query, query, setDoc, updateDoc, where, WriteBatch, writeBatch, type DocumentData } from 'firebase/firestore';
import { auth, firestore } from '@/firebase';
import { END, eventChannel, type EventChannel, type Task } from 'redux-saga';
import type { Measurement } from '@t/measurements';
import { Collections } from '@u/constants/Firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { serializeUser, type Account } from '@t/users';
import { createAuthChannel, signOutSaga } from '@s/authSaga';
import type { RootState } from '@t/redux';
import { storageService } from '@s/storage';
import { createLocalDocumentSaga, replaceManyFirestoreDocumentsSaga, deleteFirestoreDocumentSaga, deleteLocalDocumentSaga, replaceFirestoreDocumentSaga, updateLocalDocumentSaga, updateLocalDocumentsSaga, handleBatchStorageOperationSaga, loadLocalData, type RemoteData, getRemoteData, createLocalDocumentsSaga, createManyFirestoreDocumentsSaga } from '@s/storageSaga';
import { handleStorageOperationSaga } from '@s/storageSaga';
import { createFirestoreDocumentSaga } from '@s/storageSaga';
import { sampleMeasurements, sampleHabits } from '@u/sampleData';

function createFirestoreChannel<T>(collectionName: string, setAction: ActionCreatorWithPayload<T[], string>, uid: string): EventChannel<PayloadAction<T[]>> {
  const q: Query<DocumentData> = query(collection(firestore, collectionName), where('userId', '==', uid));
  
  return eventChannel(emit => {
    const unsubscribe = onSnapshot(q, snapshot => {
      const data: T[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      emit(setAction(data));
    });
    
    return () => {
      unsubscribe();
      emit(END);
    };
  });
}

function* watchFirestoreChannel<T>(collectionName: string, setAction: ActionCreatorWithPayload<T[], string>, uid: string) {
  const channel: EventChannel<PayloadAction<T[]>> = yield call(createFirestoreChannel<T>, collectionName, setAction, uid);
  
  try {
    while (true) {
      const action: PayloadAction<T[]> = yield take(channel);
      yield put(action);
    }
  } catch (error) {
    console.error(`Error listening to ${collectionName} channel:`, error);
  } finally {
    channel.close();
  }
}

function* watchLocalStorage<T>(collectionName: string, setAction: ActionCreatorWithPayload<T[], string>) {
  try {
    // Initial load
    const data: T[] = yield call([storageService, storageService.getDocuments], collectionName);
    yield put(setAction(data));
  } catch (error) {
    console.error(`Error loading from local storage ${collectionName}:`, error);
  }
}

function* watchAuth() {
  let watchChannelTasks: Task[] = [];
  const authChannel: EventChannel<{ user?: User | null, error?: Error | null}> = yield call(createAuthChannel);

  try {
    while (authChannel) {
      const authState: { user?: User | null, error?: Error | null} = yield take(authChannel);
      const isGuest: boolean = yield select((state: RootState) => state.auth.isGuest);

      // Cancel existing listeners
      for (const task of watchChannelTasks.filter((task) => task.isRunning())) {
        yield cancel(task);
      }

      if (authState?.error) {
        console.error(`Auth state error: ${authState.error}`);
        yield put(setMeasurements([]));
        yield put(setHabits([]));
        yield put(setAccount([]));
        continue;
      }

      try {
        if (isGuest) {
          yield call(loadLocalData);
        } else if (authState?.user) {
          watchChannelTasks = [
            yield fork(watchFirestoreChannel<Account>, Collections.Accounts, setAccount, authState.user.uid),
            yield fork(watchFirestoreChannel<Measurement>, Collections.Measurements, setMeasurements, authState.user.uid),
            yield fork(watchFirestoreChannel<Habit>, Collections.Habits, setHabits, authState.user.uid),
          ];
          yield all(watchChannelTasks);
        }
      } catch (error) {
        console.error('Error setting up listeners:', error);
        yield put(setMeasurements([]));
        yield put(setHabits([]));
        yield put(setAccount([]));
      }
    }
  } catch (error) {
    console.error('Error handing auth channel:', error);
  } finally {
    if (authChannel) {
      authChannel.close();
    }
    for (const task of watchChannelTasks.filter((task) => task.isRunning())) {
      yield cancel(task);
    }
  }
}

function* createMeasurementSaga(action: PayloadAction<Measurement>) {
  yield* handleStorageOperationSaga(
    action,
    callCreateMeasurementStatus,
    createLocalDocumentSaga,
    createFirestoreDocumentSaga,
    (payload: Measurement) => payload,
    Collections.Measurements
  );
}

function* createMeasurementsSaga(action: PayloadAction<Measurement[]>) {
  yield* handleBatchStorageOperationSaga(
    action,
    callCreateMeasurementsStatus,
    createLocalDocumentsSaga,
    createManyFirestoreDocumentsSaga,
    (payload: Measurement[]) => payload,
    Collections.Measurements
  );
}

function* updateMeasurementSaga(action: PayloadAction<Measurement>) {
  yield* handleStorageOperationSaga(
    action,
    callUpdateMeasurementStatus,
    updateLocalDocumentSaga,
    replaceFirestoreDocumentSaga,
    (payload: Measurement) => payload,
    Collections.Measurements
  );
}

function* updateMeasurementsSaga(action: PayloadAction<Measurement[]>) {
  yield* handleBatchStorageOperationSaga(
    action,
    callUpdateMeasurementStatus,
    updateLocalDocumentsSaga,
    replaceManyFirestoreDocumentsSaga,
    (payload: Measurement[]) => payload,
    Collections.Measurements
  );
}

function* deleteMeasurementSaga(action: PayloadAction<Measurement>) {
  yield* handleStorageOperationSaga(
    action,
    callDeleteMeasurementStatus,
    deleteLocalDocumentSaga,
    deleteFirestoreDocumentSaga,
    (payload: Measurement) => payload.id,
    Collections.Measurements
  );
}

function* createHabitSaga(action: PayloadAction<ComputedHabit>) {
  yield* handleStorageOperationSaga(
    action,
    callCreateHabitStatus,
    createLocalDocumentSaga,
    createFirestoreDocumentSaga,
    (payload: ComputedHabit) => {
      const today = SimpleDate.today();
      const yesterday = today.getDaysAgo();
      const previousHabit = computeHabit(payload, yesterday);
      const newHabitUpdate = constructHabitUpdate(payload, previousHabit, today);
      return {
        id: payload.id,
        userId: payload.userId,
        updates: [newHabitUpdate],
      };
    },
    Collections.Habits
  );
}

function* createHabitsSaga(action: PayloadAction<ComputedHabit[]>) {
  yield* handleBatchStorageOperationSaga(
    action,
    callCreateHabitsStatus,
    createLocalDocumentsSaga,
    createManyFirestoreDocumentsSaga,
    (payload: ComputedHabit[]) => {
      const today = SimpleDate.today();
      const yesterday = today.getDaysAgo();
      return payload.map(habit => {
        const previousHabit = computeHabit(habit, yesterday);
        const newHabitUpdate = constructHabitUpdate(habit, previousHabit, today);
        return {
          id: habit.id,
          userId: habit.userId,
          updates: [newHabitUpdate],
        };
      });
    },
    Collections.Habits
  );
}

function* updateHabitSaga(action: PayloadAction<ComputedHabit>) {
  yield* handleStorageOperationSaga(
    action,
    callUpdateHabitStatus,
    updateLocalDocumentSaga,
    replaceFirestoreDocumentSaga,
    (payload: ComputedHabit) => {
      const today = SimpleDate.today();
      const yesterday = today.getDaysAgo();
      const previousHabit = computeHabit(payload, yesterday);
      const nextHabitUpdate = constructHabitUpdate(payload, previousHabit, today);
      
      const nextUpdates = [...payload.updates];
      const todayUpdateIndex = payload.updates.findIndex(({ date }) => date === today.toString());
      if (todayUpdateIndex >= 0) {
        if (isEmptyHabitUpdate(nextHabitUpdate)) {
          nextUpdates.splice(todayUpdateIndex, 1);
        } else {
          nextUpdates[todayUpdateIndex] = nextHabitUpdate;
        }
      } else {
        nextUpdates.push(nextHabitUpdate);
      }

      return {
        id: payload.id,
        userId: payload.userId,
        updates: nextUpdates,
      };
    },
    Collections.Habits
  );
}

function* updateHabitsSaga(action: PayloadAction<ComputedHabit[]>) {
  yield* handleStorageOperationSaga(
    action,
    callUpdateHabitStatus,
    updateLocalDocumentsSaga,
    replaceManyFirestoreDocumentsSaga,
    (payload: ComputedHabit[]) => {
      const today = SimpleDate.today();
      const yesterday = today.getDaysAgo();

      return payload.map(computedHabit => {
        const previousHabit = computeHabit(computedHabit, yesterday);
        const nextHabitUpdate = constructHabitUpdate(computedHabit, previousHabit, today);
        
        const nextUpdates = [...computedHabit.updates];
        const todayUpdateIndex = computedHabit.updates.findIndex(({ date }) => date === today.toString());
        if (todayUpdateIndex >= 0) {
          if (isEmptyHabitUpdate(nextHabitUpdate)) {
            nextUpdates.splice(todayUpdateIndex, 1);
          } else {
            nextUpdates[todayUpdateIndex] = nextHabitUpdate;
          }
        } else {
          nextUpdates.push(nextHabitUpdate);
        }
    
        return {
          id: computedHabit.id,
          userId: computedHabit.userId,
          updates: nextUpdates,
        };
      });
    },
    Collections.Habits
  );
}

function* deleteHabitSaga(action: PayloadAction<ComputedHabit>) {
  yield* handleStorageOperationSaga(
    action,
    callDeleteHabitStatus,
    deleteLocalDocumentSaga,
    deleteFirestoreDocumentSaga,
    (payload: ComputedHabit) => payload.id,
    Collections.Habits
  );
}

function* updateAccountSaga(action: PayloadAction<Account>) {
  yield* handleStorageOperationSaga(
    action,
    callUpdateAccountStatus,
    updateLocalDocumentSaga,
    replaceFirestoreDocumentSaga,
    (payload: Account) => {
      if (!payload.userId && auth.currentUser) {
        return {
          ...payload,
          userId: auth.currentUser.uid
        };
      }
      return payload;
    },
    Collections.Accounts
  );
}

function* deleteAllSaga(): Generator<any, void, any> {
  yield put(callDeleteAllStatus(Status.IN_PROGRESS));
  try {
    const isGuest: boolean = yield select((state: RootState) => state.auth.isGuest);
    if (isGuest) {
      yield call([storageService, storageService.clearAll]);
    } else {
      const userId = auth.currentUser?.uid;
      if (!userId || !auth.currentUser) throw new Error('No authenticated user');

      // Delete all user data from Firestore
      const batch = writeBatch(firestore);
      
      // Get all user data
      const { measurements, habits, accounts }: RemoteData = yield call(getRemoteData);

      // Add delete operations to batch
      measurements.forEach((doc: DocumentData) => batch.delete(doc.ref));
      habits.forEach((doc: DocumentData) => batch.delete(doc.ref));
      accounts.forEach((doc: DocumentData) => batch.delete(doc.ref));

      // Execute batch delete
      yield call([batch, batch.commit]);
    }

    yield call(signOutSaga);
    yield put(callDeleteAllStatus(Status.SUCCESS));
  } catch (error) {
    console.error(error);
    yield put(callDeleteAllStatus(Status.ERROR));
  }
}

function* generateSampleDataSaga() {
  const measurements = sampleMeasurements.map(measurement => ({
    ...measurement,
    userId: auth.currentUser?.uid || '',
  }));
  yield put(callCreateMeasurements(measurements));

  const habits = sampleHabits.map(habit => ({
    ...habit,
    userId: auth.currentUser?.uid || '',
  }));
  yield put(callCreateHabits(habits));
}

export function* dataSaga() {
  yield all([
    takeEvery(callCreateMeasurement.type, createMeasurementSaga),
    takeEvery(callCreateMeasurements.type, createMeasurementsSaga),
    takeEvery(callUpdateMeasurement.type, updateMeasurementSaga),
    takeEvery(callUpdateMeasurements.type, updateMeasurementsSaga),
    takeEvery(callDeleteMeasurement.type, deleteMeasurementSaga),

    takeEvery(callCreateHabit.type, createHabitSaga),
    takeEvery(callCreateHabits.type, createHabitsSaga),
    takeEvery(callUpdateHabit.type, updateHabitSaga),
    takeEvery(callUpdateHabits.type, updateHabitsSaga),
    takeEvery(callDeleteHabit.type, deleteHabitSaga),
    
    takeEvery(callUpdateAccount.type, updateAccountSaga),

    takeEvery(callDeleteAll.type, deleteAllSaga),

    takeEvery(callGenerateSampleData.type, generateSampleDataSaga),

    fork(watchAuth),
  ])
}