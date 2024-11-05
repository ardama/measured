import HabitForm from '@c/HabitForm';
import Header from '@c/Header';
import { callCreateMeasurement } from '@s/dataReducer';
import { useComputedHabits, useMeasurements } from '@s/selectors';
import { computeHabit, createInitialHabit } from '@t/habits';
import { createMeasurement } from '@t/measurements';
import { withAuth } from '@u/hocs/withAuth';
import { useAuth } from '@u/hooks/useAuth';
import { useDispatch } from 'react-redux';

const HabitCreateScreen = () => {
  const auth = useAuth();
  const measurements = useMeasurements();
  const habits = useComputedHabits();
  const dispatch = useDispatch();

  let measurement = measurements.length ? measurements[0] : null;
  if (!measurement) {
    measurement = createMeasurement(auth?.user?.uid || '', 'Sample measurement', '', 'duration', 'min', 15, 1);
    dispatch(callCreateMeasurement(measurement));
  }

  const priority = 1 + (habits[habits.length - 1]?.priority || 0);
  const habit = createInitialHabit(auth?.user?.uid || '', '', [], priority);
  const computedHabit = computeHabit(habit);

  return (
    <>
      <HabitForm habit={computedHabit} formType={'create'} />
    </>
  )
}

export default withAuth(HabitCreateScreen);