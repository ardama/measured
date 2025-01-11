import type { ComputedHabit, Habit, HabitCondition, HabitUpdate } from '@t/habits';
import type { Measurement, MeasurementRecording } from '@t/measurements';
import type { Account } from '@t/users';
import { all, call, put } from 'redux-saga/effects';
import { storageService } from '@s/storage';
import { setAccount, setHabits, setMeasurements } from '@s/dataReducer';
import { QuerySnapshot, where, type DocumentData } from 'firebase/firestore';
import { collection } from 'firebase/firestore';
import { query } from 'firebase/firestore';
import { getDocs } from 'firebase/firestore';
import { auth, firestore } from '@/firebase';
import { Collections } from '@u/constants/Firestore';

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

// Helper function to check recording equality
const areRecordingsEqual = (a: MeasurementRecording[], b: MeasurementRecording[]): boolean => {
  if (a.length !== b.length) return false;
  
  // Sort by date to ensure consistent comparison
  const sortedA = [...a].sort((x, y) => x.date.localeCompare(y.date));
  const sortedB = [...b].sort((x, y) => x.date.localeCompare(y.date));
  
  return sortedA.every((recording, index) => {
    const otherRecording = sortedB[index];
    return recording.date === otherRecording.date && 
           recording.value === otherRecording.value;
  });
};

// Helper function to check condition equality
const areConditionsEqual = (a: HabitCondition[], b: HabitCondition[]): boolean => {
  if (a.length !== b.length) return false;
  
  return a.every((condition, index) => {
    const otherCondition = b[index];
    return condition.measurementId === otherCondition.measurementId &&
           condition.operator === otherCondition.operator &&
           condition.target === otherCondition.target;
  });
};

// Helper function to check update equality
const areUpdatesEqual = (a: HabitUpdate[], b: HabitUpdate[]): boolean => {
  if (a.length !== b.length) return false;
  
  return a.every((update, index) => {
    const otherUpdate = b[index];
    if (update.date !== otherUpdate.date) return false;
    if (update.name !== otherUpdate.name) return false;
    if (update.isWeekly !== otherUpdate.isWeekly) return false;
    if (update.daysPerWeek !== otherUpdate.daysPerWeek) return false;
    if (update.points !== otherUpdate.points) return false;
    if (update.archived !== otherUpdate.archived) return false;
    if (update.predicate !== otherUpdate.predicate) return false;
    if (update.priority !== otherUpdate.priority) return false;
    if (update.baseColor !== otherUpdate.baseColor) return false;
    
    if (!update.conditions && !otherUpdate.conditions) return true;
    if (!update.conditions || !otherUpdate.conditions) return false;
    
    return areConditionsEqual(update.conditions, otherUpdate.conditions);
  });
};

export const measurementsEqual = (prevMeasurements: Measurement[], nextMeasurements: Measurement[]): boolean => {
  if (prevMeasurements.length !== nextMeasurements.length) return false;

  return prevMeasurements.every((prev, index) => {
    const next = nextMeasurements[index];
    // First check lightweight fields
    if (prev.id !== next.id) return false;
    if (prev.userId !== next.userId) return false;
    if (prev.type !== next.type) return false;
    if (prev.name !== next.name) return false;
    if (prev.variant !== next.variant) return false;
    if (prev.unit !== next.unit) return false;
    if (prev.step !== next.step) return false;
    if (prev.initial !== next.initial) return false;
    if (prev.priority !== next.priority) return false;
    if (prev.archived !== next.archived) return false;
    if (prev.baseColor !== next.baseColor) return false;
    
    // Then check more complex fields
    if (prev.comboLeftId !== next.comboLeftId) return false;
    if (prev.comboRightId !== next.comboRightId) return false;
    if (prev.comboOperator !== next.comboOperator) return false;
    
    // Finally check recordings array
    return areRecordingsEqual(prev.recordings, next.recordings);
  });
};

export const habitsEqual = (prevHabits: Habit[], nextHabits: Habit[]): boolean => {
  if (prevHabits.length !== nextHabits.length) return false;

  return prevHabits.every((prev, index) => {
    const next = nextHabits[index];
    // Check basic fields first
    if (prev.id !== next.id) return false;
    if (prev.userId !== next.userId) return false;
    
    // Then check updates array
    return areUpdatesEqual(prev.updates, next.updates);
  });
};

export const computedHabitsEqual = (prev: ComputedHabit[], next: ComputedHabit[]): boolean => {
  if (prev.length !== next.length) return false;

  return prev.every((prevHabit, index) => {
    const nextHabit = next[index];
    // Check basic fields first
    if (prevHabit.id !== nextHabit.id) return false;
    if (prevHabit.userId !== nextHabit.userId) return false;
    if (prevHabit.name !== nextHabit.name) return false;
    if (prevHabit.isWeekly !== nextHabit.isWeekly) return false;
    if (prevHabit.daysPerWeek !== nextHabit.daysPerWeek) return false;
    if (prevHabit.points !== nextHabit.points) return false;
    if (prevHabit.archived !== nextHabit.archived) return false;
    if (prevHabit.predicate !== nextHabit.predicate) return false;
    if (prevHabit.priority !== nextHabit.priority) return false;
    if (prevHabit.baseColor !== nextHabit.baseColor) return false;
    
    // Then check conditions array
    if (!areConditionsEqual(prevHabit.conditions, nextHabit.conditions)) return false;
    
    // Finally check updates array
    return areUpdatesEqual(prevHabit.updates, nextHabit.updates);
  });
};