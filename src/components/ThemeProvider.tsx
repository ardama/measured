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
import { useAccount } from '@s/selectors';
import { textStyles } from '@u/styles';
import { generateStandardPalette } from '@u/colors';

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const CustomTheme = {
  fonts: {
    default: {
      ...textStyles.light,
    },
    bodySmall: {
      ...textStyles.light,
    },
    bodyMedium: {
      ...textStyles.light,
    },
    bodyLarge: {
      ...textStyles.light,
    },

    labelSmall: {
      ...textStyles.regular,
    },
    labelMedium: {
      ...textStyles.regular,
    },
    labelLarge: {
      ...textStyles.regular,
    },

    titleSmall: {
      ...textStyles.regular,
    },
    titleMedium: {
      ...textStyles.regular,
    },
    titleLarge: {
      ...textStyles.regular,
    },

    headlineSmall: {
      ...textStyles.medium,
    },
    headlineMedium: {
      ...textStyles.medium,
    },
    headlineLarge: {
      ...textStyles.medium,
    },

    displaySmall: {
      ...textStyles.medium,
    },
    displayMedium: {
      ...textStyles.medium,
    },
    displayLarge: {
      ...textStyles.medium,
    },

  }
}

const CustomLightTheme = {
  "colors": {
    "primary": "#006874",
    "surfaceTint": "#006874",
    "onPrimary": "#FFFFFF",
    "primaryContainer": "#9EEFFD",
    "onPrimaryContainer": "#001F24",
    "secondary": "#266489",
    "onSecondary": "#FFFFFF",
    "secondaryContainer": "#C9E6FF",
    "onSecondaryContainer": "#001E2F",
    "tertiary": "#68548E",
    "onTertiary": "#FFFFFF",
    "tertiaryContainer": "#EBDDFF",
    "onTertiaryContainer": "#230F46",
    "error": 'hsl(0, 100%, 73%)',
    "onError": "#FFFFFF",
    "errorContainer": "#FFDAD6",
    "onErrorContainer": "#410002",
    "background": "#F5FAFB",
    "onBackground": "#171D1E",
    "surface": "#F5FAFB",
    "onSurface": "#171D1E",
    "surfaceVariant": "#DBE4E6",
    "onSurfaceVariant": "#3F484A",
    "outline": "#6F797A",
    "outlineVariant": "#BFC8CA",
    "shadow": "#000000",
    "scrim": "#000000",
    "inverseSurface": "#2B3133",
    "inverseOnSurface": "#ECF2F3",
    "inversePrimary": "#82D3E0",
    "primaryFixed": "#9EEFFD",
    "onPrimaryFixed": "#001F24",
    "primaryFixedDim": "#82D3E0",
    "onPrimaryFixedVariant": "#004F58",
    "secondaryFixed": "#C9E6FF",
    "onSecondaryFixed": "#001E2F",
    "secondaryFixedDim": "#95CDF7",
    "onSecondaryFixedVariant": "#004B6F",
    "tertiaryFixed": "#EBDDFF",
    "onTertiaryFixed": "#230F46",
    "tertiaryFixedDim": "#D3BCFD",
    "onTertiaryFixedVariant": "#503D74",
    "surfaceDim": "#D5DBDC",
    "surfaceBright": "#F5FAFB",
    "surfaceContainerLowest": "#FFFFFF",
    "surfaceContainerLow": "#EFF5F6",
    "surfaceContainer": "#E9EFF0",
    "surfaceContainerHigh": "#E3E9EA",
    "surfaceContainerHighest": "#DEE3E5",
    "elevation": {
      "level0": "transparent",
      "level1": "#FFFFFF",
      "level2": "#EFF5F6",
      "level3": "#E9EFF0",
      "level4": "#E3E9EA",
      "level5": "#DEE3E5",
    },
    "surfaceDisabled": "rgba(25, 28, 25, 0.12)",
    "onSurfaceDisabled": "rgba(25, 28, 25, 0.38)",
    "backdrop": "rgba(43, 50, 44, 0.4)",
  }
};

