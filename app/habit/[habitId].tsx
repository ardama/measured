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
    router.canGoBack() ? router.back() : router.replace('/');
    return null;
  }
  return (
    <>
      <Header showBackButton title={habit.name} />
      <HabitForm habit={habit} formType={'edit'} />
    </>
  )
}

export default withAuth(HabitEditScreen);