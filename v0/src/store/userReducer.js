/** @typedef {import('@type/redux').UserState} UserState */
/** @typedef {import('@type/users').User} User */
/** @typedef {import('@type/measurements').Measurement} Measurement */
/** @typedef {import('@type/habits').Habit} Habit */

/**
 * @template T
 * @typedef {import('@reduxjs/toolkit').PayloadAction<T>} PayloadAction
 */

import { createSlice } from '@reduxjs/toolkit'
import { createUserState } from '@type/redux';

/** @type {UserState} */
const initialState = createUserState();

const userStateSlice = createSlice({
  name: 'userState',
  initialState,
  reducers: {
    /**
     * @param {UserState} state 
     * @param {PayloadAction<string>} action 
     */
    editName: (state, action) => {
      state.name = action.payload;
    },

    /**
     * @param {UserState} state 
     * @param {PayloadAction<string>} action 
     */
    editEmail: (state, action) => {
      state.email = action.payload;
    },

    /**
     * @param {UserState} state
     * @param {PayloadAction<Measurement>} action
     */
    addMeasurement: (state, action) => {
      state.measurements.push(action.payload);
    },

    /**
     * @param {UserState} state
     * @param {PayloadAction<string>} action
     */
    removeMeasurement: (state, action) => {
      state.measurements = state.measurements.filter(
        /** @type {function(Measurement): boolean} */
        m => m.id !== action.payload
      );
    },

    /**
     * @param {UserState} state
     * @param {PayloadAction<{
     *  id: string,
     *  updates: Partial<Measurement>
     * }>} action
     */
    editMeasurement: (state, action) => {
      const index = state.measurements.findIndex(
        /** @type {function(Measurement): boolean} */
        m => m.id === action.payload.id
      );
      if (index !== -1) {
        state.measurements[index] = { ...state.measurements[index], ...action.payload.updates };
      }
    },

    /**
     * @param {UserState} state
     * @param {PayloadAction<Habit>} action
     */
    addHabit: (state, action) => {
      state.habits.push(action.payload);
    },
  
    /**
     * @param {UserState} state
     * @param {PayloadAction<string>} action
     */
    removeHabit: (state, action) => {
      state.habits = state.habits.filter(
        /** @type {function(Habit): boolean} */
        h => h.id !== action.payload
      );
    },
  
    /**
     * @param {UserState} state
     * @param {PayloadAction<{
     *  id: string,
     *  updates: Partial<Habit>
     * }>} action
     */
    editHabit: (state, action) => {
      const index = state.habits.findIndex(
        /** @type {function(Habit): boolean} */
        h => h.id === action.payload.id
      );
      if (index !== -1) {
        state.habits[index] = { ...state.habits[index], ...action.payload.updates };
      }
    },

    /**
     * @param {UserState} state
    */
   fetchUserStart: (state) => {
     state.loading = true;
     state.error = null;
    },
    
    /**
     * @param {UserState} state
     * @param {PayloadAction<User>} action
    */
   fetchUserSuccess: (state, action) => {
     return { ...state, ...action.payload, loading: false, error: null };
    },
    
    /**
     * @param {UserState} state
     * @param {PayloadAction<string>} action
    */
   fetchUserFailure: (state, action) => {
     state.loading = false;
     state.error = action.payload;
    },
    
    /**
     * @param {UserState} state
    */
   updateUserStart: (state) => {
     state.updating = true;
     state.error = null;
    },
    
    /**
     * @param {UserState} state
     * @param {PayloadAction<User>} action
    */
   updateUserSuccess: (state, action) => {
     return { ...state, ...action.payload, updating: false, error: null };
    },
    
    /**
     * @param {UserState} state
     * @param {PayloadAction<string>} action
     */
    updateUserFailure: (state, action) => {
      state.updating = false;
      state.error = action.payload;
    },
  },
});

export const {
  editName,
  editEmail,

  addMeasurement,
  removeMeasurement,
  editMeasurement,

  addHabit,
  removeHabit,
  editHabit,

  fetchUserStart,
  fetchUserSuccess,
  fetchUserFailure,

  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
} = userStateSlice.actions;
export default userStateSlice.reducer;