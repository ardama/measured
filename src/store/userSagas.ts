import { call, put, takeLatest } from 'redux-saga/effects';
import {
  fetchUserStart,
  fetchUserSuccess,
  fetchUserFailure,
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
} from './userReducer';
import type { User } from '@t/users';
import type { PayloadAction } from '@reduxjs/toolkit';

async function fetchUserAPI(userId: string): Promise<User> {
  const response = await fetch(`https://api.example.com/users/${userId}`);
  if (!response.ok) throw new Error('Server Error');
  return await response.json();
}

async function updateUserAPI(userId: string, userData: Partial<User>): Promise<User> {
  const response = await fetch(`https://api.example.com/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!response.ok) throw new Error('Update Failed');
  return await response.json();
}

function* fetchUserSaga(action: PayloadAction<string>) {
  try {
    const user: User = yield call(fetchUserAPI, action.payload);
    yield put(fetchUserSuccess(user));
  } catch (error) {
    yield put(fetchUserFailure(error instanceof Error ? error.message : 'An unknown error occurred'));
  }
}

function* updateUserSaga(action: PayloadAction<{ userId: string; userData: Partial<User>; }>) {
  try {
    const updatedUser: User = yield call(updateUserAPI, action.payload.userId, action.payload.userData);
    yield put(updateUserSuccess(updatedUser));
  } catch (error) {
    yield put(updateUserFailure(error instanceof Error ? error.message : 'An unknown error occurred'));
  }
}

export function* userSaga() {
  yield takeLatest(fetchUserStart.type, fetchUserSaga);
  yield takeLatest(updateUserStart.type, updateUserSaga);
}