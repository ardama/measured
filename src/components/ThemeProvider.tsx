import React, { type PropsWithChildren } from 'react';
import {
  ThemeProvider as NavigationThemeProvider,
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import {
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
  adaptNavigationTheme,
} from 'react-native-paper';
import { useDarkMode } from '@s/selectors';

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const CombinedDefaultTheme = {
  ...MD3LightTheme,
  ...LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...LightTheme.colors,
  },
};
const CombinedDarkTheme = {
  ...MD3DarkTheme,
  ...DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...DarkTheme.colors,
  },
};

const ThemeProvider = (props: PropsWithChildren) => {
  const darkMode = useDarkMode();
  let theme = darkMode ? CombinedDarkTheme : CombinedDefaultTheme;

  return (
    <NavigationThemeProvider value={theme}>
      <PaperProvider theme={theme}>
        {props.children}
      </PaperProvider>
    </NavigationThemeProvider>
  )
}

export default ThemeProvider;