import { firestore } from '@/firebase';
import type { MeasurementType } from '@t/measurements';
import { collection, doc } from 'firebase/firestore';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const generateId = (collectionName: string): string => doc(collection(firestore, collectionName)).id;

export const forWeb = (webValue: any, defaultValue: any): any => {
  return Platform.OS === 'web' ? webValue : defaultValue;
}

export const formatValue = (value: number | null, type?: MeasurementType, unit?: string, withUnit?: boolean) => {
  if (value === null) return '';

  const isMinuteDuration = type === 'duration' || unit === 'minutes' || unit === 'minutes' || unit === 'min';
  const isHourDuration = unit === 'hours' || unit === 'hour' || unit === 'hr';
  const isTime = type === 'time' || unit === 'time';
  const isBool = type === 'bool';
  const isCount = !isMinuteDuration && !isHourDuration && !isTime && !isBool;

  const valueString = (
    isTime ? formatTime(value) :
    isMinuteDuration ? formatDuration(value) :
    isHourDuration ? formatDuration(value * 60) :
    isBool ? value ? 'yes' : 'no' :
    formatNumber(value)
  );

  const unitString = withUnit && unit && isCount ? ` ${unit}` : '';
  return `${valueString}${unitString}`;
}
export const formatNumber = (num: number, decimals: number = 2): string => {
  if (num < 10000) return Number(num.toFixed(decimals)).toString();
  
  const units = [
    { value: 1e9, symbol: 'B' },
    { value: 1e6, symbol: 'M' },
    { value: 1e3, symbol: 'k' }
  ];

  for (let { value, symbol } of units) {
    if (num >= value) {
      let formattedNum = (num / value).toPrecision(3);

      formattedNum = formattedNum.replace(/\.0+$/, '');
      return `${formattedNum}${symbol}`;
    }
  }

  return num.toPrecision(3);
}

export const formatTime = (hours: number): string => {
  // Calculate the total minutes
  const totalMinutes = hours * 60;

  // Compute the total days and adjusted minutes
  const totalDays = Math.floor(totalMinutes / 1440); // 1440 minutes in a day
  const adjustedMinutes = ((totalMinutes % 1440) + 1440) % 1440; // Ensure positive value

  // Compute the 24-hour format hour and minutes
  const hour24 = Math.floor(adjustedMinutes / 60);
  const minutes = Math.round(adjustedMinutes % 60);

  // Determine AM or PM
  const period = hour24 >= 12 ? 'pm' : 'am';

  // Convert to 12-hour format, adjusting midnight and noon
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;

  // Format minutes with leading zero if necessary
  const minutesStr = minutes.toString().padStart(2, '0');

  // Prepare the days over 24
  let dayString = '';
  if (totalDays > 0) {
      dayString = `+${totalDays}`;
  } else if (totalDays < 0) {
      dayString = `${totalDays}`;
  }

  // Return the formatted time string
  return `${hour12}:${minutesStr}${period}${dayString}`;
}

export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);

  const hoursString = h ? `${h}h ` : '';
  const minutesString = m ? `${m.toString().padStart(h ? 2 : 1, '0')}m` : '0m';

  return `${hoursString}${minutesString}`;
}


export const movingAverage = (data: number[], windowSize: number): (number | null)[] => {
  return data.map((_, index, array) => {
    if (!windowSize || windowSize > index + 1) return null;

    const windowData = array.slice(index - windowSize + 1, index + 1);
    const sum = windowData.reduce((acc, curr) => acc + curr, 0);
    return sum / windowSize;
  });
}

export const capitalize = (s: string) => {
  return `${s.slice(0, 1).toUpperCase()}${s.slice(1)}`;
}

export const removeUndefined = (obj: object) => {
  const o = Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
  return o;
}

export const range = (start: number, end: number) => {
  const res = [];
  let current = start;
  while (current < end) {
    res.push(current);
    current++;
  }
  return res;
}

export const intersection = (setA: Set<any>, setB: Set<any>) => {
  return new Set([...setA].filter(element => setB.has(element)));
}

export const round = (number: number, places: number = 0) => {
  const base = 10 ** places;
  return Math.round(number * base) / base;
}

export const triggerHaptic = async (type: 'impact' | 'notification' | 'selection', style?: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType) => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      if (type === 'impact') {
        await Haptics.impactAsync(style as Haptics.ImpactFeedbackStyle);
      } else if (type === 'notification') {
        await Haptics.notificationAsync(style as Haptics.NotificationFeedbackType);
      } else if (type === 'selection') {
        await Haptics.selectionAsync();
      }
    } catch (error) {
      console.log('Haptics not available:', error);
    }
  }
};