import { all, call, put, take, takeEvery, takeLatest } from 'redux-saga/effects';
import {
  fetchUserStart,
  fetchUserSuccess,
  fetchUserFailure,
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,

  addHabitUpdate,
  editHabitUpdate,
  replaceHabitUpdate,
  removeHabitUpdates,
} from './userReducer';
import type { User } from '@t/users';
import type { PayloadAction } from '@reduxjs/toolkit';
import { constructHabit, constructHabitUpdate, emptyHabitUpdate, rewindHabit, type Habit, type HabitUpdate } from '@t/habits';
import {
  callCreateHabit,
  callCreateHabitStatus,
  callDeleteHabit,
  callDeleteHabitStatus,
  callUpdateHabit,
  callUpdateHabitStatus,
} from '@s/appReducer';
import Status from '@u/constants/Status';
import { SimpleDate } from '@u/dates';
import { generateId } from '@u/helpers';
import { stripExcessFields } from '@u/constants/Types';

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

function* createHabitSaga(action: PayloadAction<Habit>) {
  yield put(callCreateHabitStatus(Status.IN_PROGRESS));
  const newHabit = action.payload;
  
  const newHabitUpdate: HabitUpdate = stripExcessFields({
    ...newHabit,
    id: generateId(),
    habitId: newHabit.habitId,
    date: SimpleDate.today().toString(),
  }, emptyHabitUpdate);
  yield put(addHabitUpdate(newHabitUpdate));
  
  yield put(callCreateHabitStatus(Status.SUCCESS));
}

function* updateHabitSaga(action: PayloadAction<Habit>) {
  yield put(callUpdateHabitStatus(Status.IN_PROGRESS));
  const nextHabit = action.payload;

  const today = SimpleDate.today();
  const yesterday = today.getPreviousDay();

  const previousHabit = rewindHabit(nextHabit, yesterday);
  const nextHabitUpdate = constructHabitUpdate(nextHabit, previousHabit, today);
  const todayUpdate = nextHabit.updates.find(({ date }) => date === today.toString());

  if (todayUpdate) yield put(replaceHabitUpdate({ id: todayUpdate.id, habitUpdate: nextHabitUpdate }));
  else yield put(addHabitUpdate(nextHabitUpdate));

  yield put(callUpdateHabitStatus(Status.SUCCESS));
}

function* deleteHabitSaga(action: PayloadAction<Habit>) {
  put(callDeleteHabitStatus(Status.IN_PROGRESS));
  put(removeHabitUpdates(action.payload.habitId));
  
  put(callDeleteHabitStatus(Status.SUCCESS));
}

export function* userSaga() {
  yield all([
    takeLatest(fetchUserStart.type, fetchUserSaga),
    takeLatest(updateUserStart.type, updateUserSaga),

    takeEvery(callCreateHabit.type, createHabitSaga),
    takeEvery(callUpdateHabit.type, updateHabitSaga),
    takeEvery(callDeleteHabit.type, deleteHabitSaga),
  ])
}