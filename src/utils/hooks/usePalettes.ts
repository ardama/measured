import { useSettings } from '@s/selectors'
import { generateStandardPalette, getBasePalette, type BaseColor } from '@u/colors';
import { useMemo } from 'react';
import { useCallback } from 'react';
import { useTheme } from 'react-native-paper';

export const usePalettes = () => {
  const theme = useTheme();
  const settings = useSettings();
  const basePalette = useMemo(() => getBasePalette(theme), [theme]);

  const getPalette = useCallback((baseColor?: BaseColor) => {
    const palette = { ...generateStandardPalette(baseColor, theme.dark) };
    return {
      primary: palette.primary || basePalette.primary,
      secondary: palette.secondary || basePalette.secondary,
      backdrop: palette.backdrop || basePalette.backdrop,
      surface: palette.surface || basePalette.surface,
      disabled: palette.disabled || basePalette.disabled,
      alt: palette.alt || palette.backdrop || basePalette.alt,
    }
  }, [theme, basePalette]);

  const getCombinedPalette = useCallback((baseColor?: BaseColor) => {
    return getPalette(baseColor || settings.baseColor);
  }, [settings.baseColor, getPalette]);

  const globalPalette = useMemo(() => getPalette(settings.baseColor), [settings.baseColor, getPalette]);

  return {
    baseColor: settings.baseColor,
    getPalette,
    getCombinedPalette,
    globalPalette,
    basePalette,
  };
}