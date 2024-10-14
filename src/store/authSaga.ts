import { call, put, takeLatest } from 'redux-saga/effects';
import { signInRequest, signInSuccess, signInFailure, signOutRequest, signOutSuccess, signOutFailure, signUpSuccess, signUpFailure, signUpRequest, type AuthCredentials } from '@s/authReducer';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, type UserCredential } from 'firebase/auth';
import type { PayloadAction } from '@reduxjs/toolkit';
import { auth } from '@/firebase';
import { serializeUser } from '@t/users';

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
      yield put(signOutFailure(error.message));
    } else {
      yield put(signOutFailure('An unknown error occurred while signing in'));
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

export function* authSaga() {
  yield takeLatest(signUpRequest.type, signUp);
  yield takeLatest(signInRequest.type, signIn);
  yield takeLatest(signOutRequest.type, signOut);
}