import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@t/users';
import { type AuthState } from '@type/redux';

export interface AuthCredentials {
  email: string;
  password: string;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
  firstLoadComplete: false,
};

const authSlice = createSlice({
  name: 'authSlice',
  initialState,
  reducers: {
    initialAuthCheckComplete: (state) => {
      state.firstLoadComplete = true;
    },
    signUpRequest: (state, _: PayloadAction<AuthCredentials>) => {
      state.loading = true;
      state.error = null;
    },
    signUpSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    signUpFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    signInRequest: (state, _: PayloadAction<AuthCredentials>) => {
      state.loading = true;
      state.error = null;
    },
    signInSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    signInFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    signOutRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    signOutSuccess: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
    },
    signOutFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  initialAuthCheckComplete,

  signUpRequest,
  signUpSuccess,
  signUpFailure,

  signInRequest,
  signInSuccess,
  signInFailure,
  
  signOutRequest,
  signOutSuccess,
  signOutFailure,
} = authSlice.actions;

export default authSlice.reducer;