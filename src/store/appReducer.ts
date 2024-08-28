import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createAppState, type AppState } from '@type/redux';

const initialState: AppState = createAppState();

const appStateSlice = createSlice({
  name: 'appState',
  initialState,
  reducers: {
    /**
     * @param {AppState} state 
     * @param {PayloadAction<number>} action 
     */
    changeActiveTab: (state: AppState, action: PayloadAction<number>) => {
      state.activeTab = action.payload;
    },
  },
});

export const {
  changeActiveTab,
} = appStateSlice.actions;
export default appStateSlice.reducer;