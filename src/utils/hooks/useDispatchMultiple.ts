import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { type Action } from 'redux';

type AnyAction = Action<string> & { [key: string]: any };

// Define the action type
export const DISPATCH_MULTIPLE = 'DISPATCH_MULTIPLE' as const;

export interface DispatchMultipleAction extends Action<typeof DISPATCH_MULTIPLE> {
  payload: AnyAction[];
}

// Hook to use in components
export const useDispatchMultiple = () => {
  const dispatch = useDispatch();
  
  const dispatchMultiple = useCallback((actions: AnyAction[]) => {
    dispatch({ type: DISPATCH_MULTIPLE, payload: actions });
  }, [dispatch]);

  return dispatchMultiple;
};