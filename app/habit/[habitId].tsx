import HabitForm from '@c/HabitForm';
import Header from '@c/Header';
import { useHabit } from '@s/selectors';
import { withAuth } from '@u/hocs/withAuth';
import { router, useLocalSearchParams } from 'expo-router';

const HabitEditScreen = () => {
  const { habitId } = useLocalSearchParams();
  const parsedId = Array.isArray(habitId) ? habitId.join('') : habitId;
  const habit = useHabit(parsedId);

  if (!habit) {
    setTimeout(() => {
      router.canGoBack() ? router.back() : router.replace('/');
    }, 0);
    return null;
  }
  return (
    <>
      <HabitForm habit={habit} formType={'edit'} />
    </>
  )
}

export default withAuth(HabitEditScreen);