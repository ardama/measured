import { generateId } from "@/utils/helpers";

interface Habit {
  id: string;
  userId: string;
  measurementId: string;
  name: string;
  operator: HabitOperator;
  daily: number;
  weekly: number | undefined;
  daysPerWeek: number;
  points: number;
}

const createHabit = (userId: string, measurementId: string, name: string, operator: HabitOperator, daily: number = -1, weekly: number = -1, daysPerWeek: number = 7, points: number = 1): Habit => ({
  id: generateId(),
  userId,
  measurementId,
  name,
  operator,
  daily,
  weekly,
  daysPerWeek,
  points,
});

type HabitOperator = '>=' | '<=' |'>' | '<' | '==' | '!=';

const habitOperatorData: { operator: HabitOperator, icon: string, label: string }[] = [
  { operator: '>=', icon: 'code-greater-than-or-equal', label: 'At least'},
  { operator: '<=', icon: 'code-less-than-or-equal', label: 'At most'},
  { operator: '>', icon: 'code-greater-than', label: 'More than'},
  { operator: '<', icon: 'code-less-than', label: 'Less than'},
  { operator: '==', icon: 'code-equal', label: 'Exactly'},
  { operator: '!=', icon: 'code-not-equal', label: 'Not'},
]
export {
  type Habit,
  createHabit,
  
  type HabitOperator,
  habitOperatorData,
}