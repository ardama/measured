import { type Measurement } from '@t/measurements';
import { type ComputedHabit } from '@t/habits';
import { Collections } from '@u/constants/Firestore';
import { generateId } from '@u/helpers';
import { SimpleDate } from '@u/dates';

export const sampleMeasurements: Measurement[] = [
  {
    id: generateId(Collections.Measurements),
    userId: '',
    type: 'time',
    category: 'Sleep',
    name: 'Wakeup',
    unit: 'hours',
    step: 0.5,
    initial: 7,
    priority: 1,
    archived: false,
    recordings: [],
    notes: [],
  },
  {
    id: generateId(Collections.Measurements),
    userId: '',
    type: 'duration',
    category: '',
    name: 'Social media',
    unit: 'minutes',
    step: 15,
    initial: 0,
    priority: 2,
    archived: false,
    recordings: [],
    notes: [],
    baseColor: 'red'
  },
  {
    id: generateId(Collections.Measurements),
    userId: '',
    type: 'count',
    category: '',
    name: 'Water',
    unit: 'oz',
    step: 8,
    initial: 64,
    priority: 3,
    archived: false,
    recordings: [],
    notes: [],
    baseColor: 'blue'
  },
  {
    id: generateId(Collections.Measurements),
    userId: '',
    type: 'bool',
    category: 'Nutrition',
    name: 'Vitamins',
    unit: '',
    step: 1,
    initial: 0,
    priority: 4,
    archived: false,
    recordings: [],
    notes: [],
    baseColor: 'green'
  }
];


export const sampleHabits: ComputedHabit[] = [
  {
    id: generateId(Collections.Habits),
    userId: '',
    updates: [
      {
        date: SimpleDate.today().toString(),
        name: '',
        isWeekly: false,
        daysPerWeek: 7,
        points: 1,
        archived: false,
        conditions: [],
        predicate: 'AND',
        priority: 1
      }
    ],
    name: 'Early riser',
    category: 'Sleep',
    isWeekly: false,
    daysPerWeek: 7,
    points: 1,
    rewardType: 'standard',
    maximumPoints: 0,
    archived: false,
    conditions: [
      {
        measurementId: sampleMeasurements[0].id,
        operator: '<=',
        target: 7.5
      }
    ],
    predicate: 'AND',
    priority: 1
  },
  {
    id: generateId(Collections.Habits),
    userId: '',
    updates: [
      {
        date: SimpleDate.today().toString(),
        name: '',
        isWeekly: false,
        daysPerWeek: 7,
        points: 1,
        archived: false,
        conditions: [],
        predicate: 'AND',
        priority: 1
      }
    ],
    name: 'Limit scrolling',
    category: '',
    isWeekly: false,
    daysPerWeek: 5,
    points: 3,
    rewardType: 'standard',
    maximumPoints: 0,
    archived: false,
    conditions: [
      {
        measurementId: sampleMeasurements[1].id,
        operator: '<=',
        target: 30
      }
    ],
    predicate: 'AND',
    priority: 2,
    baseColor: 'red'
  },
  {
    id: generateId(Collections.Habits),
    userId: '',
    updates: [
      {
        date: SimpleDate.today().toString(),
        name: '',
        isWeekly: false,
        daysPerWeek: 7,
        points: 1,
        archived: false,
        conditions: [],
        predicate: 'AND',
        priority: 1
      }
    ],
    name: 'Stay healthy',
    category: 'Nutrition',
    baseColor: 'green',
    isWeekly: false,
    daysPerWeek: 7,
    points: 2,
    rewardType: 'standard',
    maximumPoints: 0,
    archived: false,
    conditions: [
      {
        measurementId: sampleMeasurements[2].id,
        operator: '>=',
        target: 64
      },
      {
        measurementId: sampleMeasurements[3].id,
        operator: '==',
        target: 1
      }
    ],
    predicate: 'AND',
    priority: 3,
  },
];