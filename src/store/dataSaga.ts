import { all, call, cancel, fork, put, take, takeEvery } from 'redux-saga/effects';
import {
  setHabitUpdates,
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
} from './dataReducer';
import type { ActionCreatorWithPayload, PayloadAction } from '@reduxjs/toolkit';
import { constructHabitUpdate, emptyHabitUpdate, rewindHabit, type Habit, type HabitUpdate } from '@t/habits';
import Status from '@u/constants/Status';
import { SimpleDate } from '@u/dates';
import { generateId, removeUndefined } from '@u/helpers';
import { stripExcessFields } from '@u/constants/Types';
import { signInSuccess, signOutSuccess, signUpSuccess } from '@s/authReducer';
import { collection, deleteDoc, doc, DocumentReference, onSnapshot, Query, query, setDoc, updateDoc, where, WriteBatch, writeBatch, type DocumentData } from 'firebase/firestore';
import { auth, firestore } from '@/firebase';
import { END, eventChannel, type EventChannel, type Task, type Unsubscribe } from 'redux-saga';
import type { Measurement } from '@t/measurements';
import { Collections } from '@u/constants/Firestore';

function* watchAuth() {
  while (true) {
    yield take([signInSuccess.type, signUpSuccess.type]);

    const { uid } = auth.currentUser || {};
    if (uid) {
      const watchFirestoreChannelTasks: Task[] = [
        yield fork(watchFirestoreChannel<Measurement>, 'measurements', setMeasurements, uid),
        yield fork(watchFirestoreChannel<HabitUpdate>, 'habit_updates', setHabitUpdates, uid),
      ];
      
      const watchAllChannelsTask: Task = yield all(watchFirestoreChannelTasks);

      yield take(signOutSuccess.type);
      yield cancel(watchAllChannelsTask);
    }

    yield setMeasurements([]);
    yield setHabitUpdates([]);
  }

}

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
  } finally {

  }
}

function removeId<T extends { id: string }>(obj: T): Omit<T, 'id'> {
  const { id, ...rest } = obj;
  return rest;
}

type FirestoreDocument = {
  id: string;
  [key: string]: any;
};

const performFirebaseOperation = async (operation: (reference: DocumentReference, data?: DocumentData) => Promise<void>, reference: DocumentReference, data?: DocumentData) => {
  data ? await operation(reference, removeUndefined(data)) : await operation(reference);
}
const batchFirebaseOperation = (batch: WriteBatch, operation: (reference: DocumentReference, data?: DocumentData) => WriteBatch, reference: DocumentReference, data?: DocumentData) => {
  data ? operation.call(batch, reference, removeUndefined(data)) : operation.call(batch, reference);
}

function* createFirestoreDocumentSaga<T extends FirestoreDocument>(
  document: T,
  collectionName: string,
) {
  const documentReference = doc(firestore, collectionName, document.id);
  yield call(performFirebaseOperation, setDoc, documentReference, removeId(document));
}

function* createManyFirestoreDocumentSaga<T extends FirestoreDocument>(
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

function* replaceFirestoreDocumentSaga<T extends FirestoreDocument>(
  document: T,
  collectionName: string,
) {
  const documentReference = doc(firestore, collectionName, document.id);
  yield call(performFirebaseOperation, setDoc, documentReference, removeId(document));
}


function* updateFirestoreDocumentSaga<T extends FirestoreDocument>(
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

function* createMeasurementSaga(action: PayloadAction<Measurement>) {
  yield put(callCreateMeasurementStatus(Status.IN_PROGRESS));
  
  try {
    yield call(createFirestoreDocumentSaga, action.payload, Collections.Measurements);
    yield put(callCreateMeasurementStatus(Status.SUCCESS));
  } catch (error) {
    console.error(error);
    yield put(callCreateMeasurementStatus(Status.ERROR));
  }
}

function* updateMeasurementSaga(action: PayloadAction<Measurement>) {
  yield put(callUpdateMeasurementStatus(Status.IN_PROGRESS));
  
  try {
    yield call(replaceFirestoreDocumentSaga, action.payload, Collections.Measurements);
    yield put(callUpdateMeasurementStatus(Status.SUCCESS));
  } catch (error) {
    console.error(error);
    yield put(callUpdateMeasurementStatus(Status.ERROR));
  }
}

function* deleteMeasurementSaga(action: PayloadAction<Measurement>) {
  yield put(callDeleteMeasurementStatus(Status.IN_PROGRESS));
  try {
    yield call(deleteFirestoreDocumentSaga, action.payload.id, Collections.Measurements);
    yield put(callDeleteMeasurementStatus(Status.SUCCESS));
  } catch (error) {
    console.error(error);
    yield put(callDeleteMeasurementStatus(Status.SUCCESS));
  }
}

function* createHabitSaga(action: PayloadAction<Habit>) {
  yield put(callCreateHabitStatus(Status.IN_PROGRESS));
  
  try {
    const newHabit = action.payload;
    const today = SimpleDate.today();
    const yesterday = today.getPreviousDay();
  
    const previousHabit = rewindHabit(newHabit, yesterday);
    const newHabitUpdate = constructHabitUpdate(newHabit, previousHabit, today);
    yield call(createFirestoreDocumentSaga, newHabitUpdate, Collections.HabitUpdates);
    yield put(callCreateHabitStatus(Status.SUCCESS));
  } catch (error) {
    yield put(callCreateHabitStatus(Status.ERROR));
  }
}

function* updateHabitSaga(action: PayloadAction<Habit>) {
  yield put(callUpdateHabitStatus(Status.IN_PROGRESS));
  
  try {
    const nextHabit = action.payload;
    const today = SimpleDate.today();
    const yesterday = today.getPreviousDay();
  
    const previousHabit = rewindHabit(nextHabit, yesterday);
    const nextHabitUpdate = constructHabitUpdate(nextHabit, previousHabit, today);
    const todayUpdate = nextHabit.updates.find(({ date }) => date === today.toString());

    if (todayUpdate) {
      nextHabitUpdate.id = todayUpdate.id;
      yield call(replaceFirestoreDocumentSaga, nextHabitUpdate, Collections.HabitUpdates);
    }
    else yield call(createFirestoreDocumentSaga, nextHabitUpdate, Collections.HabitUpdates);
    yield put(callUpdateHabitStatus(Status.SUCCESS));
  } catch (error) {
    yield put(callUpdateHabitStatus(Status.ERROR));
  }
}

function* deleteHabitSaga(action: PayloadAction<Habit>) {
  yield put(callDeleteHabitStatus(Status.IN_PROGRESS));
  try {
    const ids = action.payload.updates.map(({ id }) => id);
    yield call(deleteManyFirestoreDocumentSaga, ids, Collections.HabitUpdates);
    yield put(callDeleteHabitStatus(Status.SUCCESS));
  } catch (error) {
    yield put(callDeleteHabitStatus(Status.SUCCESS));
  }
}

export function* dataSaga() {
  yield all([
    takeEvery(callCreateMeasurement.type, createMeasurementSaga),
    takeEvery(callUpdateMeasurement.type, updateMeasurementSaga),
    takeEvery(callDeleteMeasurement.type, deleteMeasurementSaga),

    takeEvery(callCreateHabit.type, createHabitSaga),
    takeEvery(callUpdateHabit.type, updateHabitSaga),
    takeEvery(callDeleteHabit.type, deleteHabitSaga),

    watchAuth(),
  ])
}