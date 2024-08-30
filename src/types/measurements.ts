import { generateId } from "@/utils/helpers";
import type { User } from '@t/users';

interface Measurement {
  id: string;
  userId: string;
  type: MeasurementType;
  activity: string;
  variant: string;
  unit: MeasurementUnit;
  step: number;
  archived: boolean;
  recordings: MeasurementRecording[];
}

const createMeasurement = (userId: string, activity: string, variant: string, type: MeasurementType, unit: MeasurementUnit, step: number): Measurement => ({
  id: generateId(),
  userId,
  activity,
  variant,
  type,
  unit,
  step,
  archived: false,
  recordings: [],
});

interface MeasurementUnit {
  id: string;
  label: string;
  abbreviation: string | undefined;
  types: MeasurementType[];
}

const createMeasurementUnit = (label: string, abbreviation: string, types: MeasurementType[] = []): MeasurementUnit => ({
  id: generateId(),
  label,
  abbreviation,
  types,
});

const generateDefaultMeasurementUnits = () => [
  createMeasurementUnit('minutes', 'm', ['duration', 'time']),
  createMeasurementUnit('hours', 'h', ['duration', 'time']),

  createMeasurementUnit('times', 'times', ['count']),

  createMeasurementUnit('reps', 'reps', ['count']),
  createMeasurementUnit('sets', 'sets', ['count']),
  
  createMeasurementUnit('ounces', 'oz', ['count']),
  createMeasurementUnit('liters', 'l', ['count']),
  createMeasurementUnit('grams', 'g', ['count']),
  createMeasurementUnit('calories', 'kcal', ['count']),
]

interface MeasurementRecording {
  id: string;
  date: string;
  value: number;
}

const createMeasurementRecording = (date: Date, value: number): MeasurementRecording => ({
  id: generateId(),
  date: date.toISOString(),
  value,
});

type MeasurementType = 'duration' | 'time' | 'count' | 'bool';

const measurementTypeData: { type: MeasurementType, icon: string, label: string }[] = [
  { type: 'duration', label: 'Duration', icon: 'timer-outline' },
  { type: 'time', label: 'Time', icon: 'clock-outline' },
  { type: 'count', label: 'Count', icon: 'numeric-1-box-outline' },
  { type: 'bool', label: 'Yes / No', icon: 'checkbox-outline' },
]

export {
  type Measurement,
  createMeasurement,

  type MeasurementUnit,
  createMeasurementUnit,
  generateDefaultMeasurementUnits,

  type MeasurementRecording,
  createMeasurementRecording,
  
  type MeasurementType,
  measurementTypeData,
};