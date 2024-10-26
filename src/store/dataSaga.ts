import { all, call, cancel, delay, fork, put, race, select, take, takeEvery } from 'redux-saga/effects';
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
} from './dataReducer';
import type { ActionCreatorWithPayload, PayloadAction } from '@reduxjs/toolkit';
import { computeHabit, constructHabitUpdate, isEmptyHabitUpdate, type ComputedHabit, type Habit } from '@t/habits';
import Status from '@u/constants/Status';
import { SimpleDate } from '@u/dates';
import { removeUndefined } from '@u/helpers';
import { initialAuthCheckComplete, signInSuccess, signOutRequest, signOutSuccess, signUpSuccess } from '@s/authReducer';
import { collection, deleteDoc, doc, DocumentReference, onSnapshot, Query, query, setDoc, updateDoc, where, WriteBatch, writeBatch, type DocumentData } from 'firebase/firestore';
import { auth, firestore } from '@/firebase';
import { END, eventChannel, type EventChannel, type Task } from 'redux-saga';
import type { Measurement } from '@t/measurements';
import { Collections } from '@u/constants/Firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { serializeUser } from '@t/users';
import { createAuthChannel } from '@s/authSaga';

function* watchAuth() {
  let watchFirestoreChannelTasks: Task[] = [];
  const authChannel: EventChannel<{ user?: User | null, error?: Error | null}> = yield call(createAuthChannel);

  try {
    while (authChannel) {
      const authState: { user?: User | null, error?: Error | null}  = yield take(authChannel);

      for (const task of watchFirestoreChannelTasks.filter((task) => task.isRunning())) {
        yield cancel(task);
      };

      if (authState?.error) {
        console.error(`Auth state error: ${authState.error}`);
        yield put(setMeasurements([]));
        yield put(setHabits([]));
        continue;
      }
  
      const user = authState?.user;
      if (!user) {
        yield put(setMeasurements([]));
        yield put(setHabits([]));
        
        continue;
      }
      
      try {
        watchFirestoreChannelTasks = [
          yield fork(watchFirestoreChannel<Measurement>, Collections.Measurements, setMeasurements, user.uid),
          yield fork(watchFirestoreChannel<Habit>, Collections.Habits, setHabits, user.uid),
        ];
        
        yield all(watchFirestoreChannelTasks);
        
      } catch (error) {
        console.error('Error setting up listeners:', error);
        yield put(signOutRequest());
        yield put(setMeasurements([]));
        yield put(setHabits([]));
      }
    }
  } catch (error) {
    console.error('Error handing auth channel:', error);
  }
  finally {
    if (authChannel) {
      authChannel.close();
    }
    for (const task of watchFirestoreChannelTasks.filter((task) => task.isRunning())) {
      yield cancel(task);
    };
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

function* replaceManyFirestoreDocumentSaga<T extends FirestoreDocument>(
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

function* updateMeasurementsSaga(action: PayloadAction<Measurement[]>) {
  yield put(callUpdateMeasurementStatus(Status.IN_PROGRESS));

  try {
    yield call(replaceManyFirestoreDocumentSaga, action.payload, Collections.Measurements);
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

function* createHabitSaga(action: PayloadAction<ComputedHabit>) {
  yield put(callCreateHabitStatus(Status.IN_PROGRESS));
  
  try {
    const computedHabit = action.payload;
    const today = SimpleDate.today();
    const yesterday = today.getDaysAgo();
  
    const previousHabit = computeHabit(computedHabit, yesterday);
    const newHabitUpdate = constructHabitUpdate(computedHabit, previousHabit, today);
    const newHabit = {
      id: computedHabit.id,
      userId: computedHabit.userId,
      updates: [newHabitUpdate],
    };
    yield call(createFirestoreDocumentSaga, newHabit, Collections.Habits);
    yield put(callCreateHabitStatus(Status.SUCCESS));
  } catch (error) {
    yield put(callCreateHabitStatus(Status.ERROR));
  }
}

function* updateHabitSaga(action: PayloadAction<ComputedHabit>) {
  yield put(callUpdateHabitStatus(Status.IN_PROGRESS));
  
  try {
    const computedHabit = action.payload;
    const today = SimpleDate.today();
    const yesterday = today.getDaysAgo();
  
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

    const nextHabit = {
      id: computedHabit.id,
      userId: computedHabit.userId,
      updates: nextUpdates,
    };

    yield call(replaceFirestoreDocumentSaga, nextHabit, Collections.Habits);
    yield put(callUpdateHabitStatus(Status.SUCCESS));
  } catch (error) {
    yield put(callUpdateHabitStatus(Status.ERROR));
  }
}

function* updateHabitsSaga(action: PayloadAction<ComputedHabit[]>) {
  yield put(callUpdateHabitStatus(Status.IN_PROGRESS));
  
  try {
    const nextHabits: Habit[] = [];

    const computedHabits = action.payload;
    const today = SimpleDate.today();
    const yesterday = today.getDaysAgo();

    computedHabits.forEach((computedHabit) => {
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
  
      nextHabits.push({
        id: computedHabit.id,
        userId: computedHabit.userId,
        updates: nextUpdates,
      });
    })

    yield call(replaceManyFirestoreDocumentSaga, nextHabits, Collections.Habits);
    yield put(callUpdateHabitStatus(Status.SUCCESS));
  } catch (error) {
    yield put(callUpdateHabitStatus(Status.ERROR));
  }
}

function* deleteHabitSaga(action: PayloadAction<ComputedHabit>) {
  yield put(callDeleteHabitStatus(Status.IN_PROGRESS));
  try {
    yield call(deleteFirestoreDocumentSaga, action.payload.id, Collections.Habits);
    yield put(callDeleteHabitStatus(Status.SUCCESS));
  } catch (error) {
    yield put(callDeleteHabitStatus(Status.SUCCESS));
  }
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

    fork(watchAuth),
  ])
}