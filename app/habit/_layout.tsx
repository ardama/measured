import Header from '@c/Header';
import { withAuth } from '@u/hocs/withAuth';
import { Stack } from 'expo-router';

function HabitsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >      
      <Stack.Screen
        name="create"
      />               
      <Stack.Screen
        name="[habitId]"
      />               
    </Stack>
  )
};

export default withAuth(HabitsLayout);