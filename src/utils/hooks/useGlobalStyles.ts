import type { Palette } from '@u/colors';
import { usePalettes } from '@u/hooks/usePalettes';
import { StyleSheet } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import { getTheme } from 'react-native-paper/lib/typescript/core/theming';

const useGlobalStyles = (theme: MD3Theme) => {
  const { globalPalette } = usePalettes();
  return createStyles(theme, globalPalette);
}

const createStyles = (theme: MD3Theme, palette: Palette) => StyleSheet.create({
  elevation1: {
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowRadius: 4,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    backgroundColor: theme.dark ? theme.colors.elevation.level3 : theme.colors.surface,
  },
  elevation2: {
    elevation: 5,
    shadowColor: theme.colors.shadow,
    shadowRadius: 10,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    backgroundColor: theme.dark ? theme.colors.elevation.level4 : theme.colors.surface,
  },
  elevation3: {
    elevation: 12,
    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    backgroundColor: theme.dark ? theme.colors.elevation.level5 : theme.colors.surface,
    gap: 12,
  },
});

export default useGlobalStyles;
