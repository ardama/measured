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
          title: 'Create habit',
        }}
      />               
      <Stack.Screen
        name="[habitId]"
        options={{
          title: 'Edit habit',
        }}
      />               
    </Stack>
  )
};