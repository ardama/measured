import Status from '@u/constants/Status';
import type { Measurement } from '@t/measurements';
import type { Habit } from '@t/habits';
import type { User } from '@t/users';

interface RootState {
  app: AppState;
  auth: AuthState;
  data: DataState;
}

interface AppState {
  darkMode: boolean;
}

interface AuthState {
  user: User | null,
  loading: boolean;
  error: string | null;
  firstLoadComplete: boolean,
}

interface DataState {
  measurements: Measurement[];
  habits: Habit[],

  measurementStatus: {
    create: string,
    update: string,
    delete: string,
  },
  recordingStatus: {
    create: string,
    update: string,
    delete: string,
  },
  habitStatus: {
    create: string,
    update: string,
    delete: string,
  },
};

const createDataState = (): DataState => ({
  measurements: [],
  habits: [],

  measurementStatus: {
    create: Status.Measurement.Create.SUCCESS,
    update: Status.Measurement.Update.SUCCESS,
    delete: Status.Measurement.Delete.SUCCESS,
  },
  recordingStatus: {
    create: Status.Recording.Create.SUCCESS,
    update: Status.Recording.Update.SUCCESS,
    delete: Status.Recording.Delete.SUCCESS,
  },
  habitStatus: {
    create: Status.Habit.Create.SUCCESS,
    update: Status.Habit.Update.SUCCESS,
    delete: Status.Habit.Delete.SUCCESS,
  }
});

export {
  type RootState,

  type AuthState,
  type DataState,
  type AppState,

  createDataState,
}
