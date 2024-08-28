/** @typedef {import('@type/users').User} User */

import { call, put, takeLatest } from 'redux-saga/effects';
import {
  fetchUserStart,
  fetchUserSuccess,
  fetchUserFailure,
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
} from './userReducer';

/**
 * @template T
 * @typedef {import('@reduxjs/toolkit').PayloadAction<T>} PayloadAction
 */

/**
 * @param {string} userId
 * @returns {Promise<User>}
 */
async function fetchUserAPI(userId) {
  const response = await fetch(`https://api.example.com/users/${userId}`);
  if (!response.ok) throw new Error('Server Error');
  return await response.json();
}

/**
 * @param {string} userId
 * @param {Partial<User>} userData
 * @returns {Promise<User>}
 */
async function updateUserAPI(userId, userData) {
  const response = await fetch(`https://api.example.com/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!response.ok) throw new Error('Update Failed');
  return await response.json();
}

/**
 * @param {PayloadAction<string>} action
 */
function* fetchUserSaga(action) {
  try {
    /** @type {User} */
    const user = yield call(fetchUserAPI, action.payload);
    yield put(fetchUserSuccess(user));
  } catch (error) {
    yield put(fetchUserFailure(error instanceof Error ? error.message : 'An unknown error occurred'));
  }
}

/**
 * @param {PayloadAction<{userId: string, userData: Partial<User>}>} action
 */
function* updateUserSaga(action) {
  try {
    /** @type {User} */
    const updatedUser = yield call(updateUserAPI, action.payload.userId, action.payload.userData);
    yield put(updateUserSuccess(updatedUser));
  } catch (error) {
    yield put(updateUserFailure(error instanceof Error ? error.message : 'An unknown error occurred'));
  }
}

export function* userSaga() {
  yield takeLatest(fetchUserStart.type, fetchUserSaga);
  yield takeLatest(updateUserStart.type, updateUserSaga);
}