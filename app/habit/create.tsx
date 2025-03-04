import HabitForm from '@c/HabitForm';
import Header from '@c/Header';
import { callCreateMeasurement } from '@s/dataReducer';
import { useComputedHabits, useMeasurements } from '@s/selectors';
import { computeHabit, createInitialHabit } from '@t/habits';
import { createMeasurement } from '@t/measurements';
import { withUser } from '@u/hocs/withUser';
import { useAuth } from '@u/hooks/useAuth';
import { useSearchParams } from 'expo-router/build/hooks';
import { useDispatch } from 'react-redux';

const HabitCreateScreen = () => {
  const auth = useAuth();
  const measurements = useMeasurements();
  const habits = useComputedHabits();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();

  let measurement = measurements.length ? measurements[0] : null;
  if (!measurement) {
    measurement = createMeasurement(auth?.user?.uid || '', 'Sample measurement', '', 'duration', 'min', 15, 1);
    dispatch(callCreateMeasurement(measurement));
  }

  const userId = auth?.user?.uid || '';
  const name = searchParams.get('name') || '';
  const category = searchParams.get('category') || '';
  const baseColor = searchParams.get('baseColor') || '';
  const measurementId = searchParams.get('measurementId') || '';
  const target = parseInt(searchParams.get('target') || '0', 10);

  const priority = 1 + (habits[habits.length - 1]?.priority || 0);
  const habit = createInitialHabit(
    userId,
    name,
    category,
    baseColor,
    measurementId ? [{
      measurementId,
      operator: '>=',
      target: target,
    }] : [],
    priority,
  );
  const computedHabit = computeHabit(habit);

  return (
    <>
      <HabitForm habit={computedHabit} formType={'create'} />
    </>
  )
}

export default withUser(HabitCreateScreen);