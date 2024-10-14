import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Habit } from '@t/habits';
import { createAppState, type AppState } from '@type/redux';

const initialState: AppState = {
  darkMode: false,
};

const appStateSlice = createSlice({
  name: 'appState',
  initialState,
  reducers: {
    toggleDarkMode: (state: AppState) => {
      state.darkMode = !state.darkMode;
    },
  },
});

export const {
  toggleDarkMode,
} = appStateSlice.actions;
export default appStateSlice.reducer;