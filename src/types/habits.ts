import { generateId } from "@/utils/helpers";
import { getMeasurementRecordingValue, type Measurement, type MeasurementType } from '@t/measurements';
import { Collections } from '@u/constants/Firestore';
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
    if (value !== undefined) result[key] = value;

    return stripExcessFields({
      ...result,
    }, emptyHabit());
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
  return previousUpdates.length ? constructHabit(previousUpdates) : emptyHabit();
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
  conditions?: HabitCondition[]
  predicate?: HabitPredicate;
  priority?: number,
}

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
  id: generateId(Collections.HabitUpdates),
  habitId: generateId(Collections.HabitUpdates),
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

const constructHabitUpdate = (current: Habit, previous: Habit = emptyHabit(), date: SimpleDate = SimpleDate.today()): HabitUpdate => {
  const update = stripExcessFields({
    ...current,
  }, emptyHabitUpdate);


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

        if (diff) update.conditions = current.conditions;
        break;
      case 'userId':
      case 'habitId':
      case 'updates':
        break;
      default:
        diff = current[key] !== previous[key];
        if (!diff) delete update[key];
        break;
    }
  });

  update.id = generateId(Collections.HabitUpdates);
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
  habit: Habit | null, measurements: Measurement[], dates: SimpleDate[],
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
  mergeHabitUpdate,
  constructHabit, 
  rewindHabit,

  type HabitUpdate,
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