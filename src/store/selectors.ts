import { createSelector } from '@reduxjs/toolkit';
import { computedHabitsEqual, habitsEqual, measurementsEqual } from '@s/helpers';
import { computeHabit, type ComputedHabit, type Habit } from '@t/habits';
import { type Measurement } from '@t/measurements';
import type { AppState, AuthState, DataState, RootState } from '@t/redux';
import type { Account, AccountSettings, User } from '@t/users';
import type { BaseColor } from '@u/colors';
import { SimpleDate } from '@u/dates';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

const selectAppState = (state: RootState): AppState => state.app;
export const useAppState = () => useSelector(selectAppState);

const selectAuthState = (state: RootState): AuthState => state.auth;
export const useAuthState = () => useSelector(selectAuthState);

const selectDataState = (state: RootState): DataState => state.data;
export const useDataState = () => useSelector(selectDataState);
export const useDataLoaded = () => useSelector((state: RootState) => state.data.dataLoaded === 7);

// -----------------------------------------
// App selectors -------------------
export const useAuthAction = () => useSelector((state: RootState) => state.app.authAction);

// -----------------------------------------
// Auth selectors -------------------
export const selectUser = (state: RootState): User | null => state.auth.user;
export const useUser = () => useSelector(selectUser);

const selectAuthLoading = (state: RootState): boolean => state.auth.loading;
export const useAuthLoading = () => useSelector(selectAuthLoading);

const selectAuthError = (state: RootState): string | null => state.auth.error;
export const useAuthError = () => useSelector(selectAuthError);

export const selectIsAuthenticated = (state: RootState): boolean => 
  !!state.auth.user || state.auth.isGuest;
export const useIsAuthenticated = () => useSelector(selectIsAuthenticated);

export const selectIsGuest = (state: RootState): boolean => state.auth.isGuest;
export const useIsGuest = () => useSelector(selectIsGuest);

// -----------------------------------------
// Measurement selectors -------------------
const selectMeasurements = (state: RootState): Measurement[] => state.data.measurements;
export const useMeasurements = () => useSelector(selectMeasurements);

const selectMeasurementCount = createSelector(
  selectMeasurements,
  (measurements) => measurements.length
);
export const useMeasurementCount = () => useSelector(selectMeasurementCount);

const selectMeasurementById = (id: string): (state: RootState) => Measurement | undefined => 
  createSelector(
    selectMeasurements,
    (measurements) => measurements.find(m => m.id === id)
  );
export const useMeasurement = (id: string) => useSelector(selectMeasurementById(id));

const selectMeasurementsByIds = (ids: string[]): (state: RootState) => (Measurement | undefined)[] => 
  createSelector(
    selectMeasurements,
    (measurements) => ids.map((id) => measurements.find(m => m.id === id))
  );
export const useMeasurementsByIds = (ids: string[]) => useSelector(selectMeasurementsByIds(ids));

export const useMeasurementStatus = () => useSelector((state: RootState) => state.data.measurementStatus);

// -----------------------------------------
// Habit selectors -------------------
const selectHabits = (state: RootState): Habit[] => state.data.habits;
export const useHabits = () => useSelector(selectHabits);


const selectComputedHabits = (date: SimpleDate = SimpleDate.today()): (state: RootState) => ComputedHabit[] => createSelector(
  selectHabits,
  (habits) => {
    return habits
      .map((habit) => computeHabit(habit, date))
      .sort((a, b) => a.priority - b.priority);
  }
);

export const useComputedHabits = (date: SimpleDate = SimpleDate.today()) => {
  const selector = useMemo(
    () => selectComputedHabits(date),
    [date.toString()]
  );
  return useSelector(selector);
};

const selectHabitCount = createSelector(
  selectComputedHabits,
  (habits) => habits.length
);
export const useHabitCount = (): number => useSelector(selectHabitCount);

const selectHabitById = (id: string) => 
  createSelector(
    selectComputedHabits(),
    (habits) => habits.find(h => h.id === id)
  );
export const useHabit = (id: string) => useSelector(selectHabitById(id));
export const useHabitStatus = () => useSelector((state: RootState) => state.data.habitStatus);

const selectHabitsByMeasurement = (measurement: Measurement): (state: RootState) => ComputedHabit[] =>
  createSelector(
    selectComputedHabits(),
    (habits) => habits.filter(({ conditions }) => {
      return !!conditions.find(({ measurementId }) => measurementId === measurement.id);
    })
  );
export const useHabitsByMeasurement = (measurement: Measurement) => useSelector(selectHabitsByMeasurement(measurement));

// -----------------------------------------
// Account selectors -----------------------
export const useAccount = () => useSelector((state: RootState): Account => state.data.account);
export const useSettings = () => useSelector((state: RootState): AccountSettings => state.data.account.settings);

// -----------------------------------------
// Complex selectors -----------------------
const selectMeasurementUsage = createSelector(
  [selectMeasurements, selectHabits, selectComputedHabits()],
  (measurements, habits, computedHabits) => {
    const map: Map<string, { measurements: string[], habits: string[], pastHabits: string[], any: boolean }> = new Map();
    const blankUsage = () => ({ measurements: [], habits: [], pastHabits: [], any: false });
    
    measurements.forEach((measurement) => {
      const { comboLeftId, comboRightId, type, id } = measurement;
      if (type !== 'combo') return;

      if (comboLeftId) {
        const usage = map.get(comboLeftId) || blankUsage();
        usage.measurements.push(id);
        usage.any = true;
        map.set(comboLeftId, usage);
      }
      if (comboRightId) {
        const usage = map.get(comboRightId) || blankUsage();
        usage.measurements.push(id);
        usage.any = true;
        map.set(comboRightId, usage);
      }
    });
    
    computedHabits.forEach(({ id: habitId, conditions }) => {
      conditions.forEach(({ measurementId }) => {
        const usage = map.get(measurementId) || blankUsage();
        usage.habits.push(habitId);
        usage.any = true;
        map.set(measurementId, usage);
      })
    });
    
    habits.forEach(({ id: habitId, updates }) => {
      updates.forEach(({ conditions }) => {
        conditions?.forEach(({ measurementId }) => {
          const usage = map.get(measurementId) || blankUsage();
          if (usage.habits.indexOf(habitId) === -1) {
            usage.pastHabits.push(habitId);
            usage.any = true;
            map.set(measurementId, usage);
          }
        });
      });
    });
    return map;
  }
);

const selectCategories = createSelector(
  [selectMeasurements, selectComputedHabits()],
  (measurements, habits) => [...new Set(
    [
      ...measurements
        .filter(({ category }) => !!category)
        .map(({ category, baseColor }) => `${category}::::::${baseColor}`),
      ...habits
        .filter(({ category }) => !!category)
        .map(({ category, baseColor }) => `${category}::::::${baseColor}`),
    ]
  )].map((str) => str.split('::::::')).map(([category, baseColor]) => ({ category, baseColor: baseColor as BaseColor }))
);
export const useCategories = () => useSelector(selectCategories);

export const useMeasurementUsage = () => useSelector(selectMeasurementUsage);
