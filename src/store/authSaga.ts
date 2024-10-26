import { call, delay, put, race, take, takeLatest } from 'redux-saga/effects';
import { signInRequest, signInSuccess, signInFailure, signOutRequest, signOutSuccess, signOutFailure, signUpSuccess, signUpFailure, signUpRequest, type AuthCredentials, initialAuthCheckComplete } from '@s/authReducer';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, type User, type UserCredential } from 'firebase/auth';
import type { PayloadAction } from '@reduxjs/toolkit';
import { auth } from '@/firebase';
import { serializeUser } from '@t/users';
import { eventChannel, type EventChannel } from 'redux-saga';

function* signUp(action: PayloadAction<AuthCredentials>) {
  const { email, password } = action.payload;
  try {
    const result: UserCredential = yield call(createUserWithEmailAndPassword, auth, email, password);
    yield put(signUpSuccess(serializeUser(result.user)));
  } catch (error) {
    if (error instanceof Error) {
      yield put(signUpFailure(error.message));
    } else {
      yield put(signUpFailure('An unknown error occurred while signing up'));
    }
  }
}

function* signIn(action: PayloadAction<AuthCredentials>) {
  const { email, password } = action.payload;
  try {
    const result: UserCredential = yield call(signInWithEmailAndPassword, auth, email, password);
    yield put(signInSuccess(serializeUser(result.user)));
  } catch (error) {
    if (error instanceof Error) {
      yield put(signInFailure(error.message));
    } else {
      yield put(signInFailure('An unknown error occurred while signing in'));
    }
  }
}

function* signOut() {
  try {
    yield call([auth, auth.signOut]);
    yield put(signOutSuccess());
  } catch (error) {
    if (error instanceof Error) {
      yield put(signOutFailure(error.message));
    } else {
      yield put(signOutFailure('An unknown error occurred while signing out'));
    }
  }
}

export function createAuthChannel(): EventChannel<{ user?: User | null, error?: Error | null}> {
  return eventChannel(emit => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      emit({ user });
    }, error => {
      emit({ error });
    })

    return unsubscribe;
  });
}

function* initialAuthCheckSaga() {
  const authChannel: EventChannel<{ user?: User | null, error?: Error | null}> = yield call(createAuthChannel);

    try {
      const { authState } = yield race({
        authState: take(authChannel),
        timeout: delay(2000),
      });

      if (authState?.user) {
        yield put(signInSuccess(serializeUser(authState.user)));
        return;
      }

      if (authState?.error)console.error(authState.error);
      yield put(signOutSuccess());
    } finally {
      yield delay(750);
      yield put(initialAuthCheckComplete());
      authChannel.close();
    }
}

export function* authSaga() {
  yield takeLatest(signUpRequest.type, signUp);
  yield takeLatest(signInRequest.type, signIn);
  yield takeLatest(signOutRequest.type, signOut);
  yield call(initialAuthCheckSaga);
}