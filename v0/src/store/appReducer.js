/** @typedef {import('@type/redux').AppState} AppState */

/**
 * @template T
 * @typedef {import('@reduxjs/toolkit').PayloadAction<T>} PayloadAction
 */

import { createSlice } from '@reduxjs/toolkit';
import { createAppState } from '@type/redux';

/** @type {AppState} */
const initialState = createAppState();

const appStateSlice = createSlice({
  name: 'appState',
  initialState,
  reducers: {
    /**
     * @param {AppState} state 
     * @param {PayloadAction<number>} action 
     */
    changeActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
  },
});

export const {
  changeActiveTab,
} = appStateSlice.actions;
export default appStateSlice.reducer;