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

const generateTestUser = (): UserState => {
  const userState = createUserState();
  userState.habits = [
    {
      "id": "dt2nuwb",
      "userId": "k1cit1t",
      "measurementId": "d6b2gsc",
      "name": "Reading",
      "operator": ">=",
      "daily": 15,
      "weekly": -1,
      "daysPerWeek": 5,
      "points": 1
    },
    {
      "id": "nkd0zop",
      "userId": "k1cit1t",
      "measurementId": "zqflysf",
      "name": "Outside 1",
      "operator": ">=",
      "daily": 15,
      "weekly": -1,
      "daysPerWeek": 7,
      "points": 1
    },
    {
      "id": "znlcwpm",
      "userId": "k1cit1t",
      "measurementId": "zqflysf",
      "name": "Outside 2",
      "operator": ">=",
      "daily": 60,
      "weekly": -1,
      "daysPerWeek": 4,
      "points": 1
    },
    {
      "id": "03o71dt",
      "userId": "k1cit1t",
      "measurementId": "26h38r8",
      "name": "Youtube 1",
      "operator": "<=",
      "daily": 90,
      "weekly": -1,
      "daysPerWeek": 7,
      "points": 1
    },
    {
      "id": "t389elo",
      "userId": "k1cit1t",
      "measurementId": "26h38r8",
      "name": "Youtube 2",
      "operator": "==",
      "daily": 0,
      "weekly": -1,
      "daysPerWeek": 4,
      "points": 2
    },
    {
      "id": "1acyx6p",
      "userId": "k1cit1t",
      "measurementId": "evqx1bh",
      "name": "Tech 1",
      "operator": ">=",
      "daily": 30,
      "weekly": -1,
      "daysPerWeek": 6,
      "points": 1
    },
    {
      "id": "n7rijct",
      "userId": "k1cit1t",
      "measurementId": "bdsbn0y",
      "name": "Steps",
      "operator": ">=",
      "daily": 10000,
      "weekly": -1,
      "daysPerWeek": 5,
      "points": 1
    }
  ];

  userState.measurements = [
    {
      "id": "d6b2gsc",
      "userId": "k1cit1t",
      "activity": "Read",
      "variant": "Nonfiction",
      "type": "duration",
      "unit": "min",
      "step": 15,
      "archived": false,
      "recordings": []
    },
    {
      "id": "zqflysf",
      "userId": "k1cit1t",
      "activity": "Outside",
      "variant": "",
      "type": "duration",
      "unit": "min",
      "step": 15,
      "archived": false,
      "recordings": []
    },
    {
      "id": "26h38r8",
      "userId": "k1cit1t",
      "activity": "Youtube",
      "variant": "Gaming",
      "type": "duration",
      "unit": "min",
      "step": 15,
      "archived": false,
      "recordings": []
    },
    {
      "id": "evqx1bh",
      "userId": "k1cit1t",
      "activity": "Youtube",
      "variant": "Tech",
      "type": "duration",
      "unit": "min",
      "step": 15,
      "archived": false,
      "recordings": []
    },
    {
      "id": "bdsbn0y",
      "userId": "k1cit1t",
      "activity": "Health",
      "variant": "Walking",
      "type": "count",
      "unit": "steps",
      "step": 1000,
      "archived": false,
      "recordings": []
    }
  ];

  return userState;
}

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

  generateTestUser,
}
