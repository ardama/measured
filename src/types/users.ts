import { generateId } from "@/utils/helpers";
import type { Habit, HabitUpdate } from '@t/habits';
import { generateDefaultMeasurementUnits, type Measurement, type MeasurementUnit } from '@t/measurements';
import type { Recording } from '@t/recording';

interface User {
  id: string;
  name: string;
  email: string;
  measurements: Measurement[];
  recordings: Recording[],
  habitUpdates: HabitUpdate[],
}

const createUser = (name: string = "Guest", email: string = ""): User => ({
  id: generateId(),
  name,
  email,
  measurements: [],
  recordings: [],
  habitUpdates: [],
});

export {
  type User,

  createUser,
}
