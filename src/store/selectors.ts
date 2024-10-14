import { createSelector } from '@reduxjs/toolkit';
import { constructHabit, type Habit, type HabitUpdate } from '@t/habits';
import { type Measurement } from '@t/measurements';
import type { AppState, AuthState, DataState, RootState } from '@t/redux';
import type { User } from '@t/users';
import { SimpleDate } from '@u/dates';
import { useSelector } from 'react-redux';

const selectAppState = (state: RootState): AppState => state.app;
export const useAppState = () => useSelector(selectAppState);

const selectDarkMode = (state: RootState): boolean => state.app.darkMode;
export const useDarkMode = () => useSelector(selectDarkMode);

const selectAuthState = (state: RootState): AuthState => state.auth;
export const useAuthState = () => useSelector(selectAuthState);

const selectDataState = (state: RootState): DataState => state.data;
export const useDataState = () => useSelector(selectDataState);

// -----------------------------------------
// Auth selectors -------------------
export const selectUser = (state: RootState): User | null => state.auth.user;
export const useUser = () => useSelector(selectUser);

const selectAuthLoading = (state: RootState): boolean => state.auth.loading;
export const useAuthLoading = () => useSelector(selectAuthLoading);

const selectAuthError = (state: RootState): string | null => state.auth.error;
export const useAuthError = () => useSelector(selectAuthError);

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

// -----------------------------------------
// Habit selectors -------------------
const selectHabitUpdates = (state: RootState): HabitUpdate[] => state.data.habitUpdates;
export const useHabitUpdates = () => useSelector(selectHabitUpdates);


const selectHabits = (date: SimpleDate = SimpleDate.today()): (state: RootState) => Habit[] => createSelector(
  selectHabitUpdates,
  (habitUpdates) => {
    const habitUpdatesMap = new Map<string, HabitUpdate[]>();
    habitUpdates
      .filter(( update ) => update.date.toString() <= date.toString())
      .forEach((update) => {
        const habitUpdateList = habitUpdatesMap.get(update.habitId) || [];
        habitUpdateList.push(update);
        habitUpdatesMap.set(update.habitId, habitUpdateList);
      });

    return Array.from(habitUpdatesMap.values())
      .map(constructHabit)
      .sort((a, b) => a.priority - b.priority);
  }
);

export const useHabits = (date: SimpleDate = SimpleDate.today()) => useSelector(selectHabits(date));

const selectHabitCount = createSelector(
  selectHabits,
  (habits) => habits.length
);
export const useHabitCount = (): number => useSelector(selectHabitCount);

const selectHabitById = (id: string) => 
  createSelector(
    selectHabits(),
    (habits) => habits.find(h => h.habitId === id)
  );
export const useHabit = (id: string) => useSelector(selectHabitById(id));

const selectHabitsByMeasurement = (measurement: Measurement): (state: RootState) => Habit[] =>
  createSelector(
    selectHabits(),
    (habits) => habits.filter(({ conditions }) => {
      return !!conditions.find(({ measurementId }) => measurementId === measurement.id);
    })
  );
export const useHabitsByMeasurement = (measurement: Measurement) => useSelector(selectHabitsByMeasurement(measurement));

// -----------------------------------------
// Complex selectors -----------------------
const selectMeasurementUsage = createSelector(
  [selectMeasurements, selectHabitUpdates, selectHabits()],
  (measurements, habitUpdates, habits) => {
    const map: Map<string, { measurements: string[], habits: string[], pastHabits: string[] }> = new Map();
    const blankUsage = () => ({ measurements: [], habits: [], pastHabits: [] });
    
    measurements.forEach((measurement) => {
      const { comboLeftId, comboRightId, type, id } = measurement;
      if (type !== 'combo') return;

      if (comboLeftId) {
        const usage = map.get(comboLeftId) || blankUsage();
        usage.measurements.push(id);
        map.set(comboLeftId, usage);
      }
      if (comboRightId) {
        const usage = map.get(comboRightId) || blankUsage();
        usage.measurements.push(id);
        map.set(comboRightId, usage);
      }
    });

    habits.forEach(({ habitId, conditions }) => {
      conditions.forEach(({ measurementId }) => {
        const usage = map.get(measurementId) || blankUsage();
        usage.habits.push(habitId);
        map.set(measurementId, usage);
      })
    });

    habitUpdates.forEach(({ habitId, conditions }) => {
      conditions?.forEach(({ measurementId }) => {
        const usage = map.get(measurementId) || blankUsage();
        if (usage.habits.indexOf(habitId) === -1) {
          usage.pastHabits.push(habitId);
          map.set(measurementId, usage);
        }
      })
    });
    return map;
  }
);

export const useMeasurementUsage = () => useSelector(selectMeasurementUsage);