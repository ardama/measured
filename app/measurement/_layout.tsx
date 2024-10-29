import Header from '@c/Header';
import { withAuth } from '@u/hocs/withAuth';
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

export default withAuth(MeasurementsLayout);