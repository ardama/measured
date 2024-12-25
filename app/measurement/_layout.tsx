import Header from '@c/Header';
import { withUser } from '@u/hocs/withUser';
import { Stack } from 'expo-router';

function MeasurementsLayout() {
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
        name="[measurementId]"
      />               
    </Stack>
  )
};

export default withUser(MeasurementsLayout);