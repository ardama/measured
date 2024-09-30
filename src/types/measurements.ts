import { generateId } from "@/utils/helpers";
import type { Recording } from '@t/recording';
import { Icons } from '@u/constants/Icons';

interface Measurement {
  id: string;
  userId: string;
  type: MeasurementType;
  activity: string;
  variant: string;
  unit: string;
  step: number;
  defaultValue: number;
  priority: number,
  archived: boolean;
  comboLeftId?: string,
  comboRightId?: string,
  comboOperator?: MeasurementOperator,
}

const createMeasurement = (userId: string, activity: string, variant: string, type: MeasurementType, unit: string, step: number, priority: number): Measurement => ({
  id: generateId(),
  userId,
  activity,
  variant,
  type,
  unit,
  step,
  defaultValue: 0,
  priority,
  archived: false,
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

type MeasurementType = 'duration' | 'time' | 'count' | 'bool' | 'combo';

const measurementTypes: MeasurementType[] = ['duration', 'time', 'count', 'bool', 'combo'];

type MeasurementTypeData = { icon: string, label: string };
const measurementTypeData: {
  duration: MeasurementTypeData,
  time: MeasurementTypeData,
  count: MeasurementTypeData,
  bool: MeasurementTypeData,
  combo: MeasurementTypeData,
} = {
  duration: { label: 'Duration', icon: Icons.measurementTypeDuration },
  time: { label: 'Time', icon: Icons.measurementTypeTime },
  count: { label: 'Count', icon: Icons.measurementTypeCount },
  bool: { label: 'Yes / No', icon: Icons.measurementTypeBool },
  combo: { label: 'Combo', icon: Icons.measurementTypeCombo },
};

const getMeasurementTypeData = (type: (MeasurementType | undefined)): MeasurementTypeData => {
  return measurementTypeData[type || 'count'];
}

const getMeasurementTypeLabel = (type: (MeasurementType | undefined)): string => {
  return measurementTypeData[type || 'count'].label;
}

const getMeasurementTypeIcon = (type: (MeasurementType | undefined)): string => {
  return measurementTypeData[type || 'count'].icon;
}

type MeasurementOperator = '+' | '-' | '*' | '/';
const measurementOperators: MeasurementOperator[] = ['+', '-', '*', '/'];

type MeasurementOperatorData = { icon: string, label: string };
const measurementOperatorData: {
  ['+']: MeasurementOperatorData,
  ['-']: MeasurementOperatorData,
  ['*']: MeasurementOperatorData,
  ['/']: MeasurementOperatorData,
} = {
  '+': { label: 'Plus', icon: Icons.measurementOperatorAdd },
  '-': { label: 'Minus', icon: Icons.measurementOperatorSubtract },
  '*': { label: 'Times', icon: Icons.measurementOperatorMultiply },
  '/': { label: 'Over', icon: Icons.measurementOperatorDivide },
};

const getMeasurementOperatorData = (operator: (MeasurementOperator | undefined)): MeasurementOperatorData => {
  return measurementOperatorData[operator || '+'];
}

const getMeasurementRecordingValue = (measurementId: (string | undefined), measurements: Measurement[], recording: Recording): number => {
  const measurement = measurements.find(({ id }) => id === measurementId);
  if (!measurement) return 0;

  const isCombo = measurement.type === 'combo';
  if (isCombo) {
    const leftValue = getMeasurementRecordingValue(measurement.comboLeftId, measurements, recording);
    const rightValue = getMeasurementRecordingValue(measurement.comboRightId, measurements, recording);
    switch (measurement.comboOperator) {
      case '+': return leftValue + rightValue;
      case '-': return leftValue - rightValue;
      case '*': return leftValue * rightValue;
      case '/': return leftValue / rightValue;
    }
    return 0;
  }

  const data = recording.data.find(({ measurementId }) => measurementId === measurement.id);
  return data?.value || 0;
}

export {
  type Measurement,
  createMeasurement,

  type MeasurementUnit,
  createMeasurementUnit,
  generateDefaultMeasurementUnits,
  generateDefaultEmptyUnit,

  defaultMeasurementUnits,
  
  type MeasurementType,
  measurementTypes,
  getMeasurementTypeData,
  getMeasurementTypeLabel,
  getMeasurementTypeIcon,

  type MeasurementOperator,
  measurementOperators,
  getMeasurementOperatorData,

  getMeasurementRecordingValue,
};