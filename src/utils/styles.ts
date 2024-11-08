type FontWeight = 300 | 400 | 500 | 600 | 700;
type FontStyle = 'normal' | 'italic';
type FontFamily = 'fira' | 'rubik';

interface FontFamilyConfig {
  [key: string]: {
    normal: Record<FontWeight, string>;
    italic: Record<FontWeight, string>;
  };
}

const FONT_FAMILIES: FontFamilyConfig = {
  fira: {
    normal: {
      300: 'FiraSans-Light',
      400: 'FiraSans-Regular',
      500: 'FiraSans-Medium',
      600: 'FiraSans-SemiBold',
      700: 'FiraSans-Bold',
    },
    italic: {
      300: 'FiraSans-LightItalic',
      400: 'FiraSans-Italic',
      500: 'FiraSans-MediumItalic',
      600: 'FiraSans-SemiBoldItalic',
      700: 'FiraSans-BoldItalic',
    }
  },
  rubik: {
    normal: {
      300: 'Rubik-Light',
      400: 'Rubik-Regular',
      500: 'Rubik-Regular',
      600: 'Rubik-Medium',
      700: 'Rubik-Bold',
    },
    italic: {
      300: 'Rubik-LightItalic',
      400: 'Rubik-Italic',
      500: 'Rubik-Italic',
      600: 'Rubik-MediumItalic',
      700: 'Rubik-BoldItalic',
    }
  }
};

const ACTIVE_FONT: FontFamily = 'fira';

interface FontStyleType {
  fontFamily: string;
}

export const getFontFamily = (
  weight: FontWeight | string = 400, 
  italic: boolean = false,
  family: FontFamily = ACTIVE_FONT
): string => {
  const style: FontStyle = italic ? 'italic' : 'normal';
  const weightMap = FONT_FAMILIES[family][style];
  const numericWeight = typeof weight === 'string' 
    ? parseInt(weight, 10) as FontWeight 
    : weight;

  const availableWeights = Object.keys(weightMap)
    .map(w => parseInt(w, 10) as FontWeight)
    .sort((a, b) => a - b);
  
  const closestWeight = availableWeights.reduce((prev, curr) => {
    return Math.abs(curr - numericWeight) < Math.abs(prev - numericWeight) 
      ? curr 
      : prev;
  });

  return weightMap[closestWeight];
};

export const createFontStyle = (
  weight: FontWeight | string, 
  italic: boolean = false,
  family: FontFamily = ACTIVE_FONT,
): FontStyleType => ({
  fontFamily: getFontFamily(weight, italic, family)
});

// Type for our text styles
interface TextStyles {
  light: FontStyleType;
  lightItalic: FontStyleType;
  regular: FontStyleType;
  regularItalic: FontStyleType;
  medium: FontStyleType;
  mediumItalic: FontStyleType;
  semiBold: FontStyleType;
  semiBoldItalic: FontStyleType;
  bold: FontStyleType;
  boldItalic: FontStyleType;
}

export const textStyles: TextStyles = {
  light: createFontStyle(300),
  lightItalic: createFontStyle(300, true),
  regular: createFontStyle(400),
  regularItalic: createFontStyle(400, true),
  medium: createFontStyle(500),
  mediumItalic: createFontStyle(500, true),
  semiBold: createFontStyle(600),
  semiBoldItalic: createFontStyle(600, true),
  bold: createFontStyle(700),
  boldItalic: createFontStyle(700, true),
};