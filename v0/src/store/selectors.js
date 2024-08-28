/** @typedef {import('@type/redux').RootState} RootState */
/** @typedef {import('@type/redux').AppState} AppState */

/** @typedef {import('@type/users').User} User */
/** @typedef {import('@type/measurements').Measurement} Measurement */
/** @typedef {import('@type/habits').Habit} Habit */


import { createSelector } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';

/**
 * @param {RootState} state
 * @returns {AppState}
 */
const selectAppState = (state) => state.app;

/**
 * @returns {AppState}
 */
export const useAppState = () => useSelector(selectAppState);

/**
 * @param {RootState} state
 * @returns {number}
 */
const selectActiveTab = (state) => state.app.activeTab;

/**
 * @returns {number}
 */
export const useActiveTab = () => useSelector(selectActiveTab);



/**
 * @param {RootState} state
 * @returns {User}
 */
const selectUser = (state) => state.user;

/**
 * @returns {User}
 */
export const useUser = () => useSelector(selectUser);

/**
 * @param {RootState} state
 * @returns {Measurement[]}
 */
const selectMeasurements = (state) => state.user.measurements;

/**
 * @returns {Measurement[]}
 */
export const useMeasurements = () => useSelector(selectMeasurements);

/**
 * @param {RootState} state
 * @returns {Habit[]}
 */
const selectHabits = (state) => state.user.habits;

/**
 * @returns {Habit[]}
 */
export const useHabits = () => useSelector(selectHabits);

/**
 * @param {string} id
 * @returns {(state: RootState) => Measurement | undefined}
 */
const selectMeasurementById = (id) => 
  createSelector(
    selectMeasurements,
    (measurements) => measurements.find(m => m.id === id)
  );

/**
 * @param {string} id 
 * @returns {Measurement | undefined}
 */
export const useMeasurement = (id) => useSelector(selectMeasurementById(id));

/**
 * @param {string} id
 * @returns {(state: RootState) => Habit | undefined}
*/
const selectHabitById = (id) => 
  createSelector(
    selectHabits,
    (habits) => habits.find(h => h.id === id)
  );

/**
 * @param {string} id 
 * @returns {Habit | undefined}
 */
export const useHabit = (id) => useSelector(selectHabitById(id));

/**
 * @param {RootState} state
 * @returns {number}
 */
const selectMeasurementCount = createSelector(
  selectMeasurements,
  (measurements) => measurements.length
);

/**
 * @returns {number}
 */
export const useMeasurementCount = () => useSelector(selectMeasurementCount);

/**
 * @param {RootState} state
 * @returns {number}
*/
const selectHabitCount = createSelector(
  selectHabits,
  (habits) => habits.length
);

/**
 * @returns {number}
 */
export const useHabitCount = () => useSelector(selectHabitCount);
