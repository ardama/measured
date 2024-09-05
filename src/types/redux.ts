import { generateId } from "@/utils/helpers";
import { generateDefaultMeasurementUnits } from '@t/measurements';
import type { User } from '@t/users';

interface RootState {
  app: AppState;
  user: UserState;
}

type UserState = User & {
  loading: boolean | null | undefined;
  updating: boolean | null | undefined;
  error: string | null | undefined;
};

const createUserState = (name: string | undefined = 'Guest', email: string | undefined = ''): UserState => ({
  id: generateId(),
  name,
  email,
  measurements: [],
  measurementUnits: generateDefaultMeasurementUnits(),
  recordings: [],
  habits: [],

  loading: false,
  updating: false,
  error: null,
});

interface AppState {
  darkMode: boolean;
}

const createAppState = (): AppState => ({
  darkMode: false,
});

export {
  type RootState,
  type UserState,
  type AppState,

  createUserState,
  createAppState,
}
