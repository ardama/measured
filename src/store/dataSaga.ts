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
import { getRemoteData, loadLocalData, type LocalData, type RemoteData } from '@s/helpers';

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

function removeId<T extends { id: string }>(obj: T): Omit<T, 'id'> {
  const { id, ...rest } = obj;
  return rest;
}

type Document = {
  id: string;
  [key: string]: any;
};

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

const setCollectionAction = (collection: string, items: Document[]) => {
  switch (collection) {
    case Collections.Accounts:
      return setAccount(items as Account[]);
    case Collections.Measurements:
      return setMeasurements(items as Measurement[]);
    case Collections.Habits:
      return setHabits(items as Habit[]);
    default:
      throw new Error(`Unknown collection: ${collection}`);
  }
};

function* createLocalDocumentSaga<T extends Document>(
  document: T,
  collectionName: string,
) {
  const items: Document[] = yield call([storageService, storageService.getDocuments], collectionName);
  items.push(document);
  yield call([storageService, storageService.setDocuments], collectionName, items);
  yield put(setCollectionAction(collectionName, items));
}

function* updateLocalDocumentSaga<T extends Document>(
  document: T,
  collectionName: string,
) {
  const items: Document[] = yield call([storageService, storageService.getDocuments], collectionName);
  const index = items.findIndex(item => item.id === document.id);
  if (index !== -1) {
    items[index] = document;
  } else {
    items.push(document);
  }

  yield call([storageService, storageService.setDocuments], collectionName, items);
  yield put(setCollectionAction(collectionName, items));
}

function* deleteLocalDocumentSaga(
  id: string,
  collectionName: string,
) {
  const items: Document[] = yield call([storageService, storageService.getDocuments], collectionName);
  const filteredItems = items.filter(item => item.id !== id);
  yield call([storageService, storageService.setDocuments], collectionName, filteredItems);
  yield put(setCollectionAction(collectionName, filteredItems));
}

function* updateLocalDocumentsSaga<T extends Document>(
  documents: T[],
  collectionName: string,
) {
  const items: Document[] = yield call([storageService, storageService.getDocuments], collectionName);
  documents.forEach(document => {
    const index = items.findIndex(item => item.id === document.id);
    if (index !== -1) {
      items[index] = document;
    } else {
      items.push(document);
    }
  });
  yield call([storageService, storageService.setDocuments], collectionName, items);
  yield put(setCollectionAction(collectionName, items));
}

const performFirebaseOperation = async (operation: (reference: DocumentReference, data?: DocumentData) => Promise<void>, reference: DocumentReference, data?: DocumentData) => {
  data ? await operation(reference, removeUndefined(data)) : await operation(reference);
}
const batchFirebaseOperation = (batch: WriteBatch, operation: (reference: DocumentReference, data?: DocumentData) => WriteBatch, reference: DocumentReference, data?: DocumentData) => {
  data ? operation.call(batch, reference, removeUndefined(data)) : operation.call(batch, reference);
}

function* createFirestoreDocumentSaga<T extends Document>(
  document: T,
  collectionName: string,
) {
  const documentReference = doc(firestore, collectionName, document.id);
  yield call(performFirebaseOperation, setDoc, documentReference, removeId(document));
}

function* createManyFirestoreDocumentSaga<T extends Document>(
  documents: T[],
  collectionName: string,
) {
  const batch = writeBatch(firestore);
  const createOperations = documents.map(document => {
    const documentReference = doc(firestore, collectionName, document.id);
    return call(batchFirebaseOperation, batch, batch.set, documentReference, removeId(document));
  });

  yield all(createOperations);
  yield call([batch, batch.commit]);
}

function* replaceFirestoreDocumentSaga<T extends Document>(
  document: T,
  collectionName: string,
) {
  const documentReference = doc(firestore, collectionName, document.id);
  yield call(performFirebaseOperation, setDoc, documentReference, removeId(document));
}

function* replaceManyFirestoreDocumentSaga<T extends Document>(
  documents: T[],
  collectionName: string,
) {
  const batch = writeBatch(firestore);
  const replaceOperations = documents.map(document => {
    const documentReference = doc(firestore, collectionName, document.id);
    return call(batchFirebaseOperation, batch, batch.set, documentReference, removeId(document));
  })

  yield all(replaceOperations);
  yield call([batch, batch.commit]);
}

