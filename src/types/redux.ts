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
      "priority": 1,
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
      "priority": 2,
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
      "priority": 3,
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
      "priority": 3,
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
      "priority": 5,
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
      "priority": 6,
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
      "priority": 7,
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
      "priority": 8,
    },
    {
      "id": "n7rij2z",
      "userId": "k1cit1t",
      "name": "Bedtime",
      "isWeekly": false,
      "daysPerWeek": 5,
      "points": 1,
      "archived": false,
      "conditions": [{
          "measurementId": "evq21bh",
          "operator": "<=",
          "target": 24.5,
        }
      ],
      "predicate": "AND",
      "priority": 0,
    }
  ];

  userState.measurements = [
    {
      "id": "d6b2gsc",
      "userId": "k1cit1t",
      "activity": "Read",
      "variant": "Tech",
      "type": "duration",
      "unit": "min",
      "step": 15,
      "defaultValue": 0,
      "priority": 1,
      "archived": false,
    },
    {
      "id": "zqflysf",
      "userId": "k1cit1t",
      "activity": "Outside",
      "variant": "",
      "type": "duration",
      "unit": "min",
      "step": 15,
      "defaultValue": 0,
      "priority": 10,
      "archived": false,
    },
    {
      "id": "26h38r8",
      "userId": "k1cit1t",
      "activity": "Youtube",
      "variant": "Gaming",
      "type": "duration",
      "unit": "min",
      "step": 15,
      "defaultValue": 0,
      "priority": 5,
      "archived": false,
    },
    {
      "id": "26218r8",
      "userId": "k1cit1t",
      "activity": "Gaming",
      "variant": "Playing",
      "type": "duration",
      "unit": "min",
      "step": 30,
      "defaultValue": 0,
      "priority": 4,
      "archived": false,
    },
    {
      "id": "evqx1bh",
      "userId": "k1cit1t",
      "activity": "Youtube",
      "variant": "Tech",
      "type": "duration",
      "unit": "min",
      "step": 15,
      "defaultValue": 0,
      "priority": 2,
      "archived": false,
    },
    {
      "id": "evq21bh",
      "userId": "k1cit1t",
      "activity": "Sleep",
      "variant": "Bedtime",
      "type": "time",
      "unit": "",
      "step": 0.5,
      "defaultValue": 23,
      "priority": 8,
      "archived": false,
    },
    {
      "id": "evq21dh",
      "userId": "k1cit1t",
      "activity": "Sleep",
      "variant": "Wakeup",
      "type": "time",
      "unit": "",
      "step": 0.5,
      "defaultValue": 10,
      "priority": 7,
      "archived": false,
    },
    {
      "id": "bdsbn0y",
      "userId": "k1cit1t",
      "activity": "Health",
      "variant": "Walking",
      "type": "count",
      "unit": "steps",
      "step": 1000,
      "defaultValue": 0,
      "priority": 9,
      "archived": false,
    },
    {
      "id": "aasbn0y",
      "userId": "k1cit1t",
      "activity": "Learning",
      "variant": "Tech",
      "type": "combo",
      "unit": "min",
      "step": 0,
      "defaultValue": 0,
      "priority": 3,
      "archived": false,
      "comboLeftId": "d6b2gsc",
      "comboRightId": "evqx1bh",
      "comboOperator": '+',
    },
    {
      "id": "gdsbn0y",
      "userId": "k1cit1t",
      "activity": "Gaming",
      "variant": "",
      "type": "combo",
      "unit": "min",
      "step": 0,
      "defaultValue": 0,
      "priority": 7,
      "archived": false,
      "comboLeftId": "26h38r8",
      "comboRightId": "26218r8",
      "comboOperator": '+',
    },
    {
      "id": "b1sbn0y",
      "userId": "k1cit1t",
      "activity": "Hygeine",
      "variant": "Wash face",
      "type": "bool",
      "unit": "",
      "step": 1,
      "defaultValue": 0,
      "priority": 11,
      "archived": false,
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
