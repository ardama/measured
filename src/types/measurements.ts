import { generateId } from "@/utils/helpers";
import type { User } from '@t/users';

interface Measurement {
  id: string;
  type: MeasurementType;
  activity: string;
  variant: string;
  unit: MeasurementUnit;
  step: number;
  user: User;
  recordings: { date: Date; recording: MeasurementRecording; }[];
}

const createMeasurement = (user: User, activity: string, variant: string, type: MeasurementType, unit: MeasurementUnit, step: number): Measurement => ({
  id: generateId(),
  user,
  activity,
  variant,
  type,
  unit,
  step,
  recordings: [],
});

interface MeasurementUnit {
  id: string;
  label: string;
  abbreviation: string;
  types: MeasurementType[];
}

const createMeasurementUnit = (label: string, abbreviation: string): MeasurementUnit => ({
  id: generateId(),
  label,
  abbreviation,
  types: [],
});

interface MeasurementRecording {
  id: string;
  date: Date;
  value: number;
}

const createMeasurementRecording = (date: Date, value: number): MeasurementRecording => ({
  id: generateId(),
  date,
  value,
});

type MeasurementType = 'duration' | 'time' | 'count' | 'bool';

export {
  type Measurement,
  type MeasurementUnit,
  type MeasurementType,

  createMeasurement,
  createMeasurementUnit,
  createMeasurementRecording,
};