import { type Measurement } from '@t/measurements';
import { type ComputedHabit } from '@t/habits';
import { Collections } from '@u/constants/Firestore';
import { generateId } from '@u/helpers';

export const sampleMeasurements: Measurement[] = [
  {
    id: generateId(Collections.Measurements),
    userId: '',
    type: 'time',
    name: 'Sleep',
    variant: 'Wakeup',
    unit: 'hours',
    step: 0.5,
    initial: 7,
    priority: 1,
    archived: false,
    recordings: [],
  },
  {
    id: generateId(Collections.Measurements),
    userId: '',
    type: 'duration',
    name: 'Social media',
    variant: '',
    unit: 'minutes',
    step: 15,
    initial: 0,
    priority: 2,
    archived: false,
    recordings: [],
    baseColor: 'green'
  },
  {
    id: generateId(Collections.Measurements),
    userId: '',
    type: 'count',
    name: 'Nutrition',
    variant: 'Water',
    unit: 'oz',
    step: 8,
    initial: 64,
    priority: 3,
    archived: false,
    recordings: [],
    baseColor: 'blue'
  },
  {
    id: generateId(Collections.Measurements),
    userId: '',
    type: 'bool',
    name: 'Nutrition',
    variant: 'Vitamins',
    unit: '',
    step: 1,
    initial: 0,
    priority: 4,
    archived: false,
    recordings: [],
    baseColor: 'blue'
  }
];


export const sampleHabits: ComputedHabit[] = [
  {
    id: generateId(Collections.Habits),
    userId: '',
    updates: [
        {
            date: '2025-01-14',
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
    isWeekly: false,
    daysPerWeek: 7,
    points: 1,
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
            date: '2025-01-14',
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
    isWeekly: false,
    daysPerWeek: 5,
    points: 3,
    archived: false,
    conditions: [
        {
            measurementId: sampleMeasurements[1].id,
            operator: '<=',
            target: 30
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
            date: '2025-01-14',
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
    isWeekly: false,
    daysPerWeek: 7,
    points: 2,
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
    priority: 1
  },
];