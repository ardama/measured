import { generateId } from "@/utils/helpers";
import { getMeasurementRecordingValue, type Measurement, type MeasurementType } from '@t/measurements';
import { Collections } from '@u/constants/Firestore';
import { Icons } from '@u/constants/Icons';
import { stripExcessFields } from '@u/constants/Types';
import { SimpleDate } from '@u/dates';

interface Habit {
  id: string,
  userId: string,
  updates: HabitUpdate[];
}

interface ComputedHabit extends Habit {
  name: string;
  isWeekly: boolean;
  daysPerWeek: number;
  points: number;
  archived: boolean;
  conditions: HabitCondition[];
  predicate: HabitPredicate;
  priority: number,
}


const emptyComputedHabit = (): ComputedHabit => ({
  id: '',
  userId: '',
  updates: [],

  name: '',
  isWeekly: false,
  daysPerWeek: -1,
  points: -1,
  archived: false,
  conditions: [],
  predicate: '',
  priority: -1,
});

const mergeHabitUpdate = (computedHabit: ComputedHabit, update: HabitUpdate): ComputedHabit => {
  const newComputedHabit = { ...computedHabit };
  computedHabit.updates.push(update);
  return Object.entries(update).reduce((result: any, [key, value]) => {
    if (value !== undefined) result[key] = value;

    return stripExcessFields({
      ...result,
    }, emptyComputedHabit());
  }, newComputedHabit);
}
const computeHabit = (habit: Habit, date: SimpleDate = SimpleDate.today()): ComputedHabit => {
  const initialHabit: ComputedHabit = {
    ...emptyComputedHabit(),
    
    id: habit.id,
    userId: habit.userId,
  }

  const updates = habit.updates
    .filter((update) => update.date <= date.toString())
    .sort((a, b) => a.date >= b.date ? 1 : -1);
  const computedHabit = updates.reduce((habit, update) => {
    return mergeHabitUpdate(habit, update);
  }, initialHabit);

  if (!computedHabit.id) console.error('Habit id unset');
  if (!computedHabit.userId) console.error('Habit userId unset');

  return computedHabit;
}

interface HabitUpdate {
  date: string;

  name?: string;
  isWeekly?: boolean;
  daysPerWeek?: number;
  points?: number;
  archived?: boolean;
  conditions?: HabitCondition[]
  predicate?: HabitPredicate;
  priority?: number,
}

export const emptyHabitUpdate: HabitUpdate = {
  date: '',
  name: undefined,
  isWeekly: undefined,
  daysPerWeek: undefined,
  points: undefined,
  archived: undefined,
  conditions: undefined,
  predicate: undefined,
  priority: undefined,
};

const createInitialHabit = (
  userId: string, name: string,
  conditions: HabitCondition[],
  priority: number, isWeekly: boolean = false,
  daysPerWeek: number = 7, points: number = 1,
): Habit => ({
  id: generateId(Collections.Habits),
  userId,
  updates: [{
    date: SimpleDate.today().toString(),
    name,
    isWeekly,
    daysPerWeek,
    points,
    archived: false,
    conditions,
    predicate: 'AND',
    priority,
  }],
});

const constructHabitUpdate = (current: ComputedHabit, previous: ComputedHabit = emptyComputedHabit(), date: SimpleDate = SimpleDate.today()): HabitUpdate => {
  const update = stripExcessFields({
    ...current,
  }, emptyHabitUpdate);


  (Object.keys(current) as Array<keyof ComputedHabit>).forEach((key) => {
    let diff = false;
    switch (key) {
      case 'id':
      case 'userId':
      case 'updates':
        break;
      case 'conditions':
        diff = current.conditions.length !== previous.conditions.length;
        diff = diff || !!current.conditions.find((currentCondition, index) => {
          const previousCondition = previous.conditions[index];
          if (currentCondition.measurementId !== previousCondition.measurementId) return true;
          if (currentCondition.operator !== previousCondition.operator) return true;
          if (currentCondition.target !== previousCondition.target) return true;
        });

        if (!diff) delete update.conditions;
        break;
      default:
        diff = current[key] !== previous[key];
        if (!diff) delete update[key];
        break;
    }
  });

  update.date = date.toString();
  return update;
}

const isEmptyHabitUpdate = (update: HabitUpdate): boolean => {
  const keyCount = Object.keys(update).length;
  return keyCount === 0 || (keyCount === 1 && !!update.date);
}

interface HabitCondition {
  measurementId: string,
  operator: HabitOperator,
  target: number,
}

type HabitOperator = '>=' | '<=' |'>' | '<' | '==' | '!=';
const habitOperators: HabitOperator[] = [
  '>=',
  '<=',
  '>',
  '<',
  '==',
  '!=',
];

