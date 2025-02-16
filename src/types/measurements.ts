import { generateId } from "@/utils/helpers";
import type { BaseColor } from '@u/colors';
import { Collections } from '@u/constants/Firestore';
import { Icons } from '@u/constants/Icons';
import type { SimpleDate } from '@u/dates';

type Measurement = {
  id: string
  userId: string
  type: MeasurementType
  name: string
  category: string
  unit: string
  step: number
  initial: number
  priority: number,
  archived: boolean
  comboLeftId?: string
  comboRightId?: string
  comboOperator?: MeasurementOperator
  recordings: MeasurementRecording[]
  notes: MeasurementNote[]
  baseColor?: BaseColor
}

type FormMeasurement = {
  step: string;
  id: string;
  userId: string;
  type: MeasurementType;
  name: string;
  category: string;
  unit: string;
  archived: boolean;
  initial: string,
  priority: number,
  comboLeftId?: string,
  comboRightId?: string,
  comboOperator?: MeasurementOperator,
  recordings: MeasurementRecording[],
  notes: MeasurementNote[],
  hue?: number
  baseColor?: BaseColor,
};

const createMeasurement = (userId: string, name: string, category: string, type: MeasurementType, unit: string, step: number, priority: number): Measurement => ({
  id: generateId(Collections.Measurements),
  userId,
  name,
  category,
  type,
  unit,
  step,
  initial: 0,
  priority,
  archived: false,
  recordings: [],
  notes: [],
});

const emptyMeasurement = (): Measurement => ({
  id: '',
  userId: '',
  type: '',
  name: '',
  category: '',
  unit: '',
  step: 0,
  initial: 0,
  priority: 0,
  archived: false,
  recordings: [],
  notes: [],
})

type MeasurementType = '' | 'duration' | 'time' | 'count' | 'bool' | 'combo';

const measurementTypes: MeasurementType[] = ['duration', 'time', 'count', 'bool', 'combo'];

type MeasurementTypeData = {
  icon: string
  label: string
  description: string
  examples: string
  namePlaceholder: string
  categoryPlaceholder: string
};
const measurementTypeData: {
  duration: MeasurementTypeData
  time: MeasurementTypeData
  count: MeasurementTypeData
  bool: MeasurementTypeData
  combo: MeasurementTypeData
} = {
  duration: {
    label: 'Duration', icon: Icons.measurementTypeDuration,
    description: 'How much time you spent doing something.',
    examples: 'Hours slept, minutes of cardio, time spent meditating, etc.',
    namePlaceholder: '',
    categoryPlaceholder: '',
  },
  time: {
    label: 'Time', icon: Icons.measurementTypeTime,
    description: 'What time you did something at.',
    examples: 'Bed time, wake up time, etc.',
    namePlaceholder: '',
    categoryPlaceholder: '',
  },
  count: {
    label: 'Count', icon: Icons.measurementTypeCount,
    description: 'How much of something you did.',
    examples: 'Steps walked, calories consumed, pages read, etc.',
    namePlaceholder: '',
    categoryPlaceholder: '',
  },
  bool: {
    label: 'Yes / No', icon: Icons.measurementTypeBool,
    description: 'Whether or not you did something.',
    examples: 'Took vitamins, called a friend, etc.',
    namePlaceholder: '',
    categoryPlaceholder: '',
  },
  combo: {
    label: 'Combo', icon: Icons.measurementTypeCombo,
    description: 'Combination of multiple measurements into one.',
    examples: 'Total workout time, total social media time, etc.',
    namePlaceholder: '',
    categoryPlaceholder: '',
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
  ['+']: MeasurementOperatorData
  ['-']: MeasurementOperatorData
  ['*']: MeasurementOperatorData
  ['/']: MeasurementOperatorData
} = {
  '+': { label: 'Plus', action: 'Add', operator: '+', icon: Icons.measurementOperatorAdd },
  '-': { label: 'Minus', action: 'Subtract', operator: '-', icon: Icons.measurementOperatorSubtract },
  '*': { label: 'Times', action: 'Multiply', operator: '×', icon: Icons.measurementOperatorMultiply },
  '/': { label: 'Over', action: 'Divide', operator: '÷', icon: Icons.measurementOperatorDivide },
};

const getMeasurementOperatorData = (operator: (MeasurementOperator | undefined)): MeasurementOperatorData => {
  return measurementOperatorData[operator || '+'];
}

type MeasurementRecording = { date: string, value: number | null };
type MeasurementNote = { date: string, content: string };

const getMeasurementRecordingValue = (
  measurementId: (string | undefined), date: SimpleDate, measurements: Measurement[],
  recordingData?: Map<string, Map<string, number | null>>, visited?: string[]
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

const getMeasurementStartDate = (measurementId: (string | undefined), measurements: Measurement[], recordingData?: Map<string, Map<string, number | null>>) => {
  if (!measurementId) return null;
  const measurement = measurements.find((m) => m.id === measurementId);
  if (!measurement) return null;
  
  const recordingDataMap = recordingData || new Map(measurements.map(({ id, recordings }) => [id, new Map(recordings.map(({ date, value }) => [date, value]))]));
  let entries = [...(recordingDataMap.get(measurementId)?.entries() || [])];
  
  const isCombo = measurement?.type === 'combo';
  if (isCombo) {
    const left = measurements.find((m) => m.id === measurement.comboLeftId);
    const right = measurements.find((m) => m.id === measurement.comboRightId);
    if (!left && !right) return null;

    const leftEntries = (measurement.comboLeftId && recordingDataMap.get(measurement.comboLeftId)?.entries()) || [];
    const rightEntries = (measurement.comboRightId && recordingDataMap.get(measurement.comboRightId)?.entries()) || [];
    entries = [...leftEntries, ...rightEntries];
  }

  const dates = entries.filter(([_, value]) => value !== null).map(([date, _]) => date);
  dates.sort();
  return dates[0] || null;
}

const getDateRecordings = (measurements: Measurement[], date: SimpleDate): MeasurementRecording[] => {
  const dateString = date.toString();
  return measurements.map(({ recordings }) => {
    return recordings.find((recording) => recording.date === dateString);
  }).filter((recording) => recording !== undefined);
};

export {
  type Measurement,
  type FormMeasurement,
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
  getMeasurementStartDate,
  getDateRecordings,
};