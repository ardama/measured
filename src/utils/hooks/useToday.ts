import { useMemo } from 'react';
import { SimpleDate } from '../dates';

export function useToday() {
  return useMemo(() => SimpleDate.today(), [
    new Date().getTimezoneOffset(),
    new Date().toDateString()
  ]);
} 