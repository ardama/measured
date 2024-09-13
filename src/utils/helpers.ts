import { Platform } from 'react-native';

export const generateId = (): string => Math.random().toString(36).substring(2, 9);

export const forWeb = (webValue: any, defaultValue: any): any => {
  return Platform.OS === 'web' ? webValue : defaultValue;
}

export const formatNumber = (num: number): string => {
  if (num < 10000) return num.toString();
  
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

export const movingAverage = (data: number[], windowSize: number): (number | null)[] => {
  return data.map((_, index, array) => {
    const adjustedWindowSize = Math.min(windowSize, index + 1);

    const windowData = array.slice(index - adjustedWindowSize + 1, index + 1);
    const sum = windowData.reduce((acc, curr) => acc + curr, 0);
    return sum / adjustedWindowSize;
  });
}