
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { Portal } from 'react-native-paper';
import { Provider, useDispatch } from 'react-redux';

import { store } from '@s/utils';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import ThemeProvider from '@c/ThemeProvider';
import { useAuthState } from '@s/selectors';
import { onAuthStateChanged } from 'firebase/auth';
import { initialAuthCheckComplete, signInSuccess, signOutSuccess } from '@s/authReducer';
import { auth } from '@/firebase';
import { serializeUser } from '@t/users';
import LoadingScreen from '@c/Loading';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootStack />
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}

const RootStack = () => {
  const [fontsLoaded] = useFonts({
    SpaceMono: require('@a/fonts/SpaceMono-Regular.ttf'),
  });

  const dispatch = useDispatch();
  const { loading, firstLoadComplete } = useAuthState();

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(signInSuccess(serializeUser(user)));
      } else {
        dispatch(signOutSuccess());
      }
    });
    
    setTimeout(() => {
      dispatch(initialAuthCheckComplete());
    }, 1000);
    
    return () => unsubscribe();
  }, [dispatch]);

  if (!fontsLoaded) return null;

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />          
        <Stack.Screen name="login" options={{ headerShown: false }} />               
        <Stack.Screen name="signout" options={{ headerShown: false }} />               
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack>
      {loading || !firstLoadComplete ? <LoadingScreen /> : null}
    </>
  )
};