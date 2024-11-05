import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@t/users';
import { type AuthState } from '@type/redux';

export interface AuthCredentials {
  email: string;
  password?: string;
  code?: string,
}

export type AuthAction = 'login' | 'signup' | 'reset' | 'signout';

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  info: null,
  action: null,
  initialAuthCheckComplete: false,
};

const authSlice = createSlice({
  name: 'authSlice',
  initialState,
  reducers: {
    initialAuthCheckComplete: (state) => {
      state.initialAuthCheckComplete = true;
    },
    signUpRequest: (state, _: PayloadAction<AuthCredentials>) => {
      state.action = 'signup';
      state.loading = true;
      state.error = null;
      state.info = null;
    },
    signUpSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
      state.info = null;
    },
    signUpFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.info = null;
    },
    signInRequest: (state, _: PayloadAction<AuthCredentials>) => {
      state.action = 'login';
      state.loading = true;
      state.error = null;
      state.info = null;
    },
    signInSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
      state.info = null;
    },
    signInFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.info = null;
    },
    signOutRequest: (state) => {
      state.action = 'signout';
      state.loading = true;
      state.error = null;
      state.info = null;
    },
    signOutSuccess: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
      state.info = null;
    },
    signOutFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.info = null;
    },
    resetRequest: (state, _: PayloadAction<AuthCredentials>) => {
      state.action = 'reset';
      state.loading = true;
      state.error = null;
      state.info = null;
    },
    resetSuccess: (state) => {
      state.loading = false;
      state.error = null;
      state.info = 'Email successfully sent. Return here to sign in with your new password after completing the reset process.';
    },
    resetFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.info = null;
    },
    // resetConfirmationRequest: (state, _: PayloadAction<AuthCredentials>) => {
    //   state.loading = true;
    //   state.error = null;
    //   state.info = null;
    // },
    // resetConfirmationSuccess: (state) => {
    //   state.loading = false;
    //   state.error = null;
    //   state.info = null;
    // },
    // resetConfirmationFailure: (state, action: PayloadAction<string>) => {
    //   state.loading = false;
    //   state.error = action.payload;
    // },
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

  resetRequest,
  resetSuccess,
  resetFailure,

  // resetConfirmationRequest,
  // resetConfirmationSuccess,
  // resetConfirmationFailure,
} = authSlice.actions;

export default authSlice.reducer;