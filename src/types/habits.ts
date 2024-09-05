import { generateId } from "@/utils/helpers";
import type { Measurement } from '@t/measurements';

interface Habit {
  id: string;
  userId: string;
  measurement: Measurement;
  name: string;
  operator: HabitOperator;
  daily: number | undefined;
  weekly: number | undefined;
  daysPerWeek: number;
  points: number;
}

const createHabit = (userId: string, measurement: Measurement, name: string, operator: HabitOperator, daily: number = -1, weekly: number = -1, daysPerWeek: number = 7, points: number = 1): Habit => ({
  id: generateId(),
  userId,
  measurement,
  name,
  operator,
  daily,
  weekly,
  daysPerWeek,
  points,
});

type HabitOperator = '>' | '<' | '>=' | '<=' | '==' | '!=';

const habitOperatorData: { operator: HabitOperator, icon: string, label: string }[] = [
  { operator: '>', icon: 'code-greater-than', label: 'Greater than'},
  { operator: '<', icon: 'code-less-than', label: 'Less than'},
  { operator: '>=', icon: 'code-greater-than-or-equal', label: 'Greater than or equal to'},
  { operator: '<=', icon: 'code-less-than-or-equal', label: 'Less than or equal to'},
  { operator: '==', icon: 'code-equal', label: 'Equal to'},
  { operator: '!=', icon: 'code-not-equal', label: 'Not equal to'},
]
export {
  type Habit,
  createHabit,
  
  type HabitOperator,
  habitOperatorData,
}