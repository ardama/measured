import { createSelector } from '@reduxjs/toolkit';
import type { Habit } from '@t/habits';
import { measurementTypeData, type Measurement, type MeasurementType, type MeasurementUnit } from '@t/measurements';
import type { Recording } from '@t/recording';
import type { AppState, RootState } from '@t/redux';
import type { User } from '@t/users';
import { useSelector } from 'react-redux';

const selectAppState = (state: RootState): AppState => state.app;
export const useAppState = (): AppState => useSelector(selectAppState);

const selectDarkMode = (state: RootState): boolean => state.app.darkMode;
export const useDarkMode = (): boolean => useSelector(selectDarkMode);

const selectUser = (state: RootState): User => state.user;
export const useUser = (): User => useSelector(selectUser);

const selectMeasurements = (state: RootState): Measurement[] => state.user.measurements;
export const useMeasurements = (): Measurement[] => useSelector(selectMeasurements);

const selectMeasurementCount = createSelector(
  selectMeasurements,
  (measurements) => measurements.length
);
export const useMeasurementCount = (): number => useSelector(selectMeasurementCount);

const selectMeasurementById = (id: string): (state: RootState) => Measurement | undefined => 
  createSelector(
    selectMeasurements,
    (measurements) => measurements.find(m => m.id === id)
  );
export const useMeasurement = (id: string): Measurement | undefined => useSelector(selectMeasurementById(id));

const selectMeasurementsByIds = (ids: string[]): (state: RootState) => (Measurement | undefined)[] => 
  createSelector(
    selectMeasurements,
    (measurements) => ids.map((id) => measurements.find(m => m.id === id))
  );
export const useMeasurementsByIds = (ids: string[]): (Measurement | undefined)[] => useSelector(selectMeasurementsByIds(ids));

const selectMeasurementsByMeasurementUnit = (measurementUnit: MeasurementUnit): (state: RootState) => Measurement[] =>
  createSelector(
    selectMeasurements,
    (measurements) => measurements.filter(({ unit }) => measurementUnit.abbreviation === unit)
  );
export const useMeasurementsByMeasurementUnit = (measurementUnit: MeasurementUnit): Measurement[] => useSelector(selectMeasurementsByMeasurementUnit(measurementUnit));

const selectMeasurementUnits = (state: RootState): MeasurementUnit[] => state.user.measurementUnits;
export const useMeasurementUnits = (): MeasurementUnit[] => useSelector(selectMeasurementUnits);

const selectMeasurementUnitsByMeasurementType = (type: MeasurementType): (state: RootState) => MeasurementUnit[] | undefined =>
  createSelector(
    selectMeasurementUnits,
    (units) => units.filter(({ types }) => types.includes(type))
  );
export const useMeasurementUnitsByMeasurementType = (type: MeasurementType) : MeasurementUnit[] | undefined => useSelector(selectMeasurementUnitsByMeasurementType(type));

const selectAllMeasurementUnitsByMeasurementType = (): (state: RootState) => Map<MeasurementType, MeasurementUnit[]> => 
  createSelector(
    selectMeasurementUnits,
    (units) => {
      const map: Map<MeasurementType, MeasurementUnit[]> = new Map();
      measurementTypeData.forEach(({ type }) => {
        map.set(type, units.filter(({ types }) => types.includes(type)));
      })

      return map;
    }
  );
export const useAllMeasurementUnitsByMeasurementType = () : Map<MeasurementType, MeasurementUnit[]> => useSelector(selectAllMeasurementUnitsByMeasurementType());

const selectRecordings = (state: RootState): Recording[] => state.user.recordings;
export const useRecordings = (): Recording[] => useSelector(selectRecordings);

const selectHabits = (state: RootState): Habit[] => state.user.habits;
export const useHabits = (): Habit[] => useSelector(selectHabits);

const selectHabitCount = createSelector(
  selectHabits,
  (habits) => habits.length
);
export const useHabitCount = (): number => useSelector(selectHabitCount);

const selectHabitById = (id: string): (state: RootState) => Habit | undefined => 
  createSelector(
    selectHabits,
    (habits) => habits.find(h => h.id === id)
  );
export const useHabit = (id: string): Habit | undefined => useSelector(selectHabitById(id));

const selectHabitsByMeasurement = (measurement: Measurement): (state: RootState) => Habit[] =>
  createSelector(
    selectHabits,
    (habits) => habits.filter(({ conditions }) => {
      return !!conditions.find(({ measurementId }) => measurementId === measurement.id);
    })
  );
export const useHabitsByMeasurement = (measurement: Measurement): Habit[] => useSelector(selectHabitsByMeasurement(measurement));

const selectHabitsByMeasurements = (): (state: RootState) => Map<string, Habit[]> =>
  createSelector(
    selectHabits,
    (habits) => {
      const map = new Map();
      habits.forEach((habit) => {
        habit.conditions.forEach((condition) => {
          const measurementHabits = map.get(condition.measurementId) || [];
          measurementHabits.push(habit);
          map.set(condition.measurementId, measurementHabits);
        })
      });
      return map;
    }
  );
export const useHabitsByMeasurements = (): Map<string, Habit[]> => useSelector(selectHabitsByMeasurements());