function* updateFirestoreDocumentSaga<T extends Document>(
  document: T,
  collectionName: string,
) {
  const documentReference = doc(firestore, collectionName, document.id);
  yield call(performFirebaseOperation, updateDoc, documentReference, removeId(document));
}

function* deleteFirestoreDocumentSaga(
  id: string,
  collectionName: string,
) {
  const documentReference = doc(firestore, collectionName, id);
  yield call(performFirebaseOperation, deleteDoc, documentReference);
}

function* deleteManyFirestoreDocumentSaga(
  ids: string[],
  collectionName: string,
) {
  const batch = writeBatch(firestore);

  const deleteOperations = ids.map(id => {
    const documentReference = doc(firestore, collectionName, id);
    return call(batchFirebaseOperation, batch, batch.delete, documentReference);
  });

  yield all(deleteOperations);
  yield call([batch, batch.commit]);
}

function* handleStorageOperationSaga<T, U>(
  action: PayloadAction<T>,
  statusAction: ActionCreatorWithPayload<string, string>,
  localStorageSaga: (data: U, collectionName: string) => Generator<any, void, any>,
  firebaseStorageSaga: (data: U, collectionName: string) => Generator<any, void, any>,
  dataTransformFunction: (payload: T) => U,
  collection: string,
) {
  yield put(statusAction(Status.IN_PROGRESS));
  
  const isGuest: boolean = yield select((state: RootState) => state.auth.isGuest);
  
  try {
    const saga = isGuest ? localStorageSaga : firebaseStorageSaga;
    const data = dataTransformFunction(action.payload);

    yield* saga(data, collection);
    yield put(statusAction(Status.SUCCESS));
  } catch (error) {
    console.error(error);
    yield put(statusAction(Status.ERROR));
  }
}

function* handleBatchStorageOperationSaga<T, U extends Document>(
  action: PayloadAction<T[]>,
  statusAction: ActionCreatorWithPayload<string, string>,
  localStorageSaga: (documents: U[], collectionName: string) => Generator<any, void, any>,
  firebaseStorageSaga: (documents: U[], collectionName: string) => Generator<any, void, any>,
  dataTransformFunction: (payload: T[]) => U[],
  collection: string,
) {
  yield put(statusAction(Status.IN_PROGRESS));
  
  const isGuest: boolean = yield select((state: RootState) => state.auth.isGuest);
  
  try {
    const saga = isGuest ? localStorageSaga : firebaseStorageSaga;
    const data = dataTransformFunction(action.payload);

    yield* saga(data, collection);
    yield put(statusAction(Status.SUCCESS));
  } catch (error) {
    console.error(error);
    yield put(statusAction(Status.ERROR));
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
    replaceManyFirestoreDocumentSaga,
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
    replaceManyFirestoreDocumentSaga,
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

    yield call(signOutSaga);
    yield put(callDeleteAllStatus(Status.SUCCESS));
  } catch (error) {
    console.error(error);
    yield put(callDeleteAllStatus(Status.ERROR));
  }
}

export function* migrateLocalData(localData: LocalData, userId: string) {
  const migratedData = {
    measurements: localData.measurements.map(m => ({ ...m, userId })),
    habits: localData.habits.map(h => ({ ...h, userId })),
    account: localData.account ? { ...localData.account, userId } : null,
  };

  // Upload to Firebase
  yield all([
    call(createManyFirestoreDocumentSaga, migratedData.measurements, Collections.Measurements),
    call(createManyFirestoreDocumentSaga, migratedData.habits, Collections.Habits),
    migratedData.account && call(createFirestoreDocumentSaga, migratedData.account, Collections.Accounts),
  ]);

  // Clear local storage
  yield call([storageService, storageService.clearAll]);
}

export function* dataSaga() {
  yield all([
    takeEvery(callCreateMeasurement.type, createMeasurementSaga),
    takeEvery(callUpdateMeasurement.type, updateMeasurementSaga),
    takeEvery(callUpdateMeasurements.type, updateMeasurementsSaga),
    takeEvery(callDeleteMeasurement.type, deleteMeasurementSaga),

    takeEvery(callCreateHabit.type, createHabitSaga),
    takeEvery(callUpdateHabit.type, updateHabitSaga),
    takeEvery(callUpdateHabits.type, updateHabitsSaga),
    takeEvery(callDeleteHabit.type, deleteHabitSaga),
    
    takeEvery(callUpdateAccount.type, updateAccountSaga),

    takeEvery(callDeleteAll.type, deleteAllSaga),

    fork(watchAuth),
  ])
}