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
  '' | 'pink' | 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'violet';

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
      primary: '#ec79c0',
      secondary: '#fdd3ed',
      backdrop: '#602048',
      surface: '#602048',
      disabled: '',
    }
  ],
  [
    'red', {
      primary: '#ff7575',
      secondary: '#ffcccf',
      backdrop: '#60202b',
      surface: '#60202b',
      disabled: '',
    }
  ],
  [
    'orange', {
      primary: '#FF972F',
      secondary: '#ffdcc2',
      backdrop: '#7a4006',
      surface: '#7a4006',
      disabled: '',
    }
  ],
  [
    'yellow', {
      primary: '#ffb914',
      secondary: '#f4dfaf',
      backdrop: '#805700',
      surface: '#805700',
      disabled: '',
    }
  ],
  [
    'green', {
      primary: '#2dd272',
      secondary: '#b6edcb',
      backdrop: '#265941',
      surface: '#265941',
      disabled: '',
    }
  ],
  [
    'teal', {
      primary: '#5cc8d6',
      secondary: '#b9e5ee',
      backdrop: '#1f5361',
      surface: '#1f5361',
      disabled: '',
    }
  ],
  [
    'blue', {
      primary: '#7891ed',
      secondary: '#c6d6fb',
      backdrop: '#203360',
      surface: '#203360',
      disabled: '',
    }
  ],
  [
    'violet', {
      primary: '#c588f1',
      secondary: '#e7cdf9',
      backdrop: '#412956',
      surface: '#412956',
      disabled: '',
    }
  ],
]);

const lightPalettes = new Map<BaseColor, Palette>([
  [
    'pink', {
      primary: '#ec79c0',
      secondary: '#602048',
      backdrop: '#fdd3ed',
      surface: '#fdd3ed',
      disabled: '',
    }
  ],
  [
    'red', {
      primary: '#ff7575',
      secondary: '#60202b',
      backdrop: '#ffcccf',
      surface: '#ffcccf',
      disabled: '',
    }
  ],
  [
    'orange', {
      primary: '#FF972F',
      secondary: '#7a4006',
      backdrop: '#ffdcc2',
      surface: '#ffdcc2',
      disabled: '',
    }
  ],
  [
    'yellow', {
      primary: '#ffb914',
      secondary: '#805700',
      backdrop: '#f4dfaf',
      surface: '#f4dfaf',
      disabled: '',
    }
  ],
  [
    'green', {
      primary: '#2dd272',
      secondary: '#265941',
      backdrop: '#b6edcb',
      surface: '#b6edcb',
      disabled: '',
    }
  ],
  [
    'teal', {
      primary: '#5cc8d6',
      secondary: '#1f5361',
      backdrop: '#b9e5ee',
      surface: '#b9e5ee',
      disabled: '',
    }
  ],
  [
    'blue', {
      primary: '#7891ed',
      secondary: '#203360',
      backdrop: '#c6d6fb',
      surface: '#c6d6fb',
      disabled: '',
    }
  ],
  [
    'violet', {
      primary: '#c588f1',
      secondary: '#412956',
      backdrop: '#e7cdf9',
      surface: '#e7cdf9',
      disabled: '',
    }
  ],
]);

// export const generateCustomPalette = (hue: number | undefined, theme: MD3Theme): Palette => {
//   if (!hue) return getBasePalette(theme);
//   const customColor = HSLToHex(hue, theme.dark ? 90 : 75, theme.dark ? 70 : 65);
//   return {
//     primary: customColor,
//     secondary: hexWithAlpha(customColor, theme.dark ? 0.40 : 0.50),
//     backdrop: HSLToHex(hue, theme.dark ? 80 : 70, theme.dark ? 40 : 75),

//   };
// }

export const generateStandardPalette = (baseColor: BaseColor | undefined, darkMode: boolean): Palette => {
  // const basePalette = getBasePalette(theme);
  if (!baseColor) return emptyPalette;
  return (darkMode ? darkPalettes : lightPalettes).get(baseColor) || emptyPalette;
  // return {
  //   primary: palette?.primary || basePalette.primary,
  //   secondary: palette?.secondary || basePalette.secondary,
  //   backdrop: palette?.backdrop || basePalette.backdrop,
  // };
}

export const getBasePalette = (theme: MD3Theme) => ({
  primary: theme.colors.onSurface,
  secondary: theme.colors.outline,
  backdrop: theme.colors.surfaceDisabled,
  surface: theme.colors.surface,
  disabled: theme.colors.onSurfaceDisabled,
  alt: theme.colors.onSurfaceDisabled,
});

