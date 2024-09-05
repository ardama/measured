import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createAppState, type AppState } from '@type/redux';

const initialState: AppState = createAppState();

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