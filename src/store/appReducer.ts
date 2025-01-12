import { createSlice } from '@reduxjs/toolkit';
import type { AuthAction } from '@s/authReducer';
import type { AppState } from '@t/redux';

const initialState: AppState = {
  authAction: 'login',
};

const appStateSlice = createSlice({
  name: 'appSlice',
  initialState,
  reducers: {
    setAuthAction: (state, action) => {
      state.authAction = action.payload;
    },
  },
});

export const {
  setAuthAction,
} = appStateSlice.actions;
export default appStateSlice.reducer;