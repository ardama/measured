import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Habit } from '@t/habits';
import type { Measurement } from '@t/measurements';
import type { User } from '@t/users';
import { createUserState, type UserState } from '@type/redux';

const initialState: UserState = createUserState();

const userStateSlice = createSlice({
  name: 'userState',
  initialState,
  reducers: {
    editName: (state: UserState, action: PayloadAction<string>) => {
      state.name = action.payload;
    },

    editEmail: (state: UserState, action: PayloadAction<string>) => {
      state.email = action.payload;
    },

    addMeasurement: (state: UserState, action: PayloadAction<Measurement>) => {
      state.measurements.push(action.payload);
    },

    removeMeasurement: (state: UserState, action: PayloadAction<string>) => {
      state.measurements = state.measurements.filter(
        (m): boolean => m.id !== action.payload
      );
    },

    editMeasurement: (state: UserState, action: PayloadAction<{
        id: string;
        updates: Partial<Measurement>;
      }>) => {
      const index = state.measurements.findIndex(
        (m): boolean => m.id === action.payload.id
      );
      if (index !== -1) {
        state.measurements[index] = { ...state.measurements[index], ...action.payload.updates };
      }
    },

    addHabit: (state: UserState, action: PayloadAction<Habit>) => {
      state.habits.push(action.payload);
    },
  

    removeHabit: (state: UserState, action: PayloadAction<string>) => {
      state.habits = state.habits.filter(
        (h): boolean => h.id !== action.payload
      );
    },
  
    editHabit: (state: UserState, action: PayloadAction<{id: string, updates: Partial<Habit>}>) => {
      const index = state.habits.findIndex(
        (h): boolean => h.id === action.payload.id
      );
      if (index !== -1) {
        state.habits[index] = { ...state.habits[index], ...action.payload.updates };
      }
    },

   fetchUserStart: (state: UserState) => {
     state.loading = true;
     state.error = null;
    },
    
   fetchUserSuccess: (state: UserState, action: PayloadAction<User>) => {
     return { ...state, ...action.payload, loading: false, error: null };
    },

   fetchUserFailure: (state: UserState, action: PayloadAction<string>) => {
     state.loading = false;
     state.error = action.payload;
    },

   updateUserStart: (state: UserState) => {
     state.updating = true;
     state.error = null;
    },

   updateUserSuccess: (state: UserState, action: PayloadAction<User>) => {
     return { ...state, ...action.payload, updating: false, error: null };
    },

    updateUserFailure: (state: UserState, action: PayloadAction<string>) => {
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