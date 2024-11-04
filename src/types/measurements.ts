import { generateId } from "@/utils/helpers";
import { Collections } from '@u/constants/Firestore';
import { Icons } from '@u/constants/Icons';
import type { SimpleDate } from '@u/dates';
import type { DocumentData } from 'firebase/firestore';

interface Measurement {
  id: string;
  userId: string;
  type: MeasurementType;
  name: string;
  variant: string;
  unit: string;
  step: number;
  initial: number;
  priority: number,
  archived: boolean;
  comboLeftId?: string,
  comboRightId?: string,
  comboOperator?: MeasurementOperator,
  recordings: MeasurementRecording[],
}

const createMeasurement = (userId: string, name: string, variant: string, type: MeasurementType, unit: string, step: number, priority: number): Measurement => ({
  id: generateId(Collections.Measurements),
  userId,
  name,
  variant,
  type,
  unit,
  step,
  initial: 0,
  priority,
  archived: false,
  recordings: [],
});

const emptyMeasurement = (): Measurement => ({
  id: '',
  userId: '',
  type: '',
  name: '',
  variant: '',
  unit: '',
  step: 0,
  initial: 0,
  priority: 0,
  archived: false,
  recordings: [],
})

type MeasurementType = '' | 'duration' | 'time' | 'count' | 'bool' | 'combo';

const measurementTypes: MeasurementType[] = ['duration', 'time', 'count', 'bool', 'combo'];

type MeasurementTypeData = {
  icon: string,
  label: string,
  description: string,
  namePlaceholder: string,
  variantPlaceholder: string,
};
const measurementTypeData: {
  duration: MeasurementTypeData,
  time: MeasurementTypeData,
  count: MeasurementTypeData,
  bool: MeasurementTypeData,
  combo: MeasurementTypeData,
} = {
  duration: {
    label: 'Duration', icon: Icons.measurementTypeDuration,
    description: 'How much time you spent doing something.',
    namePlaceholder: '',
    variantPlaceholder: '',
  },
  time: {
    label: 'Time', icon: Icons.measurementTypeTime,
    description: 'What time you did something at.',
    namePlaceholder: '',
    variantPlaceholder: '',
  },
  count: {
    label: 'Count', icon: Icons.measurementTypeCount,
    description: 'How much of something you did.',
    namePlaceholder: ', Eating',
    variantPlaceholder: '',
  },
  bool: {
    label: 'Yes / No', icon: Icons.measurementTypeBool,
    description: 'Whether or not you did something.',
    namePlaceholder: '',
    variantPlaceholder: '',
  },
  combo: {
    label: 'Combo', icon: Icons.measurementTypeCombo,
    description: 'Combination of multiple measurements into one.',
    namePlaceholder: '',
    variantPlaceholder: '',
  },
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

type MeasurementOperatorData = { icon: string, label: string, action: string, operator: string, };
const measurementOperatorData: {
  ['+']: MeasurementOperatorData,
  ['-']: MeasurementOperatorData,
  ['*']: MeasurementOperatorData,
  ['/']: MeasurementOperatorData,
} = {
  '+': { label: 'Plus', action: 'Add', operator: '+', icon: Icons.measurementOperatorAdd },
  '-': { label: 'Minus', action: 'Subtract', operator: '-', icon: Icons.measurementOperatorSubtract },
  '*': { label: 'Times', action: 'Multiply', operator: '×', icon: Icons.measurementOperatorMultiply },
  '/': { label: 'Over', action: 'Divide', operator: '÷', icon: Icons.measurementOperatorDivide },
};

const getMeasurementOperatorData = (operator: (MeasurementOperator | undefined)): MeasurementOperatorData => {
  return measurementOperatorData[operator || '+'];
}

type MeasurementRecording = { date: string, value: number };

const getMeasurementRecordingValue = (
  measurementId: (string | undefined), date: SimpleDate, measurements: Measurement[],
  recordingData?: Map<string, Map<string, number>>, visited?: string[]
): number | null => {
  if (!measurementId) return null;
  const measurement = measurements.find(({ id }) => id === measurementId);
  if (!measurement) return null;

  const recordingDataMap = recordingData || new Map(measurements.map(({ id, recordings }) => [id, new Map(recordings.map(({ date, value }) => [date, value]))]));

  const isCombo = measurement.type === 'combo';
  if (isCombo) {
    if (visited && visited.indexOf(measurementId) >= 0) return null;

    const leftValue = getMeasurementRecordingValue(measurement.comboLeftId, date, measurements, recordingDataMap, [...visited || [], measurementId]);
    const rightValue = getMeasurementRecordingValue(measurement.comboRightId, date, measurements, recordingDataMap, [...visited || [], measurementId]);
    if (leftValue === null && rightValue === null) return null;

    const left = leftValue || 0;
    const right = rightValue || 0;
    switch (measurement.comboOperator) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return left / right;
    }
    return null;
  }

  const value = recordingDataMap.get(measurementId)?.get(date.toString());
  return value === undefined ? null : value;
}

const getDateRecordings = (measurements: Measurement[], date: SimpleDate): MeasurementRecording[] => {
  const dateString = date.toString();
  return measurements.map(({ recordings }) => {
    return recordings.find((recording) => recording.date === dateString);
  }).filter((recording) => recording !== undefined);
};

export {
  type Measurement,
  createMeasurement,
  emptyMeasurement,

  type MeasurementType,
  measurementTypes,
  getMeasurementTypeData,
  getMeasurementTypeLabel,
  getMeasurementTypeIcon,

  type MeasurementOperator,
  measurementOperators,
  getMeasurementOperatorData,

  type MeasurementRecording,
  getMeasurementRecordingValue,
  getDateRecordings,
};