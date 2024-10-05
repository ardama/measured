import { createSelector } from '@reduxjs/toolkit';
import { constructHabit, type Habit, type HabitUpdate } from '@t/habits';
import { measurementTypes, type Measurement, type MeasurementType, type MeasurementUnit } from '@t/measurements';
import type { Recording } from '@t/recording';
import type { AppState, RootState } from '@t/redux';
import type { User } from '@t/users';
import { SimpleDate } from '@u/dates';
import { useSelector } from 'react-redux';

const selectAppState = (state: RootState): AppState => state.app;
export const useAppState = () => useSelector(selectAppState);

const selectDarkMode = (state: RootState): boolean => state.app.darkMode;
export const useDarkMode = () => useSelector(selectDarkMode);

const selectUser = (state: RootState): User => state.user;
export const useUser = () => useSelector(selectUser);

// -----------------------------------------
// Measurement selectors -------------------
const selectMeasurements = (state: RootState): Measurement[] => state.user.measurements.toSorted((a, b) => a.priority - b.priority);
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

const selectMeasurementsByMeasurements = (): (state: RootState) => Map<string, Measurement[]> =>
  createSelector(
    selectMeasurements,
    (measurements) => {
      const map = new Map();
      measurements.forEach((measurement) => {
        const { comboLeftId, comboRightId, type } = measurement;
        if (type !== 'combo') return;

        if (comboLeftId) {
          const measurementMeasurements = map.get(comboLeftId) || [];
          measurementMeasurements.push(measurement);
          map.set(comboLeftId, measurementMeasurements);
        }
        if (comboRightId) {
          const measurementMeasurements = map.get(comboRightId) || [];
          measurementMeasurements.push(measurement);
          map.set(comboRightId, measurementMeasurements);
        }
      });
      return map;
    }
  );
export const useMeasurementsByMeasurements = () => useSelector(selectMeasurementsByMeasurements());


// -----------------------------------------
// Recording selectors -------------------
const selectRecordings = (state: RootState): Recording[] => state.user.recordings;
export const useRecordings = () => useSelector(selectRecordings);

// -----------------------------------------
// Habit selectors -------------------
const selectHabitUpdates = (state: RootState): HabitUpdate[] => state.user.habitUpdates;
export const useHabitUpdates = () => useSelector(selectHabitUpdates);

const selectHabits = (date: SimpleDate = SimpleDate.today()): (state: RootState) => Habit[] => createSelector(
  selectHabitUpdates,
  (habitUpdates) => {
    const habitUpdatesMap = new Map<string, HabitUpdate[]>();
    habitUpdates.filter(( update ) => update.date.toString() <= date.toString()).forEach((update) => {
      const habitUpdateList = habitUpdatesMap.get(update.habitId) || [];
      habitUpdateList.push(update);
      habitUpdatesMap.set(update.habitId, habitUpdateList);
    });

    const habits: Habit[] = [];
    habitUpdatesMap.forEach((updates) => {
      habits.push(constructHabit(updates));
    });

    return habits.toSorted((a, b) => a.priority - b.priority);
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

const selectHabitsByMeasurements = (): (state: RootState) => Map<string, Habit[]> =>
  createSelector(
    selectHabits(),
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
export const useHabitsByMeasurements = () => useSelector(selectHabitsByMeasurements());


// -----------------------------------------
// Measurement Unit selectors -------------------
// const selectMeasurementsByMeasurementUnit = (measurementUnit: MeasurementUnit): (state: RootState) => Measurement[] =>
//   createSelector(
//     selectMeasurements,
//     (measurements) => measurements.filter(({ unit }) => measurementUnit.abbreviation === unit)
//   );
// export const useMeasurementsByMeasurementUnit = (measurementUnit: MeasurementUnit): Measurement[] => useSelector(selectMeasurementsByMeasurementUnit(measurementUnit));

// const selectMeasurementUnits = (state: RootState): MeasurementUnit[] => state.user.measurementUnits;
// export const useMeasurementUnits = (): MeasurementUnit[] => useSelector(selectMeasurementUnits);

// const selectMeasurementUnitsByMeasurementType = (type: MeasurementType): (state: RootState) => MeasurementUnit[] | undefined =>
//   createSelector(
//     selectMeasurementUnits,
//     (units) => units.filter(({ types }) => types.includes(type))
//   );
// export const useMeasurementUnitsByMeasurementType = (type: MeasurementType) : MeasurementUnit[] | undefined => useSelector(selectMeasurementUnitsByMeasurementType(type));

// const selectAllMeasurementUnitsByMeasurementType = (): (state: RootState) => Map<MeasurementType, MeasurementUnit[]> => 
//   createSelector(
//     selectMeasurementUnits,
//     (units) => {
//       const map: Map<MeasurementType, MeasurementUnit[]> = new Map();
//       measurementTypes.forEach((type) => {
//         map.set(type, units.filter(({ types }) => types.includes(type)));
//       })

//       return map;
//     }
//   );
// export const useAllMeasurementUnitsByMeasurementType = () : Map<MeasurementType, MeasurementUnit[]> => useSelector(selectAllMeasurementUnitsByMeasurementType());
