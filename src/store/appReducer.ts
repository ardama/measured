import { createSlice } from '@reduxjs/toolkit';

const initialState = {
};

const appStateSlice = createSlice({
  name: 'appState',
  initialState,
  reducers: {
  },
});

export const {
} = appStateSlice.actions;
export default appStateSlice.reducer;