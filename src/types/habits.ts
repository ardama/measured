import { generateId } from "@/utils/helpers";
import { getMeasurementRecordingValue, type Measurement, type MeasurementType } from '@t/measurements';
import type { Recording } from '@t/recording';
import { Icons } from '@u/constants/Icons';
import { stripExcessFields } from '@u/constants/Types';
import { SimpleDate } from '@u/dates';

interface Habit {
  habitId: string;
  userId: string;
  name: string;
  isWeekly: boolean;
  daysPerWeek: number;
  points: number;
  archived: boolean;
  conditions: HabitCondition[];
  predicate: HabitPredicate;
  priority: number,
  updates: HabitUpdate[],
}

const emptyHabit = (): Habit => ({
  habitId: '',
  userId: '',
  name: '',
  isWeekly: false,
  daysPerWeek: -1,
  points: -1,
  archived: false,
  conditions: [],
  predicate: '',
  priority: -1,
  updates: [],
});

const mergeHabitUpdate = (habit: Habit, update: HabitUpdate): Habit => {
  const newHabit = { ...habit };
  habit.updates.push(update);
  return Object.entries(update).reduce((result: any, [key, value]) => {
    if (key === 'id') return result as Habit;
    if (key === 'date') return result as Habit;
    if (value !== undefined) result[key] = value;


    return result as Habit;
  }, newHabit);
}
const constructHabit = (updates: HabitUpdate[]): Habit => {
  const newHabit = updates.sort((a, b) => a.date >= b.date ? 1 : -1).reduce((habit, update) => {
    return mergeHabitUpdate(habit, update);
  }, emptyHabit());

  if (!newHabit.habitId) console.error('Habit id unset');
  if (!newHabit.userId) console.error('Habit userId unset');
  if (newHabit.daysPerWeek < 0) console.error('Habit daysPerWeek unset');
  if (newHabit.priority < 0) console.error('Habit priority unset');
  if (!newHabit.predicate) console.error('Habit predicate unset');

  return newHabit;
}

const rewindHabit = (habit: Habit, date: SimpleDate) => {
  const previousUpdates = habit.updates.filter((update) => update.date <= date.toString());
  return previousUpdates.length ? constructHabit(previousUpdates) : null;
}

interface HabitUpdate {
  id: string;
  habitId: string;
  date: string;
  userId: string;

  name?: string;
  isWeekly?: boolean;
  daysPerWeek?: number;
  points?: number;
  archived?: boolean;
  conditions?: HabitCondition[];
  predicate?: HabitPredicate;
  priority?: number,
}

const createEmptyHabitUpdate = (
  userId: string,
  habitId: string,
): HabitUpdate => ({
  id: generateId(),
  userId,
  habitId,
  date: SimpleDate.today().toString(),
});

export const emptyHabitUpdate: HabitUpdate = {
  id: '',
  habitId: '',
  date: '',
  userId: '',
  name: undefined,
  isWeekly: undefined,
  daysPerWeek: undefined,
  points: undefined,
  archived: undefined,
  conditions: undefined,
  predicate: undefined,
  priority: undefined,
};

const createInitialHabitUpdate = (
  userId: string, measurementId: string, name: string,
  operator: HabitOperator, priority: number,
  target: number = -1, isWeekly: boolean = false,
  daysPerWeek: number = 7, points: number = 1,
): HabitUpdate => ({
  id: generateId(),
  habitId: generateId(),
  date: SimpleDate.today().toString(),
  userId,
  name,
  isWeekly,
  daysPerWeek,
  points,
  archived: false,
  conditions: [{
    measurementId,
    operator,
    target,
  }],
  predicate: 'AND',
  priority,
});

const constructHabitUpdate = (current: Habit, previous: (Habit | null), date: SimpleDate = SimpleDate.today()): HabitUpdate => {
  const update = stripExcessFields({
    ...current,
  }, emptyHabitUpdate);

  if (previous) {
    (Object.keys(current) as Array<keyof Habit>).forEach((key) => {
      let diff = false;
      switch (key) {
        case 'conditions':
          diff = current.conditions.length !== previous.conditions.length;
          diff = diff || !!current.conditions.find((currentCondition, index) => {
            const previousCondition = previous.conditions[index];
            if (currentCondition.measurementId !== previousCondition.measurementId) return true;
            if (currentCondition.operator !== previousCondition.operator) return true;
            if (currentCondition.target !== previousCondition.target) return true;
          });
  
          if (!diff) delete update[key];
          break;
        case 'habitId':
        case 'updates':
          break;
        default:
          diff = current[key] !== previous[key];
          if (!diff) delete update[key];
          break;
      }
    });
  }

  update.id = generateId();
  update.date = date.toString();
  return update;
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
  habit: (Habit | null), recordings: (Recording | undefined)[], measurements: Measurement[]
): [boolean, boolean[], number[], number[]] => {
  let conditionCompletions: boolean[] = [];
  let conditionValues: number[] = [];
  let conditionProgressions: number[] = [];
  if (!habit) return [false, conditionCompletions, conditionValues, conditionProgressions];

  habit.conditions.forEach((condition) => {
    let conditionComplete = false;
    let conditionValue = 0;
    let conditionProgress = 0;
    
    if (!recordings.length) {
      conditionProgressions.push(conditionProgress);
      conditionCompletions.push(conditionComplete);
      conditionValues.push(conditionValue);
      return;
    };
    
    const measurementValues = recordings.filter((r) => !!r).map((r) => {
      return getMeasurementRecordingValue(condition.measurementId, measurements, r);
    }).filter((v) => v !== undefined);

    
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
  mergeHabitUpdate,
  constructHabit, 
  rewindHabit,

  type HabitUpdate,
  createEmptyHabitUpdate,
  createInitialHabitUpdate,
  constructHabitUpdate,
  
  type HabitOperator,
  habitOperators,
  getHabitOperatorData,
  getHabitOperatorLabel,

  type HabitPredicate,
  getHabitPredicateLabel,
  getHabitPredicateIcon,

  getHabitCompletion,
}