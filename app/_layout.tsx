
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
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Provider store={store}>
          <SafeAreaProvider>
            <ThemeProvider>
              <RootStack />
            </ThemeProvider>
          </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

const RootStack = () => {
  const [fontsLoaded] = useFonts({
    'FiraSans-Light': require('@a/fonts/FiraSans-Light.otf'),
    'FiraSans-Regular': require('@a/fonts/FiraSans-Regular.otf'),
    'FiraSans-Medium': require('@a/fonts/FiraSans-Medium.otf'),
    'FiraSans-SemiBold': require('@a/fonts/FiraSans-SemiBold.otf'),
    'FiraSans-Bold': require('@a/fonts/FiraSans-Bold.otf'),
    'FiraSans-LightItalic': require('@a/fonts/FiraSans-LightItalic.otf'),
    'FiraSans-Italic': require('@a/fonts/FiraSans-Italic.otf'),
    'FiraSans-MediumItalic': require('@a/fonts/FiraSans-MediumItalic.otf'),
    'FiraSans-SemiBoldItalic': require('@a/fonts/FiraSans-SemiBoldItalic.otf'),
    'FiraSans-BoldItalic': require('@a/fonts/FiraSans-BoldItalic.otf'),
    'Rubik-Light': require('@a/fonts/Rubik-Light.ttf'),
    'Rubik-Regular': require('@a/fonts/Rubik-Regular.ttf'),
    'Rubik-Medium': require('@a/fonts/Rubik-Medium.ttf'),
    'Rubik-Bold': require('@a/fonts/Rubik-Bold.ttf'),
    'Rubik-LightItalic': require('@a/fonts/Rubik-LightItalic.ttf'),
    'Rubik-Italic': require('@a/fonts/Rubik-Italic.ttf'),
    'Rubik-MediumItalic': require('@a/fonts/Rubik-MediumItalic.ttf'),
    'Rubik-BoldItalic': require('@a/fonts/Rubik-BoldItalic.ttf'),
    SpaceMono: require('@a/fonts/SpaceMono-Regular.ttf'),
  });

  const dispatch = useDispatch();
  const { loading, initialAuthCheckComplete } = useAuthState();

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (user) => {
  //     if (user) {
  //       dispatch(signInSuccess(serializeUser(user)));
  //     } else {
  //       dispatch(signOutSuccess());
  //     }
  //   });
    
  //   setTimeout(() => {
  //     dispatch(initialAuthCheckComplete());
  //   }, 1000);
    
  //   return () => unsubscribe();
  // }, [dispatch]);

  if (!fontsLoaded) return null;

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />          
        <Stack.Screen name="login" options={{ headerShown: false }} />               
        <Stack.Screen name="signout" options={{ headerShown: false }} />               
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        <Stack.Screen name="measurement" options={{ headerShown: false }} />
        <Stack.Screen name="habit" options={{ headerShown: false }} />
      </Stack>
      {loading || !initialAuthCheckComplete ? <LoadingScreen /> : null}
    </>
  )
};