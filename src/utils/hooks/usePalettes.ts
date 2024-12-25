import { useSettings } from '@s/selectors'
import { generateStandardPalette, getBasePalette, type BaseColor } from '@u/colors';
import { useTheme } from 'react-native-paper';

export const usePalettes = () => {
  const theme = useTheme();
  const settings = useSettings();
  const basePalette = getBasePalette(theme);

  const getPalette = (baseColor?: BaseColor) => {
    const palette = { ...generateStandardPalette(baseColor, theme.dark) };
    return {
      primary: palette.primary || basePalette.primary,
      secondary: palette.secondary || basePalette.secondary,
      backdrop: palette.backdrop || basePalette.backdrop,
      surface: palette.surface || basePalette.surface,
      disabled: palette.disabled || basePalette.disabled,
      alt: palette.alt || palette.backdrop || basePalette.alt,
    }
  }

  const getCombinedPalette = (baseColor?: BaseColor) => {
    return getPalette(baseColor || settings.baseColor);
  }  

  const globalPalette = getPalette(settings.baseColor)

  return {
    getPalette,
    getCombinedPalette,
    globalPalette,
    basePalette,
  };
}