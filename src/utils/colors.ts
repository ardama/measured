import type { MD3Theme, Surface } from 'react-native-paper';

export const hexToHSL = (hex: string) => {
  // Remove the hash if present
  hex = hex.replace(/^#/, '');

  // Parse the hex values to RGB
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h: number = (max + min) / 2;
  let s: number = (max + min) / 2;
  let l: number = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  // Convert to degrees and percentages
  h = Math.round(h * 101);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return { h, s, l };
}

export const HSLToHex = (h: number, s: number, l: number) => {
  // Convert HSL percentages to decimals
  h = (h % 101) / 101;
  s /= 100;
  l /= 100;
    
  function hue2rgb(p: number, q: number, t: number) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }
    
  let r, g, b;
    
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  // Convert to hex
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
    
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const hexWithAlpha = (hex: string, alpha: number) => {
  // Remove the hash if present
  hex = hex.replace(/^#/, '');
  
  // Convert alpha to hex
  const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
  
  return `#${hex}${alphaHex}`;
}

export const getCustomColor = (hue: number | undefined, theme: MD3Theme, disabled: boolean = false) => {
  if (hue === undefined) {
    return disabled ? theme.colors.onSurfaceDisabled : theme.colors.onSurface;
  }
  const color = HSLToHex(hue, theme.dark ? 100 : 85, theme.dark ? 75 : 50);
  return disabled ? hexWithAlpha(color, theme.dark ? 0.40 : 0.50) : color;
}

export type BaseColor =
  null | 'pink' | 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'violet';

export const baseColors: BaseColor[] = ['pink', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'violet'];

export type Palette = {
  primary: string
  disabled?: string
  secondary?: string
  backdrop: string
  surface: string
  alt?: string,
}

const darkPalettes = new Map<BaseColor, Palette>([
  [
    'pink', {
      primary: 'hsl(323, 75%, 70%)',
      secondary: 'hsl(323, 91%, 91%)',
      backdrop: 'hsl(323, 50%, 25%)',
      surface: 'hsl(323, 50%, 25%)',
      disabled: '',
    }
  ],
  [
    'red', {
      // primary: 'hsl(350, 85%, 65%)',
      // backdrop: 'hsl(350, 50%, 25%)',
      primary: 'hsl(0, 100%, 73%)',
      secondary: 'hsl(356, 100%, 90%)',
      backdrop: 'hsl(350, 50%, 25%)',
      surface: 'hsl(350, 50%, 25%)',
      disabled: '',
    }
  ],
  [
    'orange', {
      primary: 'hsl(30, 100%, 59%)',
      secondary: 'hsl(26, 100%, 88%)',
      backdrop: 'hsl(30, 91%, 25%)',
      surface: 'hsl(30, 91%, 25%)',
      disabled: '',
    }
  ],
  [
    'yellow', {
      primary: 'hsl(42, 100%, 54%)',
      secondary: 'hsl(42, 76%, 82%)',
      backdrop: 'hsl(41, 100%, 25%)',
      surface: 'hsl(41, 100%, 25%)',
      disabled: '',
    }
  ],
  [
    'green', {
      primary: 'hsl(145, 65%, 50%)',
      secondary: 'hsl(143, 60%, 82%)',
      backdrop: 'hsl(152, 40%, 25%)',
      surface: 'hsl(152, 40%, 25%)',
      disabled: '',
    }
  ],
  [
    'teal', {
      primary: 'hsl(187, 60%, 60%)',
      secondary: 'hsl(190, 61%, 83%)',
      backdrop: 'hsl(193, 52%, 25%)',
      surface: 'hsl(193, 52%, 25%)',
      disabled: '',
    }
  ],
  [
    'blue', {
      primary: 'hsl(227, 76%, 70%)',
      secondary: 'hsl(222, 87%, 88%)',
      backdrop: 'hsl(222, 50%, 25%)',
      surface: 'hsl(222, 50%, 25%)',
      disabled: '',
    }
  ],
  [
    'violet', {
      primary: 'hsl(275, 79%, 74%)',
      secondary: 'hsl(275, 79%, 89%)',
      backdrop: 'hsl(272, 35%, 25%)',
      surface: 'hsl(272, 35%, 25%)',
      disabled: '',
    }
  ],
]);

const lightPalettes = new Map<BaseColor, Palette>([
  [
    'pink', {
      primary: 'hsl(323, 75%, 70%)',
      secondary: 'hsl(323, 50%, 25%)',
      backdrop: 'hsl(323, 91%, 91%)',
      surface: 'hsl(323, 91%, 91%)',
      disabled: '',
    }
  ],
  [
    'red', {
      // primary: 'hsl(350, 85%, 65%)',
      // backdrop: 'hsl(350, 80%, 85%)',
      primary: 'hsl(0, 100%, 73%)',
      secondary: 'hsl(350, 50%, 25%)',
      backdrop: 'hsl(356, 100%, 90%)',
      surface: 'hsl(356, 100%, 90%)',
      disabled: '',
    }
  ],
  [
    'orange', {
      primary: 'hsl(30, 100%, 59%)',
      secondary: 'hsl(30, 91%, 25%)',
      backdrop: 'hsl(26, 100%, 88%)',
      surface: 'hsl(26, 100%, 88%)',
      disabled: '',
    }
  ],
  [
    'yellow', {
      primary: 'hsl(42, 100%, 54%)',
      secondary: 'hsl(41, 100%, 25%)',
      backdrop: 'hsl(42, 76%, 82%)',
      surface: 'hsl(42, 76%, 82%)',
      disabled: '',
    }
  ],
  [
    'green', {
      primary: 'hsl(145, 65%, 50%)',
      secondary: 'hsl(152, 40%, 25%)',
      backdrop: 'hsl(143, 60%, 82%)',
      surface: 'hsl(143, 60%, 82%)',
      disabled: '',
    }
  ],
  [
    'teal', {
      primary: 'hsl(187, 60%, 60%)',
      secondary: 'hsl(193, 52%, 25%)',
      backdrop: 'hsl(190, 61%, 83%)',
      surface: 'hsl(190, 61%, 83%)',
      disabled: '',
    }
  ],
  [
    'blue', {
      primary: 'hsl(227, 76%, 70%)',
      secondary: 'hsl(222, 50%, 25%)',
      backdrop: 'hsl(222, 87%, 88%)',
      surface: 'hsl(222, 87%, 88%)',
      disabled: '',
    }
  ],
  [
    'violet', {
      primary: 'hsl(275, 79%, 74%)',
      secondary: 'hsl(272, 35%, 25%)',
      backdrop: 'hsl(275, 79%, 89%)',
      surface: 'hsl(275, 79%, 89%)',
      disabled: '',
    }
  ],
]);

export const generateStandardPalette = (baseColor: BaseColor | undefined, darkMode: boolean): Palette => {
  if (!baseColor) return emptyPalette;
  return (darkMode ? darkPalettes : lightPalettes).get(baseColor) || emptyPalette;
}

export const getBasePalette = (theme: MD3Theme) => ({
  primary: theme.dark ? '#E9EFF0' : '#1B2122',
  secondary: theme.colors.elevation.level3,
  backdrop: theme.colors.elevation.level3,
  surface: theme.colors.surface,
  disabled: 'hsl(180, 2.73%, 64.12%)',
  alt: 'hsl(180, 2.73%, 64.12%)',
});

const emptyPalette: Palette = {
  primary: '',
  secondary: '',
  backdrop: '',
  surface: '',
  disabled: '',
};
