import { generateId } from "@/utils/helpers";
import type { User } from '@t/users';

interface Measurement {
  id: string;
  userId: string;
  type: MeasurementType;
  activity: string;
  variant: string;
  unit: string;
  step: number;
  archived: boolean;
  recordings: string[];
}

const createMeasurement = (userId: string, activity: string, variant: string, type: MeasurementType, unit: string, step: number): Measurement => ({
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
  abbreviation: string;
  types: MeasurementType[];
  isDefault: boolean,
  isDeletable: boolean,
}

const createMeasurementUnit = (label: string, abbreviation: string, types: MeasurementType[] = [], isDefault: boolean = false, isDeletable: boolean = true): MeasurementUnit => ({
  id: generateId(),
  label,
  abbreviation,
  types,
  isDefault,
  isDeletable,
});

const defaultMeasurementUnits: string[] = [
  '',
  'min',
  'hr',
  'times',
  'reps',
  'sets',
  'oz',
  'l',
  'g',
  'cal',
]
const generateDefaultMeasurementUnits = () => [
  generateDefaultEmptyUnit(),

  createMeasurementUnit('minutes', 'min', ['duration', 'time'], true, false),
  createMeasurementUnit('hours', 'hr', ['duration', 'time'], true, false),

  createMeasurementUnit('times', 'times', ['count'], true, false),

  createMeasurementUnit('reps', 'reps', ['count'], true),
  createMeasurementUnit('sets', 'sets', ['count'], true),
  
  createMeasurementUnit('ounces', 'oz', ['count'], true),
  createMeasurementUnit('liters', 'l', ['count'], true),
  createMeasurementUnit('grams', 'g', ['count'], true),
  createMeasurementUnit('calories', 'kcal', ['count'], true),
]

const generateDefaultEmptyUnit = () => createMeasurementUnit('(no unit)', '', ['duration', 'time', 'count', 'bool'], true, false);

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
  generateDefaultEmptyUnit,

  defaultMeasurementUnits,
  
  type MeasurementType,
  measurementTypeData,
};