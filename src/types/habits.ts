import { generateId } from "@/utils/helpers";
import { getMeasurementRecordingValue, type Measurement, type MeasurementType } from '@t/measurements';
import type { Recording } from '@t/recording';
import { Icons } from '@u/constants/Icons';

interface Habit {
  id: string;
  userId: string;
  name: string;
  isWeekly: boolean;
  daysPerWeek: number;
  points: number;
  archived: boolean;
  conditions: HabitCondition[];
  predicate: HabitPredicate;
  priority: number,
}

const createHabit = (userId: string, measurementId: string, name: string, operator: HabitOperator, priority: number, target: number = -1, isWeekly: boolean = false, daysPerWeek: number = 7, points: number = 1): Habit => ({
  id: generateId(),
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


const getHabitCompletion = (habit: Habit, recordings: (Recording | undefined)[], measurements: Measurement[]): [boolean, boolean[], number[], number[]] => {
  let conditionCompletions: boolean[] = [];
  let conditionValues: number[] = [];
  let conditionProgressions: number[] = [];

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
  createHabit,
  
  type HabitOperator,
  habitOperators,
  getHabitOperatorData,
  getHabitOperatorLabel,

  type HabitPredicate,
  getHabitPredicateLabel,
  getHabitPredicateIcon,

  getHabitCompletion,
}