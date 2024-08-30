import { generateId } from "@/utils/helpers";
import type { Measurement } from '@t/measurements';
import type { User } from '@t/users';

interface Habit {
  id: string;
  userId: string;
  name: string;
  operator: HabitOperator;
  target: number;
  measurement: Measurement;
}

const createHabit = (userId: string, measurement: Measurement, name: string, operator: HabitOperator, target: number): Habit => ({
  id: generateId(),
  userId,
  measurement,
  name,
  operator,
  target,
});

type HabitOperator = '>' | '<' | '>=' | '<=' | '==' | '!=';

export {
  type Habit,
  type HabitOperator,

  createHabit,
}