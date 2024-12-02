import HabitForm from '@c/HabitForm';
import LoadingScreen from '@c/Loading';
import { useHabit } from '@s/selectors';
import { withAuth } from '@u/hocs/withAuth';
import { useAuth } from '@u/hooks/useAuth';
import { router, useLocalSearchParams } from 'expo-router';

const HabitEditScreen = () => {
  const { habitId } = useLocalSearchParams();
  const parsedId = Array.isArray(habitId) ? habitId.join('') : habitId;
  const habit = useHabit(parsedId);

  const { loading, initialAuthCheckComplete } = useAuth();

  if (!habit) {
    setTimeout(() => {
      router.canGoBack() ? router.back() : router.replace('/');
    }, 250);
  }

  return (
    <>
      {habit && <HabitForm habit={habit} formType={'edit'} />}
      <LoadingScreen visible={!habit || loading || !initialAuthCheckComplete} />
    </>
  )
}

export default withAuth(HabitEditScreen);