type HabitOperatorData = {
  icon: string, label: string, timeLabel: string,
}
const habitOperatorData: {
  ['>=']: HabitOperatorData,
  ['<=']: HabitOperatorData,
  ['>']: HabitOperatorData,
  ['<']: HabitOperatorData,
  ['==']: HabitOperatorData,
  ['!=']: HabitOperatorData,
} = {
  ['>=']: { icon: Icons.operatorGte, label: 'At least', timeLabel: 'At the earliest'},
  ['<=']: { icon: Icons.operatorLte, label: 'At most', timeLabel: 'At the latest'},
  ['>']: { icon: Icons.operatorGt, label: 'More than', timeLabel: 'After'},
  ['<']: { icon: Icons.operatorLt, label: 'Less than', timeLabel: 'Before'},
  ['==']: { icon: Icons.operatorEq, label: 'Exactly', timeLabel: 'At'},
  ['!=']: { icon: Icons.operatorNot, label: 'Not', timeLabel: 'Not at'},
};

const getHabitOperatorData = (operator: HabitOperator): HabitOperatorData => {
  return habitOperatorData[operator];
}

const getHabitOperatorLabel = (operator: HabitOperator, type: MeasurementType): string => {
  const data = getHabitOperatorData(operator);
  return type === 'time' ? data.timeLabel : data.label;
}

type HabitPredicate = 'AND' | 'OR' | string;
const getHabitPredicateLabel = (predicate: string) => predicate === 'OR' ? 'Any' : 'All';
const getHabitPredicateIcon = (predicate: string) => predicate === 'OR' ? Icons.predicateOr : Icons.predicateAnd;


const getHabitCompletion = (
  habit: ComputedHabit | null, measurements: Measurement[], dates: SimpleDate[],
): [boolean, boolean[], (number | null)[], (number | null)[]] => {
  let conditionCompletions: boolean[] = [];
  let conditionValues: (number | null)[] = [];
  let conditionProgressions: number[] = [];
  if (!habit || !habit.conditions.length) return [false, conditionCompletions, conditionValues, conditionProgressions];

  habit.conditions.forEach((condition) => {
    let conditionComplete = false;
    let conditionValue = null;
    let conditionProgress = 0;
    
    if (!dates.length) {
      conditionProgressions.push(conditionProgress);
      conditionCompletions.push(conditionComplete);
      conditionValues.push(conditionValue);
      return;
    };

    const measurementValues = dates.map((date) => {
      return getMeasurementRecordingValue(condition.measurementId, date, measurements);
    }).filter((value) => value !== null);
    
    if (!measurementValues.length) {
      conditionProgressions.push(conditionProgress);
      conditionCompletions.push(conditionComplete);
      conditionValues.push(conditionValue);
      return;
    };

    conditionValue = measurementValues.reduce((acc, curr) => acc + curr, 0);
    
    switch (condition.operator) {
      case '>':
        conditionProgress = Math.min(conditionValue / condition.target, 1.0) || 0;
        conditionComplete = conditionValue > condition.target;
        break;
      case '>=':
        conditionProgress = Math.min(conditionValue / condition.target, 1.0) || 0;
        conditionComplete = conditionValue >= condition.target;
        break;
      case '<':
        conditionProgress = Math.min(conditionValue / condition.target, 1.0) || 0;
        conditionComplete = conditionValue < condition.target;
        break;
      case '<=':
        if (condition.target === 0 && conditionValue === 0) {
          conditionProgress = 1;
          conditionComplete = true;
          break;
        }
        conditionProgress = Math.min(conditionValue / condition.target, 1.0) || 0;
        conditionComplete = conditionValue <= condition.target;
        break;
      case '==':
        if (condition.target === 0 && conditionValue === 0) {
          conditionProgress = 1;
          conditionComplete = true;
          break;
        }
        conditionProgress = Math.min(conditionValue / condition.target, 1.0) || 0;
        conditionComplete = conditionValue === condition.target;
        break;
      case '!=':
        conditionProgress = Math.min(conditionValue / condition.target, 1.0) || 0;
        conditionComplete = conditionValue !== condition.target;
        break;
    }

    conditionProgressions.push(conditionProgress);
    conditionCompletions.push(conditionComplete);
    conditionValues.push(conditionValue);
  });

  const complete = habit.predicate === 'OR' ? !!conditionCompletions.find((c) => c) : conditionCompletions.findIndex((c) => !c) === -1;

  return [complete, conditionCompletions, conditionValues, conditionProgressions];
}

export {
  type Habit,
  type ComputedHabit,
  mergeHabitUpdate,
  computeHabit, 

  type HabitUpdate,
  createInitialHabit,
  constructHabitUpdate,
  isEmptyHabitUpdate,
  
  type HabitOperator,
  habitOperators,
  getHabitOperatorData,
  getHabitOperatorLabel,

  type HabitPredicate,
  getHabitPredicateLabel,
  getHabitPredicateIcon,

  getHabitCompletion,
}