const CustomDarkTheme = {
  "colors": {
    "primary": "#82D3E0",
    "surfaceTint": "#82D3E0",
    "onPrimary": "#00363D",
    "primaryContainer": "#004F58",
    "onPrimaryContainer": "#9EEFFD",
    "secondary": "#95CDF7",
    "onSecondary": "#00344E",
    "secondaryContainer": "#004B6F",
    "onSecondaryContainer": "#C9E6FF",
    "tertiary": "#D3BCFD",
    "onTertiary": "#39265C",
    "tertiaryContainer": "#503D74",
    "onTertiaryContainer": "#EBDDFF",
    "error": "hsl(0, 100%, 73%)",
    "onError": "#690005",
    "errorContainer": "#93000A",
    "onErrorContainer": "#FFDAD6",
    "background": "#020202",
    "onBackground": "#DEE3E5",
    "surface": "#020202",
    "onSurface": "#DEE3E5",
    "surfaceVariant": "#3F484A",
    "onSurfaceVariant": "#BFC8CA",
    "outline": "#899294",
    "outlineVariant": "#3F484A",
    "shadow": "#000000",
    "scrim": "#000000",
    "inverseSurface": "#DEE3E5",
    "inverseOnSurface": "#2B3133",
    "inversePrimary": "#006874",
    "primaryFixed": "#9EEFFD",
    "onPrimaryFixed": "#001F24",
    "primaryFixedDim": "#82D3E0",
    "onPrimaryFixedVariant": "#004F58",
    "secondaryFixed": "#C9E6FF",
    "onSecondaryFixed": "#001E2F",
    "secondaryFixedDim": "#95CDF7",
    "onSecondaryFixedVariant": "#004B6F",
    "tertiaryFixed": "#EBDDFF",
    "onTertiaryFixed": "#230F46",
    "tertiaryFixedDim": "#D3BCFD",
    "onTertiaryFixedVariant": "#503D74",
    "surfaceDim": "#0E1415",
    "surfaceBright": "#343A3B",
    "surfaceContainerLowest": "#090F10",
    "surfaceContainerLow": "#171D1E",
    "surfaceContainer": "#1B2122",
    "surfaceContainerHigh": "#252B2C",
    "surfaceContainerHighest": "#303637",
    "elevation": {
      "level0": "transparent",
      "level1": "#090F10",
      "level2": "#171D1E",
      "level3": "#1B2122",
      "level4": "#252B2C",
      "level5": "#303637"
    },
    "surfaceDisabled": "rgba(225, 226, 229, 0.12)",
    "onSurfaceDisabled": "rgba(225, 226, 229, 0.38)",
    "backdrop": "rgba(42, 49, 54, 0.4)"
  }
};

