import { all, select } from 'redux-saga/effects';
import { put } from 'redux-saga/effects';
import { call } from 'redux-saga/effects';
import { setHabits } from '@s/dataReducer';
import { setMeasurements } from '@s/dataReducer';
import type { Habit } from '@t/habits';
import { setAccount } from '@s/dataReducer';
import type { Measurement } from '@t/measurements';
import type { Account } from '@t/users';
import { Collections } from '@u/constants/Firestore';
import type { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import { storageService } from '@s/storage';
import { collection, deleteDoc, doc,where,  query, updateDoc, writeBatch, getDocs } from 'firebase/firestore';
import { setDoc } from 'firebase/firestore';
import type { DocumentData, QuerySnapshot, WriteBatch } from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';
import { removeUndefined } from '@u/helpers';
import { auth, firestore } from '@/firebase';
import Status from '@u/constants/Status';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@t/redux';

function removeId<T extends { id: string }>(obj: T): Omit<T, 'id'> {
  const { id, ...rest } = obj;
  return rest;
}

type Document = {
  id: string;
  [key: string]: any;
};

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

export function* createLocalDocumentSaga<T extends Document>(
  document: T,
  collectionName: string,
) {
  const items: Document[] = yield call([storageService, storageService.getDocuments], collectionName);
  items.push(document);
  yield call([storageService, storageService.setDocuments], collectionName, items);
  yield put(setCollectionAction(collectionName, items));
}

export function* updateLocalDocumentSaga<T extends Document>(
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

export function* deleteLocalDocumentSaga(
  id: string,
  collectionName: string,
) {
  const items: Document[] = yield call([storageService, storageService.getDocuments], collectionName);
  const filteredItems = items.filter(item => item.id !== id);
  yield call([storageService, storageService.setDocuments], collectionName, filteredItems);
  yield put(setCollectionAction(collectionName, filteredItems));
}

export function* updateLocalDocumentsSaga<T extends Document>(
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

export function* createFirestoreDocumentSaga<T extends Document>(
  document: T,
  collectionName: string,
) {
  const documentReference = doc(firestore, collectionName, document.id);
  yield call(performFirebaseOperation, setDoc, documentReference, removeId(document));
}

export function* createManyFirestoreDocumentSaga<T extends Document>(
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

export function* replaceFirestoreDocumentSaga<T extends Document>(
  document: T,
  collectionName: string,
) {
  const documentReference = doc(firestore, collectionName, document.id);
  yield call(performFirebaseOperation, setDoc, documentReference, removeId(document));
}

export function* replaceManyFirestoreDocumentSaga<T extends Document>(
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

export function* updateFirestoreDocumentSaga<T extends Document>(
  document: T,
  collectionName: string,
) {
  const documentReference = doc(firestore, collectionName, document.id);
  yield call(performFirebaseOperation, updateDoc, documentReference, removeId(document));
}

export function* deleteFirestoreDocumentSaga(
  id: string,
  collectionName: string,
) {
  const documentReference = doc(firestore, collectionName, id);
  yield call(performFirebaseOperation, deleteDoc, documentReference);
}

export function* deleteManyFirestoreDocumentSaga(
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

export function* handleStorageOperationSaga<T, U>(
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

export function* handleBatchStorageOperationSaga<T, U extends Document>(
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

export type LocalData = { measurements: Measurement[], habits: Habit[], account: Account | null };
export function* getLocalData(): Generator<any, LocalData, any> {
  const [measurements, habits, account] = yield all([
    call([storageService, storageService.getMeasurements]),
    call([storageService, storageService.getHabits]), 
    call([storageService, storageService.getAccount]),
  ]);
  return { measurements, habits, account };
}

export function* loadLocalData(): Generator<any, void, any> {
  const { measurements, habits, account } = yield call(getLocalData);
  yield all([
    put(setMeasurements(measurements)),
    put(setHabits(habits)),
    put(setAccount(account ? [account] : [])),
  ]);
}

export type RemoteData = { measurements: QuerySnapshot, habits: QuerySnapshot, accounts: QuerySnapshot };
export function* getRemoteData(): Generator<any, RemoteData, any> {
  const userId = auth.currentUser?.uid;
  if (!userId || !auth.currentUser) throw new Error('No authenticated user');

  const [measurements, habits, accounts] = yield all([
    call(getDocs, query(collection(firestore, Collections.Measurements), where('userId', '==', userId))),
    call(getDocs, query(collection(firestore, Collections.Habits), where('userId', '==', userId))),
    call(getDocs, query(collection(firestore, Collections.Accounts), where('userId', '==', userId))),
  ]);
  return { measurements, habits, accounts };
}