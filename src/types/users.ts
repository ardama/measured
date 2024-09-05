import { generateId } from "@/utils/helpers";
import type { Habit } from '@t/habits';
import { generateDefaultMeasurementUnits, type Measurement, type MeasurementUnit } from '@t/measurements';
import type { Recording } from '@t/recording';

interface User {
  id: string;
  name: string;
  email: string;
  measurements: Measurement[];
  measurementUnits: MeasurementUnit[];
  recordings: Recording[],
  habits: Habit[];
}

const createUser = (name: string = "Guest", email: string = ""): User => ({
  id: generateId(),
  name,
  email,
  measurements: [],
  measurementUnits: generateDefaultMeasurementUnits(),
  recordings: [],
  habits: [],
});

export {
  type User,

  createUser,
}
