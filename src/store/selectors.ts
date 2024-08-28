import { createSelector } from '@reduxjs/toolkit';
import type { Habit } from '@t/habits';
import type { Measurement } from '@t/measurements';
import type { AppState, RootState } from '@t/redux';
import type { User } from '@t/users';
import { useSelector } from 'react-redux';

const selectAppState = (state: RootState): AppState => state.app;
export const useAppState = (): AppState => useSelector(selectAppState);

const selectActiveTab = (state: RootState): number => state.app.activeTab;
export const useActiveTab = (): number => useSelector(selectActiveTab);

const selectUser = (state: RootState): User => state.user;
export const useUser = (): User => useSelector(selectUser);

const selectMeasurements = (state: RootState): Measurement[] => state.user.measurements;
export const useMeasurements = (): Measurement[] => useSelector(selectMeasurements);

const selectHabits = (state: RootState): Habit[] => state.user.habits;
export const useHabits = (): Habit[] => useSelector(selectHabits);

const selectMeasurementById = (id: string): (state: RootState) => Measurement | undefined => 
  createSelector(
    selectMeasurements,
    (measurements) => measurements.find(m => m.id === id)
  );
export const useMeasurement = (id: string): Measurement | undefined => useSelector(selectMeasurementById(id));

const selectHabitById = (id: string): (state: RootState) => Habit | undefined => 
  createSelector(
    selectHabits,
    (habits) => habits.find(h => h.id === id)
  );
export const useHabit = (id: string): Habit | undefined => useSelector(selectHabitById(id));

const selectMeasurementCount = createSelector(
  selectMeasurements,
  (measurements) => measurements.length
);
export const useMeasurementCount = (): number => useSelector(selectMeasurementCount);

const selectHabitCount = createSelector(
  selectHabits,
  (habits) => habits.length
);
export const useHabitCount = (): number => useSelector(selectHabitCount);
