import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@u/hooks/useColorScheme';
import { PaperProvider } from 'react-native-paper';
import { Provider } from 'react-redux';

import { store } from '@s/utils';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('@a/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Provider store={store}>
        <SafeAreaProvider>
          <PaperProvider>
            <Stack>
              <Stack.Screen name="(root)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
          </PaperProvider>
        </SafeAreaProvider>
      </Provider>
    </ThemeProvider>
  );
}
