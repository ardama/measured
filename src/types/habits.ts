import { generateId } from "@/utils/helpers";
import { getMeasurementRecordingValue, type Measurement, type MeasurementType } from '@t/measurements';
import type { BaseColor } from '@u/colors';
import { Collections } from '@u/constants/Firestore';
import { Icons } from '@u/constants/Icons';
import { stripExcessFields } from '@u/constants/Types';
import { SimpleDate } from '@u/dates';

interface Habit {
  id: string
  userId: string
  updates: HabitUpdate[]
}

interface ComputedHabit extends Habit {
  name: string
  category: string
  isWeekly: boolean
  daysPerWeek: number
  points: number
  rewardType: HabitRewardType
  maximumPoints: number
  minimumPoints: number
  archived: boolean
  conditions: HabitCondition[]
  predicate: HabitPredicate
  priority: number
  baseColor?: BaseColor
}

type FormHabit = {
  id: string
  userId: string
  updates: HabitUpdate[]
  
  name: string
  category: string
  isWeekly: boolean
  points: number
  rewardType: HabitRewardType
  maximumPoints: number
  minimumPoints: number
  daysPerWeek: number
  archived: boolean
  conditions: FormHabitCondition[]
  predicate: string
  priority: number
  baseColor?: BaseColor
};

type FormHabitCondition = {
  measurementId?: string
  operator?: HabitOperator
  target?: string
  minTarget?: string
  maxTarget?: string
}

