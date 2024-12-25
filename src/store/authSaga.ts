import { all, call, delay, put, race, select, take, takeLatest } from 'redux-saga/effects';
import { signInRequest, signInSuccess, signInFailure, signOutRequest, signOutSuccess, signOutFailure, signUpSuccess, signUpFailure, signUpRequest, type AuthCredentials, initialAuthCheckComplete, resetRequest, resetSuccess, resetFailure, guestSignInRequest, guestSignInSuccess, guestSignInFailure } from '@s/authReducer';
import { confirmPasswordReset, createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, type User, type UserCredential } from 'firebase/auth';
import type { PayloadAction } from '@reduxjs/toolkit';
import { auth } from '@/firebase';
import { serializeUser, type Account } from '@t/users';
import { eventChannel, type EventChannel } from 'redux-saga';
import { resetData, callUpdateAccount, setAccount, setMeasurements, setHabits } from '@s/dataReducer';
import type { RootState } from '@t/redux';
import { FirebaseError } from 'firebase/app';
import { storageService } from '@s/storage';

function* loadGuestData(): Generator<any, void, any> {
  const [measurements, habits, account] = yield all([
    call([storageService, storageService.getMeasurements]),
    call([storageService, storageService.getHabits]),
    call([storageService, storageService.getAccount]),
  ]);
  yield all([
    put(setMeasurements(measurements)),
    put(setHabits(habits)),
    put(setAccount(account ? [account] : [])),
  ]);
}

function* guestSignInRequestSaga() {
  try {
    yield put(resetData());
    
    // Set active user ID to guest
    yield call([storageService, storageService.setActiveUserId], 'guest');
    yield call(loadGuestData);
    
    yield put(guestSignInSuccess());
  } catch (error) {
    if (error instanceof Error) {
      yield put(guestSignInFailure(error.message));
    } else {
      yield put(guestSignInFailure('An unknown error occurred while signing in as guest'));
    }
  }
}

function* signUpSaga(action: PayloadAction<AuthCredentials>) {
  const { email, password } = action.payload;
  if (!email || !password) return;
  try {
    yield put(resetData());
    const result: UserCredential = yield call(createUserWithEmailAndPassword, auth, email.trim(), password.trim());
    
    yield call([storageService, storageService.setActiveUserId], result.user.uid);
    yield put(signUpSuccess(serializeUser(result.user)));
    
    const account: Account = yield select((state: RootState): Account => state.data.account);
    yield put(callUpdateAccount(account));
  } catch (error) {
    if (error instanceof FirebaseError) {
      yield put(signUpFailure(error.code));
    } else if (error instanceof Error) {
      yield put(signUpFailure(error.message));
    } else {
      yield put(signUpFailure('An unknown error occurred while signing up'));
    }
  }
}

function* signInSaga(action: PayloadAction<AuthCredentials>) {
  const { email, password } = action.payload;
  if (!email || !password) return;

  try {
    yield put(resetData());
    const result: UserCredential = yield call(signInWithEmailAndPassword, auth, email.trim(), password.trim());

    yield call([storageService, storageService.setActiveUserId], result.user.uid);

    yield put(signInSuccess(serializeUser(result.user)));
  } catch (error) {
    if (error instanceof FirebaseError) {
      yield put(signInFailure(error.code));
    } else if (error instanceof Error) {
      yield put(signInFailure(error.message));
    } else {
      yield put(signInFailure('An unknown error occurred while signing in'));
    }
  }
}

function* signOutSaga() {
  try {
    const storedUserId: string | null = yield call([storageService, storageService.getActiveUserId]);

    if (storedUserId !== 'guest') {
      yield call(signOut, auth);
    }
    yield call([storageService, storageService.setActiveUserId], null);
    
    yield put(resetData());
    yield put(signOutSuccess());
  } catch (error) {
    if (error instanceof FirebaseError) {
      yield put(signOutFailure(error.code));
    } else if (error instanceof Error) {
      yield put(signOutFailure(error.message));
    } else {
      yield put(signOutFailure('An unknown error occurred while signing out'));
    }
  }
}

function* resetSaga(action: PayloadAction<AuthCredentials>) {
  const { email } = action.payload;
  if (!email) return;

  try {
    yield call(sendPasswordResetEmail, auth, email.trim());
    yield put(resetSuccess());
  } catch (error) {
    if (error instanceof FirebaseError) {
      yield put(resetFailure(error.code));
    } else if (error instanceof Error) {
      yield put(resetFailure(error.message));
    } else {
      yield put(resetFailure('An unknown error occurred while sending password reset email'));
    }
  }
}

// function* resetConfirmationSaga(action: PayloadAction<AuthCredentials>) {
//   const { code, password } = action.payload;
//   if (!code || !password) return;

//   try {
//     yield call(confirmPasswordReset, auth, code, password.trim());
//     yield put(resetConfirmationSuccess());
//   } catch (error) {
//     if (error instanceof FirebaseError) {
//       yield put(resetConfirmationFailure(error.code));
//     } else if (error instanceof Error) {
//       yield put(resetConfirmationFailure(error.message));
//     } else {
//       yield put(resetConfirmationFailure('An unknown error occurred while resetting password'));
//     }
//   }
// }

export function createAuthChannel(): EventChannel<{ user?: User | null, error?: Error | null}> {
  return eventChannel(emit => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      emit({ user });
    }, error => {
      emit({ error });
    })

    return unsubscribe;
  });
}

function* initialAuthCheckSaga() {
  const storedUserId: string | null = yield call([storageService, storageService.getActiveUserId]);

  // Load guest data if stored user ID is guest
  if (storedUserId === 'guest') {
    yield call(loadGuestData);
    yield put(guestSignInSuccess());
    return;
  }

  const authChannel: EventChannel<{ user?: User | null, error?: Error | null}> = yield call(createAuthChannel);
  try {
    const { authState } = yield race({
      authState: take(authChannel),
      timeout: delay(2000),
    });


    if (authState?.user) {
      // Store the user ID if not already stored
      if (storedUserId !== authState.user.uid) {
        yield call([storageService, storageService.setActiveUserId], authState.user.uid);
      }
      yield put(signInSuccess(serializeUser(authState.user)));
      return;
    }

    if (authState?.error) console.error(authState.error);
    yield put(signOutSuccess());
  } finally {
    yield delay(750);
    yield put(initialAuthCheckComplete());
    authChannel.close();
  }
}

export function* authSaga() {
  yield takeLatest(guestSignInRequest.type, guestSignInRequestSaga);
  yield takeLatest(signUpRequest.type, signUpSaga);
  yield takeLatest(signInRequest.type, signInSaga);
  yield takeLatest(signOutRequest.type, signOutSaga);
  yield takeLatest(resetRequest.type, resetSaga);
  // yield takeLatest(resetConfirmationRequest.type, resetConfirmationSaga);
  yield call(initialAuthCheckSaga);
}