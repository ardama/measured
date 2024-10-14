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

interface MeasurementUnit {
  id: string;
  label: string;
  abbreviation: string;
  types: MeasurementType[];
  isDefault: boolean,
  isDeletable: boolean,
}

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

type MeasurementRecording = { date: string, value: number };

const getMeasurementRecordingValue = (measurementId: (string | undefined), date: SimpleDate, measurements: Measurement[]): number | null => {
  const measurement = measurements.find(({ id }) => id === measurementId);
  if (!measurement) return null;

  const isCombo = measurement.type === 'combo';
  if (isCombo) {
    const leftValue = getMeasurementRecordingValue(measurement.comboLeftId, date, measurements) || 0;
    const rightValue = getMeasurementRecordingValue(measurement.comboRightId, date, measurements) || 0;
    switch (measurement.comboOperator) {
      case '+': return leftValue + rightValue;
      case '-': return leftValue - rightValue;
      case '*': return leftValue * rightValue;
      case '/': return leftValue / rightValue;
    }
    return null;
  }

  const data = measurement.recordings.find((recording) => recording.date === date.toString());
  return data?.value === undefined ? null : data.value;
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