const emptyComputedHabit = (): ComputedHabit => ({
  id: '',
  userId: '',
  updates: [],

  name: '',
  category: '',
  isWeekly: false,
  daysPerWeek: -1,
  points: -1,
  maximumPoints: 0,
  minimumPoints: 0,
  rewardType: 'standard',
  archived: false,
  conditions: [],
  predicate: '',
  priority: -1,
  baseColor: undefined,
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
// Cache for computed habits: Map<habitId, Map<effectiveDate, ComputedHabit>>
const computedHabitCache = new Map<string, Map<string, ComputedHabit>>();

// Helper to compute update dates for a habit computation
// Returns [effectiveDate, allRelevantDates] for efficient multi-version caching
const getHabitUpdateDates = (habit: Habit, requestedDate: SimpleDate): [string, string[]] => {
  // Compute sorted update dates (cheap operation for typical habits with <10 updates)
  const updateDates = habit.updates
    .map(update => update.date)
    .sort()
    .filter((date, index, arr) => arr.indexOf(date) === index); // Remove duplicates
  
  // Find the most recent update date <= requested date and collect all relevant dates
  const requestedDateStr = requestedDate.toString();
  let effectiveDate = updateDates[0]; // Default to first update
  const relevantDates: string[] = [];
  
  for (const updateDate of updateDates) {
    if (updateDate <= requestedDateStr) {
      effectiveDate = updateDate;
      relevantDates.push(updateDate);
    } else {
      break;
    }
  }
  
  return [effectiveDate, relevantDates];
};

const computeHabit = (habit: Habit, date: SimpleDate = SimpleDate.today()): ComputedHabit => {
  const habitId = habit.id;
  const [effectiveDate, relevantDates] = getHabitUpdateDates(habit, date);
  
  // Check cache first
  const habitCache = computedHabitCache.get(habitId);
  if (habitCache?.has(effectiveDate)) {
    return habitCache.get(effectiveDate)!;
  }
  
  // Initialize cache for this habit if needed
  if (!computedHabitCache.has(habitId)) {
    computedHabitCache.set(habitId, new Map());
  }
  const cache = computedHabitCache.get(habitId)!;
  
  // Build up habit incrementally, caching each version along the way
  let currentHabit: ComputedHabit = {
    ...emptyComputedHabit(),
    id: habit.id,
    userId: habit.userId,
  };
  
  // Sort all updates once
  const sortedUpdates = [...habit.updates].sort((a, b) => 
    a.date >= b.date ? 1 : -1
  );
  
  let updateIndex = 0;
  
  // Process each effective date and cache the result
  for (const updateDate of relevantDates) {
    // Skip if already cached
    if (cache.has(updateDate)) {
      currentHabit = cache.get(updateDate)!;
      // Move updateIndex to skip already-applied updates
      while (updateIndex < sortedUpdates.length && 
             sortedUpdates[updateIndex].date <= updateDate) {
        updateIndex++;
      }
      continue;
    }
    
    // Apply all updates up to this date
    while (updateIndex < sortedUpdates.length && 
           sortedUpdates[updateIndex].date <= updateDate) {
      currentHabit = mergeHabitUpdate(currentHabit, sortedUpdates[updateIndex]);
      updateIndex++;
    }
    
    // Cache this version (create a shallow copy to avoid mutation issues)
    cache.set(updateDate, { ...currentHabit });
  }

  if (!currentHabit.id) console.error('Habit id unset');

  return currentHabit;
}


interface HabitUpdate {
  date: string;

  name?: string;
  category?: string;
  isWeekly?: boolean;
  daysPerWeek?: number;
  points?: number;
  rewardType?: HabitRewardType;
  maximumPoints?: number;
  minimumPoints?: number;
  archived?: boolean;
  conditions?: HabitCondition[]
  predicate?: HabitPredicate;
  priority?: number,
  baseColor?: BaseColor,
}

export const emptyHabitUpdate: HabitUpdate = {
  date: '',
  name: undefined,
  category: undefined,
  isWeekly: undefined,
  daysPerWeek: undefined,
  points: undefined,
  rewardType: undefined,
  maximumPoints: undefined,
  minimumPoints: undefined,
  archived: undefined,
  conditions: undefined,
  predicate: undefined,
  priority: undefined,
  baseColor: undefined,
};

const createInitialHabit = (
  userId: string, name: string, category: string, baseColor: BaseColor,
  conditions: HabitCondition[],
  priority: number, isWeekly: boolean = false,
  daysPerWeek: number = 7, points: number = 1,
): Habit => ({
  id: generateId(Collections.Habits),
  userId,
  updates: [{
    date: SimpleDate.today().toString(),
    name,
    category: category || '',
    isWeekly,
    daysPerWeek,
    points,
    rewardType: 'standard',
    maximumPoints: 0,
    minimumPoints: 0,
    archived: false,
    conditions,
    predicate: 'AND',
    priority,
    baseColor: baseColor || undefined,
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
          if (currentCondition.minTarget !== previousCondition.minTarget) return true;
          if (currentCondition.maxTarget !== previousCondition.maxTarget) return true;
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
  minTarget?: number,
  maxTarget?: number,
}

type HabitRewardType = 'standard' | 'partial' | 'extra';
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
  icon: string, label: string, timeLabel: string, boolLabel: string,
}
const habitOperatorData: {
  ['>=']: HabitOperatorData,
  ['<=']: HabitOperatorData,
  ['>']: HabitOperatorData,
  ['<']: HabitOperatorData,
  ['==']: HabitOperatorData,
  ['!=']: HabitOperatorData,
} = {
  ['>=']: { icon: Icons.operatorGte, label: 'At least', timeLabel: 'At the earliest', boolLabel: ''},
  ['<=']: { icon: Icons.operatorLte, label: 'At most', timeLabel: 'At the latest', boolLabel: ''},
  ['>']: { icon: Icons.operatorGt, label: 'More than', timeLabel: 'After', boolLabel: ''},
  ['<']: { icon: Icons.operatorLt, label: 'Less than', timeLabel: 'Before', boolLabel: ''},
  ['==']: { icon: Icons.operatorEq, label: 'Exactly', timeLabel: 'At', boolLabel: 'Is'},
  ['!=']: { icon: Icons.operatorNot, label: 'Not', timeLabel: 'Not at', boolLabel: 'Is not'},
};

const getHabitOperatorData = (operator: HabitOperator): HabitOperatorData => {
  return habitOperatorData[operator];
}

const getHabitOperatorLabel = (operator: HabitOperator, type: MeasurementType): string => {
  const data = getHabitOperatorData(operator);
  return (
    type === 'time' ? data.timeLabel :
    type === 'bool' ? data.boolLabel :
    data.label
  ) || data.label;
}

type HabitPredicate = 'AND' | 'OR' | string;
const getHabitPredicateLabel = (predicate: string) => predicate === 'OR' ? 'Any' : 'All';
const getHabitPredicateIcon = (predicate: string) => predicate === 'OR' ? Icons.predicateOr : Icons.predicateAnd;


const getHabitCompletion = (
  habit: ComputedHabit | null, 
  measurements: Measurement[], 
  dates: SimpleDate[],
  recordingData: Map<string, Map<string, number | null>>,
): [boolean, number, boolean[], (number | null)[], (number | null)[]] => {
  let conditionCompletions: boolean[] = [];
  let conditionValues: (number | null)[] = [];
  let conditionProgressions: number[] = [];
  let points: number = 0;
  if (!habit || !habit.conditions.length) return [false, points, conditionCompletions, conditionValues, conditionProgressions];

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
      return getMeasurementRecordingValue(condition.measurementId, date, measurements, recordingData);
    }).filter((value) => value !== null);
    
    if (!measurementValues.length) {
      conditionProgressions.push(conditionProgress);
      conditionCompletions.push(conditionComplete);
      conditionValues.push(conditionValue);
      return;
    };

    conditionValue = measurementValues.reduce((acc, curr) => acc + curr, 0);
    
    let operator = condition.operator;
    if (habit.rewardType === 'partial' && condition.minTarget !== undefined) {
      operator = condition.target > condition.minTarget ? '>=' : '<=';
    } else if (habit.rewardType === 'extra' && condition.maxTarget !== undefined) {
      operator = condition.maxTarget > condition.target ? '>=' : '<=';
    }

    switch (operator) {
      case '>':
        conditionProgress = Math.min(conditionValue / condition.target, 1.0) || 0;
        conditionComplete = conditionValue > condition.target;
        break;
      case '>=':
        conditionProgress = Math.min(conditionValue / condition.target, 1.0) || 0;
        conditionComplete = conditionValue >= condition.target;
        break;
      case '<':
        conditionProgress = 1 - Math.min(conditionValue / condition.target, 1.0) || 0;
        conditionComplete = conditionValue < condition.target;
        break;
      case '<=':
        if (condition.target === 0 && conditionValue === 0) {
          conditionProgress = 1;
          conditionComplete = true;
          break;
        }
        conditionProgress = 1 - Math.min(conditionValue / condition.target, 1.0) || 0;
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
  points = complete ? habit.points : 0;
  if (habit.rewardType === 'partial') {
    const condition = habit.conditions[0];
    const conditionValue = conditionValues[0];

    const partialPointWindow = condition.target - (condition.minTarget || 0);
    const partialPointValue = (conditionValue || 0) - (condition.minTarget || 0);
    const partialPointProgress = partialPointValue / partialPointWindow;
    const partialPoints = Math.min(partialPointProgress * (habit.points - habit.minimumPoints), habit.points - habit.minimumPoints);
    if (partialPoints >= 0) points = partialPoints + habit.minimumPoints;
  } else if (habit.rewardType === 'extra') {
    const condition = habit.conditions[0];
    const conditionValue = conditionValues[0];

    const extraPointWindow = (condition.maxTarget || 0) - condition.target;
    const extraPointValue = (conditionValue || 0) - (condition.target || 0);
    const extraPointProgress = extraPointValue / extraPointWindow;
    const extraPoints = Math.max(0, Math.min(extraPointProgress * (habit.maximumPoints - habit.points), habit.maximumPoints - habit.points));
    if (complete) points += extraPoints;
  }
  
  return [complete, points, conditionCompletions, conditionValues, conditionProgressions];
}

export {
  type Habit,
  type ComputedHabit,
  type FormHabit,
  type FormHabitCondition,
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

  type HabitCondition,

  getHabitCompletion,
}