const CombinedDefaultTheme = {
  ...MD3LightTheme,
  ...LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...LightTheme.colors,
    ...CustomLightTheme.colors,
  },
  fonts: {
    ...MD3LightTheme.fonts,
    default: { ...MD3LightTheme.fonts.default, ...CustomTheme.fonts.default },
    bodySmall: { ...MD3LightTheme.fonts.bodySmall, ...CustomTheme.fonts.bodySmall },
    bodyMedium: { ...MD3LightTheme.fonts.bodyMedium, ...CustomTheme.fonts.bodyMedium },
    bodyLarge: { ...MD3LightTheme.fonts.bodyLarge, ...CustomTheme.fonts.bodyLarge },
    labelSmall: { ...MD3LightTheme.fonts.labelSmall, ...CustomTheme.fonts.labelSmall },
    labelMedium: { ...MD3LightTheme.fonts.labelMedium, ...CustomTheme.fonts.labelMedium },
    labelLarge: { ...MD3LightTheme.fonts.labelLarge, ...CustomTheme.fonts.labelLarge },
    titleSmall: { ...MD3LightTheme.fonts.titleSmall, ...CustomTheme.fonts.titleSmall },
    titleMedium: { ...MD3LightTheme.fonts.titleMedium, ...CustomTheme.fonts.titleMedium },
    titleLarge: { ...MD3LightTheme.fonts.titleLarge, ...CustomTheme.fonts.titleLarge },
    headlineSmall: { ...MD3LightTheme.fonts.headlineSmall, ...CustomTheme.fonts.headlineSmall },
    headlineMedium: { ...MD3LightTheme.fonts.headlineMedium, ...CustomTheme.fonts.headlineMedium },
    headlineLarge: { ...MD3LightTheme.fonts.headlineLarge, ...CustomTheme.fonts.headlineLarge },
    displaySmall: { ...MD3LightTheme.fonts.displaySmall, ...CustomTheme.fonts.displaySmall },
    displayMedium: { ...MD3LightTheme.fonts.displayMedium, ...CustomTheme.fonts.displayMedium },
    displayLarge: { ...MD3LightTheme.fonts.displayLarge, ...CustomTheme.fonts.displayLarge },
  },
};
const CombinedDarkTheme = {
  ...MD3DarkTheme,
  ...DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...DarkTheme.colors,
    ...CustomDarkTheme.colors,
  },
  fonts: {
    ...MD3DarkTheme.fonts,
    default: { ...MD3LightTheme.fonts.default, ...CustomTheme.fonts.default },
    bodySmall: { ...MD3DarkTheme.fonts.bodySmall, ...CustomTheme.fonts.bodySmall },
    bodyMedium: { ...MD3DarkTheme.fonts.bodyMedium, ...CustomTheme.fonts.bodyMedium },
    bodyLarge: { ...MD3DarkTheme.fonts.bodyLarge, ...CustomTheme.fonts.bodyLarge },
    labelSmall: { ...MD3DarkTheme.fonts.labelSmall, ...CustomTheme.fonts.labelSmall },
    labelMedium: { ...MD3DarkTheme.fonts.labelMedium, ...CustomTheme.fonts.labelMedium },
    labelLarge: { ...MD3DarkTheme.fonts.labelLarge, ...CustomTheme.fonts.labelLarge },
    titleSmall: { ...MD3DarkTheme.fonts.titleSmall, ...CustomTheme.fonts.titleSmall },
    titleMedium: { ...MD3DarkTheme.fonts.titleMedium, ...CustomTheme.fonts.titleMedium },
    titleLarge: { ...MD3DarkTheme.fonts.titleLarge, ...CustomTheme.fonts.titleLarge },
    headlineSmall: { ...MD3DarkTheme.fonts.headlineSmall, ...CustomTheme.fonts.headlineSmall },
    headlineMedium: { ...MD3DarkTheme.fonts.headlineMedium, ...CustomTheme.fonts.headlineMedium },
    headlineLarge: { ...MD3DarkTheme.fonts.headlineLarge, ...CustomTheme.fonts.headlineLarge },
    displaySmall: { ...MD3DarkTheme.fonts.displaySmall, ...CustomTheme.fonts.displaySmall },
    displayMedium: { ...MD3DarkTheme.fonts.displayMedium, ...CustomTheme.fonts.displayMedium },
    displayLarge: { ...MD3DarkTheme.fonts.displayLarge, ...CustomTheme.fonts.displayLarge },
  },
};

const ThemeProvider = (props: PropsWithChildren) => {
  const account = useAccount();
  let theme = account.settings.darkMode ? CombinedDarkTheme : CombinedDefaultTheme;

  const palette = generateStandardPalette(account.settings.baseColor, account.settings.darkMode);
  theme.colors.primary = palette.primary || theme.colors.onSurface;
  theme.colors.primaryContainer = palette.backdrop || theme.colors.surface;

  return (
    <NavigationThemeProvider value={theme}>
      <PaperProvider theme={theme}>
        {props.children}
      </PaperProvider>
    </NavigationThemeProvider>
  )
}

export default ThemeProvider;