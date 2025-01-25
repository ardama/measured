import { Icon } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { getMeasurementTypeIcon } from '@t/measurements';
import type { FormMeasurement, Measurement } from '@t/measurements';
import { useMemo } from 'react';
import type { VariantProp } from 'react-native-paper/lib/typescript/components/Typography/types';
import { usePalettes } from '@u/hooks/usePalettes';
import type { BaseColor, Palette } from '@u/colors';
import type { ComputedHabit, FormHabit } from '@t/habits';

type LabelSize = 'small' | 'medium' | 'large' | 'xlarge';
type LabelProps = {
  category: string;
  name: string;
  size: LabelSize;
  icon?: string;
  baseColor?: BaseColor;
}

const iconSize = {
  small: 16,
  medium: 14,
  large: 24,
  xlarge: 24,
};

const nameFontVariant: Record<LabelSize, VariantProp<never>> = {
  small: 'bodySmall',
  medium: 'bodyMedium',
  large: 'bodyLarge',
  xlarge: 'titleLarge',
};

const gapSize = {
  small: 4,
  medium: 5,
  large: 6,
  xlarge: 8,
};

export function Label({ category, name, size, icon, baseColor }: LabelProps) {
  const styles = useMemo(() => createStyles(size), [size]);
  
  return useMemo(() => (
    <View style={styles.container}>
      {icon && <Icon source={icon} size={iconSize[size]} />}
      {category && (
        <CategoryBadge
          category={category}
          size={size}
          baseColor={baseColor}
        />
      )}
      <Text ellipsizeMode='tail' variant={nameFontVariant[size]} numberOfLines={1} style={styles.name}>
        {name}
      </Text>
    </View>
  ), [name, category, icon, baseColor, styles]);
}

const createStyles = (size: LabelSize) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    flexGrow: 0,
    gap: gapSize[size],
  },
  name: {
    flexShrink: 1,
    flexGrow: 1,
  },
});

type MeasurementLabelProps = {
  measurement: Measurement | FormMeasurement;
  size: LabelSize;
  showTypeIcon?: boolean;
};

export function MeasurementLabel({ measurement, size, showTypeIcon = false }: MeasurementLabelProps) {
  const { category, name, type, baseColor } = measurement;
  const icon = showTypeIcon && getMeasurementTypeIcon(type) || undefined;
  return <Label
    category={category}
    name={name}
    size={size}
    baseColor={baseColor}
    icon={icon}
  />;
}

type HabitLabelProps = {
  habit: ComputedHabit | FormHabit;
  size: LabelSize;
};

export function HabitLabel({ habit, size }: HabitLabelProps) {
  const { category, name, baseColor } = habit;
  return <Label
    category={category}
    name={name}
    size={size}
    baseColor={baseColor}
  />;
}

type CategoryBadgeProps = {
  category: string;
  size: LabelSize;
  showBackground?: boolean;
  baseColor?: BaseColor;
};

const categoryFontVariant: Record<LabelSize, VariantProp<never>> = {
  small: 'labelSmall',
  medium: 'labelMedium',
  large: 'labelLarge',
  xlarge: 'titleMedium',
};

const categoryBackgroundPadding: Record<LabelSize, number> = {
  small: 4,
  medium: 4,
  large: 4,
  xlarge: 6,
};

export function CategoryBadge({ category, size, showBackground = true, baseColor }: CategoryBadgeProps) {
  const { getPalette } = usePalettes();
  const palette = useMemo(() => getPalette(baseColor), [baseColor, getPalette]);

  const styles = useMemo(() => StyleSheet.create({
    category: {
      flexShrink: 2,
      flexGrow: 0,
    },
    categoryBackground: {
      backgroundColor: palette.backdrop,
      borderRadius: 4,
      paddingHorizontal: categoryBackgroundPadding[size],
      paddingVertical: categoryBackgroundPadding[size] / 2,
    },
  }), [size, palette]);

  return useMemo(() => (
    <Text
      ellipsizeMode='tail'
      numberOfLines={1}
      variant={categoryFontVariant[size]}
      style={[styles.category, showBackground && styles.categoryBackground]}
    >
      {category}
    </Text>
  ), [category, size, showBackground, palette, styles]);
}
