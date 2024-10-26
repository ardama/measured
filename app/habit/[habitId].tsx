import HabitForm from '@c/HabitForm';
import { useHabit } from '@s/selectors';
import { router, useLocalSearchParams } from 'expo-router';

const HabitEditScreen = () => {
  const { habitId } = useLocalSearchParams();
  const parsedId = Array.isArray(habitId) ? habitId.join('') : habitId;
  const habit = useHabit(parsedId);

  if (!habit) {
    router.canGoBack() ? router.back() : router.replace('/');
    return null;
  }
  return (
    <HabitForm habit={habit} formType={'edit'} />
  )
}

export default HabitEditScreen;