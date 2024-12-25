import Header from '@c/Header';
import { withUser } from '@u/hocs/withUser';
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

export default withUser(HabitsLayout);