import Status from '@u/constants/Status';
import type { Measurement } from '@t/measurements';
import type { Habit } from '@t/habits';
import { defaultAccount, type Account, type User } from '@t/users';
import type { AuthAction } from '@s/authReducer';

interface RootState {
  auth: AuthState
  data: DataState
}

interface AuthState {
  user: User | null
  tier: 'premium' | 'basic' | null
  loading: boolean
  error: string | null
  info: string | null
  action: AuthAction | null
  initialAuthCheckComplete: boolean
  isGuest: boolean
}

interface DataState {
  dataLoaded: number

  measurements: Measurement[]
  habits: Habit[]
  account: Account

  measurementStatus: {
    create: string
    update: string
    delete: string
  }
  habitStatus: {
    create: string
    update: string
    delete: string
  }
  accountStatus: {
    update: string
  }
};

const createDataState = (): DataState => ({
  dataLoaded: 0,

  measurements: [],
  habits: [],
  account: defaultAccount(),

  measurementStatus: {
    create: Status.Measurement.Create.SUCCESS,
    update: Status.Measurement.Update.SUCCESS,
    delete: Status.Measurement.Delete.SUCCESS,
  },
  habitStatus: {
    create: Status.Habit.Create.SUCCESS,
    update: Status.Habit.Update.SUCCESS,
    delete: Status.Habit.Delete.SUCCESS,
  },
  accountStatus: {
    update: Status.Recording.Update.SUCCESS,
  },
});

export {
  type RootState,

  type AuthState,
  type DataState,

  createDataState,
}
