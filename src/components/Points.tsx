import { Icons } from '@u/constants/Icons';
import { createFontStyle } from '@u/styles';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { Icon, Text, useTheme, type MD3Theme } from 'react-native-paper'
import type { VariantProp } from 'react-native-paper/lib/typescript/components/Typography/types';

type PointsSize = 'small' | 'medium' | 'large' | 'x-small' | 'x-large';
type PointsProps = {
  points: number
  size?: PointsSize
  disabled?: boolean
  color?: string
  textColor?: string
  iconColor?: string
  style?: StyleProp<ViewStyle>
  decimals?: number
  inline?: boolean
  hideIcon?: boolean
}

const Points = ({ points, size = 'medium', disabled = false, color, textColor, iconColor, style, decimals = 0, inline = false, hideIcon = false }: PointsProps) : JSX.Element => {
  const theme = useTheme();
  const styles = createStyles(theme, size, inline);

  let iconSize = 16;
  if (size === 'x-small') iconSize = 12;
  else if (size === 'small') iconSize = 14;
  else if (size === 'large') iconSize = 20;
  else if (size === 'x-large') iconSize = 24;

  let textVariant = 'titleMedium';
  if (size === 'x-small') textVariant = 'labelMedium';
  else if (size === 'small') textVariant = 'titleSmall';
  else if (size === 'large') textVariant = 'titleLarge';
  else if (size === 'x-large') textVariant = 'headlineMedium';

  let decimalTextVariant = '';
  // if (size === 'x-small') decimalTextVariant = 'labelSmall';
  // else if (size === 'small') decimalTextVariant = 'labelMedium';
  if (size === 'large') decimalTextVariant = 'titleMedium';
  if (size === 'x-large') decimalTextVariant = 'titleLarge';

  const textColorValue = disabled ? theme.colors.onSurfaceDisabled : textColor ? textColor : color ? color : theme.colors.onSurface;
  const iconColorValue = disabled ? theme.colors.onSurfaceDisabled : iconColor ? iconColor : color ? color : theme.colors.onSurface;

  const pointsStringFull = (points === undefined || points === null || isNaN(points)) ? '--' : points.toFixed(decimals);
  const [pointsString, decimalsString] = pointsStringFull.split('.');
  return (
    <View style={[styles.container, style]}>
      <View style={styles.label}>
        <Text variant={textVariant as VariantProp<string>} style={{ ...styles.value, color: textColorValue }}>
          {`${pointsString}`}
        </Text>
        {decimalsString && <Text variant={(decimalTextVariant || textVariant) as VariantProp<string>} style={{ ...styles.value, color: textColorValue }}>.{decimalsString}</Text>}
      </View>
      {!hideIcon && (
        <View style={styles.icon}>
          <Icon source={Icons.points} size={iconSize} color={iconColorValue} />
        </View>
      )}
    </View>
  )
}

const createStyles = (theme: MD3Theme, size: PointsSize, inline: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    // gap: size === 'x-small' ? 1 : size === 'small' ? 1 : size === 'medium' ? 2 : 0,
    // minWidth: inline ? 0 : size === 'x-small' ? 24 : size === 'small' ? 28 : size === 'medium' ? 30 : 36,
    // marginRight: !inline ? 0 : size === 'x-small' ? 0 : size === 'small' ? -2 : size === 'medium' ? -3 : -4,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: size === 'x-small' ? -0.5 : size === 'small' ? -0.75 : size === 'medium' ? -1 : size === 'large' ? -1.5 : -2,
  },
  value: {
    ...createFontStyle(500),
  },
  icon: {
    marginRight: size === 'x-small' ? 0 : size === 'small' ? -2 : size === 'medium' ? -3 : -4,
    // height: size === 'x-small' ? 12 : size === 'small' ? 14 : size === 'medium' ? 16 : size === 'large' ? 20 : 28,
  },
});

export default Points;