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
}

const Points = ({ points, size = 'medium', disabled = false, color, textColor, iconColor, style, decimals = 0, inline = false }: PointsProps) : JSX.Element => {
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

  const textColorValue = disabled ? theme.colors.onSurfaceDisabled : textColor ? textColor : color ? color : theme.colors.onSurface;
  const iconColorValue = disabled ? theme.colors.onSurfaceDisabled : iconColor ? iconColor : color ? color : theme.colors.onSurface;

  const pointsString = isNaN(points) ? '--' : points.toFixed(decimals);
  return (
    <View style={[styles.container, style]}>
      <Text variant={textVariant as VariantProp<string>} style={{ ...styles.value, color: textColorValue }}>{pointsString}</Text>
      <View style={styles.icon}>
        <Icon source={Icons.points} size={iconSize} color={iconColorValue} />
      </View>
    </View>
  )
}

const createStyles = (theme: MD3Theme, size: PointsSize, inline: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    // gap: size === 'x-small' ? 1 : size === 'small' ? 1 : size === 'medium' ? 2 : 0,
    minWidth: inline ? 0 : size === 'x-small' ? 24 : size === 'small' ? 28 : size === 'medium' ? 30 : 36,
    marginRight: !inline ? 0 : size === 'x-small' ? 0 : size === 'small' ? -2 : size === 'medium' ? -3 : -4,
  },
  value: {
    ...createFontStyle(500, false, 'rubik'),
    // fontSize: size === 'x-small' ? 12 : size === 'small' ? 14 : size === 'medium' ? 16 : size === 'large' ? 20 : 28,
  },
  icon: {
    // height: size === 'x-small' ? 12 : size === 'small' ? 14 : size === 'medium' ? 16 : size === 'large' ? 20 : 28,
  },
});

export default Points;