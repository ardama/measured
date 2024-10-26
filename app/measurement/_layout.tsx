import Header from '@c/Header';
import { Stack } from 'expo-router';

export default function MeasurementsLayout() {
  return (
    <Stack
      screenOptions={{
        header: ({ options }) => {
          const { title } = options;
          return (
            <Header showBackButton title={title} />
          )
        }
      }}
    >      
      <Stack.Screen
        name="create"
        options={{
          title: 'Create measurement',
        }}
      />               
      <Stack.Screen
        name="[measurementId]"
        options={{
          title: 'Edit measurement',
        }}
      />               
    </Stack>
  )
};