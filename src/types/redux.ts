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
      "name": "Reading",
      "isWeekly": false,
      "daysPerWeek": 5,
      "points": 1,
      "archived": false,
      "conditions": [
        {
          "measurementId": "d6b2gsc",
          "operator": ">=",
          "target": 15,
        }
      ],
      "predicate": "AND",
    },
    {
      "id": "nkd0zop",
      "userId": "k1cit1t",
      "name": "Outside 1",
      "isWeekly": false,
      "daysPerWeek": 7,
      "points": 1,
      "archived": false,
      "conditions": [
        {
          "measurementId": "zqflysf",
          "operator": ">=",
          "target": 15,
        }
      ],
      "predicate": "AND",
    },
    {
      "id": "znlcwpm",
      "userId": "k1cit1t",
      "name": "Outside 2",
      "isWeekly": false,
      "daysPerWeek": 4,
      "points": 1,
      "archived": false,
      "conditions": [
        {
          "measurementId": "zqflysf",
          "operator": ">=",
          "target": 60,
        }
      ],
      "predicate": "AND",
    },
    {
      "id": "03o71dt",
      "userId": "k1cit1t",
      "name": "Youtube 1",
      "isWeekly": false,
      "daysPerWeek": 7,
      "points": 1,
      "archived": false,
      "conditions": [
        {
          "measurementId": "26h38r8",
          "operator": "<=",
          "target": 90,
        }
      ],
      "predicate": "AND",
    },
    {
      "id": "t389elo",
      "userId": "k1cit1t",
      "name": "Youtube 2",
      "isWeekly": false,
      "daysPerWeek": 4,
      "points": 2,
      "archived": false,
      "conditions": 
      [{
          "measurementId": "26h38r8",
          "operator": "==",
          "target": 0,
      
          }],
          "predicate": "AND",
    },
    {
      "id": "1acyx6p",
      "userId": "k1cit1t",
      "name": "Tech 1",
      "isWeekly": false,
      "daysPerWeek": 6,
      "points": 1,
      "archived": true,
      "conditions": [
        {
          "measurementId": "evqx1bh",
          "operator": ">=",
          "target": 30,
        }
      ],
      "predicate": "AND",
    },
    {
      "id": "n7rijct",
      "userId": "k1cit1t",
      "name": "Steps",
      "isWeekly": false,
      "daysPerWeek": 5,
      "points": 1,
      "archived": false,
      "conditions": [{

          "measurementId": "bdsbn0y",
          "operator": ">=",
          "target": 10000,
        }
      ],
      "predicate": "AND",
    },
    {
      "id": "n7rijcz",
      "userId": "k1cit1t",
      "name": "Steps",
      "isWeekly": true,
      "daysPerWeek": 5,
      "points": 5,
      "archived": false,
      "conditions": [{

          "measurementId": "bdsbn0y",
          "operator": ">=",
          "target": 50000,
        }
      ],
      "predicate": "AND",
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