const emptyPalette: Palette = {
  primary: '',
  secondary: '',
  backdrop: '',
  surface: '',
  disabled: '',
};

// interface HSLColor {
//   h: number;
//   s: number;
//   l: number;
// }

// interface ColorResult {
//   hex: string;
//   hsl: HSLColor;
//   contrast: number;
// }

// interface ColorPalette {
//   background: {
//     hex: string;
//     hsl: HSLColor;
//   };
//   primary: ColorResult;
//   secondary: ColorResult;
//   text: ColorResult;
//   timestamp: number;
// }

// class ColorCache {
//   private lightCache: Map<number, ColorPalette>;
//   private darkCache: Map<number, ColorPalette>;
//   private maxSize: number;

//   constructor(maxSize: number = 100) {
//     this.lightCache = new Map();
//     this.darkCache = new Map();
//     this.maxSize = maxSize;
//   }

//   private normalizeHue(hue: number): number {
//     return Math.round(((hue % 100) + 100) % 100);
//   }

//   get(hue: number, dark: boolean = false): ColorPalette | undefined {
//     return (dark ? this.darkCache : this.lightCache).get(this.normalizeHue(hue));
//   }

//   set(hue: number, dark: boolean = false, value: ColorPalette): void {
//     hue = this.normalizeHue(hue);

//     const cache = dark ? this.darkCache : this.lightCache;
      
//     if (cache.size >= this.maxSize) {
//       const firstKey = cache.keys().next().value;
//       firstKey ? cache.delete(firstKey) : null;
//     }
        
//     cache.set(hue, value);
//   }

//   clear(): void {
//     this.lightCache.clear();
//     this.darkCache.clear();
//   }
// }

// function getLuminance(hex: string): number {
//   const rgb = hex.replace('#', '').match(/.{2}/g)!
//     .map(x => parseInt(x, 16) / 255)
//     .map(x => x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
//   return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
// }

// function getContrastRatio(color1: string, color2: string): number {
//   const l1 = getLuminance(color1);
//   const l2 = getLuminance(color2);
//   const brightest = Math.max(l1, l2);
//   const darkest = Math.min(l1, l2);
//   return (brightest + 0.05) / (darkest + 0.05);
// }

// function findAccessibleColor(
//   hue: number,
//   backgroundColor: string,
//   targetContrast: number = 2.5
// ): ColorResult {
//   let bestColor: ColorResult | null = null;
//   let bestContrast = 0;
  
//   for (let s = 100; s >= 30; s -= 10) {
//     for (let l = 0; l <= 100; l += 2) {
//       const testColor = HSLToHex(hue, s, l);
//       const contrast = getContrastRatio(testColor, backgroundColor);
          
//       if (contrast >= targetContrast && (bestColor === null || Math.abs(contrast - targetContrast) < Math.abs(bestContrast - targetContrast))) {
//         bestColor = {
//           hex: testColor,
//           hsl: { h: hue, s, l },
//           contrast
//         };
//         bestContrast = contrast;
                
//         if (Math.abs(contrast - targetContrast) < 0.1) {
//           return bestColor;
//         }
//       }
//     }
//   }
    
//   if (!bestColor) {
//     const l = backgroundColor.startsWith('#fff') ? 0 : 100;
//     bestColor = {
//       hex: HSLToHex(hue, 100, l),
//       hsl: { h: hue, s: 100, l },
//       contrast: bestContrast
//     };
//   }
    
//   return bestColor;
// }

// const colorCache = new ColorCache();

// export function generateAccessiblePalette(hue: number, theme: MD3Theme): ColorPalette {
//   // Check cache first
//   const cached = colorCache.get(hue, theme.dark);
//   if (cached) {
//     return cached;
//   }

//   // If not in cache, calculate new palette
//   const background = theme.dark ? HSLToHex(hue, 15, 10) : HSLToHex(hue, 15, 97);
//   const primary = findAccessibleColor(hue, background, 4.5);
//   const secondary = findAccessibleColor((hue + 10) % 100, background, 4.5);
//   const text = findAccessibleColor(hue, background, 7);

//   const palette: ColorPalette = {
//     background: {
//       hex: background,
//       hsl: { h: hue, s: 15, l: 97 }
//     },
//     primary,
//     secondary,
//     text,
//     timestamp: Date.now()
//   };

//   colorCache.set(hue, theme.dark, palette);
//   return palette;
// }