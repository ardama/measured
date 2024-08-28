import { generateId } from "@/utils/helpers";
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
  habits: [],

  loading: false,
  updating: false,
  error: null,
});

interface AppState {
  activeTab: number;
}

const createAppState = (): AppState => ({
  activeTab: 1,
});

export {
  type RootState,
  type UserState,
  type AppState,

  createUserState,
  createAppState,
}
