import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Habit } from '@t/habits';
import { createAppState, type AppState } from '@type/redux';

const initialState: AppState = createAppState();

const appStateSlice = createSlice({
  name: 'appState',
  initialState,
  reducers: {
    toggleDarkMode: (state: AppState) => {
      state.darkMode = !state.darkMode;
    },

    
    callCreateHabit: (_: AppState, __: PayloadAction<Habit>) => {},
    callCreateHabitStatus: (state: AppState, action: PayloadAction<string>) => {
      state.createHabitStatus = action.payload;
    },
    callUpdateHabit: (_: AppState, __: PayloadAction<Habit>) => {},
    callUpdateHabitStatus: (state: AppState, action: PayloadAction<string>) => {
      state.updateHabitStatus = action.payload;
    },
    callDeleteHabit: (_: AppState, __: PayloadAction<Habit>) => {},
    callDeleteHabitStatus: (state: AppState, action: PayloadAction<string>) => {
      state.deleteHabitStatus = action.payload;
    },
  },
});

export const {
  toggleDarkMode,

  callCreateHabit,
  callCreateHabitStatus,
  callUpdateHabit,
  callUpdateHabitStatus,
  callDeleteHabit,
  callDeleteHabitStatus,
} = appStateSlice.actions;
export default appStateSlice.reducer;