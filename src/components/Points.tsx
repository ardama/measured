import { Icons } from '@u/constants/Icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { Icon, Text, useTheme, type MD3Theme } from 'react-native-paper'
import type { VariantProp } from 'react-native-paper/lib/typescript/components/Typography/types';

type PointsProps = {
  points: number,
  size?: 'small' | 'medium' | 'large',
  disabled?: boolean,
  style?: StyleProp<ViewStyle>,
}

const Points = ({ points, size = 'medium', disabled = false, style }: PointsProps) : JSX.Element => {
  const theme = useTheme();
  const styles = createStyles(theme, size);

  let iconSize = 16;
  if (size === 'small') iconSize = 14;
  if (size === 'large') iconSize = 20;

  let textVariant = 'titleMedium';
  if (size === 'small') textVariant = 'titleSmall';
  if (size === 'large') textVariant = 'titleLarge';

  const color = disabled ? theme.colors.onSurfaceDisabled : theme.colors.primary;

  return (
    <View style={[styles.container, style]}>
      <Text variant={textVariant as VariantProp<string>} style={{ ...styles.value, color }}>{points}</Text>
      <Icon source={Icons.points} size={iconSize} color={color} />
    </View>
  )
}

const createStyles = (theme: MD3Theme, size: ('small' | 'medium' | 'large')) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: size === 'small' ? 1 : size === 'medium' ? 2 : 3,
    minWidth: size === 'small' ? 28 : size === 'medium' ? 30 : 36,
    
  },
  value: {
    fontSize: size === 'small' ? 14 : size === 'medium' ? 16 : 20,
    fontWeight: size === 'small' ? '500' : size === 'medium' ? '500' : '500',
  },
});

export default Points;