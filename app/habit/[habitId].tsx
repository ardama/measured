import HabitForm from '@c/HabitForm';
import Header from '@c/Header';
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
  if (loading || !initialAuthCheckComplete) return <LoadingScreen />;

  if (!habit) {
    setTimeout(() => {
      router.canGoBack() ? router.back() : router.replace('/');
    }, 250);
    return <LoadingScreen />;
  }
  return (
    <>
      <HabitForm habit={habit} formType={'edit'} />
    </>
  )
}

export default withAuth(HabitEditScreen);