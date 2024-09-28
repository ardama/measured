import { generateId } from "@/utils/helpers";
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
}

const createHabit = (userId: string, measurementId: string, name: string, operator: HabitOperator, target: number = -1, isWeekly: boolean = false, daysPerWeek: number = 7, points: number = 1): Habit => ({
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
});

interface HabitCondition {
  measurementId: string,
  operator: HabitOperator,
  target: number,
}

type HabitOperator = '>=' | '<=' |'>' | '<' | '==' | '!=';
const habitOperatorData: { operator: HabitOperator, icon: string, label: string }[] = [
  { operator: '>=', icon: Icons.operatorGte, label: 'At least'},
  { operator: '<=', icon: Icons.operatorLte, label: 'At most'},
  { operator: '>', icon: Icons.operatorGt, label: 'More than'},
  { operator: '<', icon: Icons.operatorLt, label: 'Less than'},
  { operator: '==', icon: Icons.operatorEq, label: 'Exactly'},
  { operator: '!=', icon: Icons.operatorNot, label: 'Not'},
];

type HabitPredicate = 'AND' | 'OR' | string;
const getHabitPredicateLabel = (predicate: string) => predicate === 'OR' ? 'Any' : 'All';
const getHabitPredicateIcon = (predicate: string) => predicate === 'OR' ? Icons.predicateOr : Icons.predicateAnd;

export {
  type Habit,
  createHabit,
  
  type HabitOperator,
  habitOperatorData,

  type HabitPredicate,
  getHabitPredicateLabel,
  getHabitPredicateIcon,
}