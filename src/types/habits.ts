import { generateId } from "@/utils/helpers";
import type { Measurement } from '@t/measurements';
import type { User } from '@t/users';

interface Habit {
  id: string;
  name: string;
  operator: HabitOperator;
  target: number;
  user: User;
  measurement: Measurement;
}

const createHabit = (user: User, measurement: Measurement, name: string, operator: HabitOperator, target: number): Habit => ({
  id: generateId(),
  user,
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