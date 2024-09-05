import { Platform } from 'react-native';

export const generateId = (): string => Math.random().toString(36).substring(2, 9);

export const forWeb = (webValue: any, defaultValue: any): any => {
  return Platform.OS === 'web' ? webValue : defaultValue;
}
