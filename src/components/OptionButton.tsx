import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Icon, Text, TouchableRipple, useTheme, type MD3Theme } from 'react-native-paper';

type OptionButtonProps = {
  children?: (JSX.Element | null)[],
  selected?: boolean,
  unselected?: boolean,
  disabled?: boolean,
  style?: ViewStyle,
  contentStyle?: ViewStyle,

  icon?: string,
  iconSize?: number,
  iconStyle?: ViewStyle,

  title?: string,
  subtitle?: string,

  onPress?: () => void,
}
const OptionButton = ({
  children,
  selected,
  unselected,
  disabled,
  style,
  contentStyle,
  
  icon,
  iconSize,
  iconStyle,
  
  title,
  subtitle,

  onPress,
}: OptionButtonProps) => {
  const theme = useTheme();
  const s = createStyles(theme);

  const content = children && children.length ? children : (
    <>
      {!!title && (
        <Text
          variant='labelLarge'
          style={[
            s.title,
            disabled ? s.titleDisabled : {},
          ]}
        >
          {title}
        </Text>
      )}
      {!!subtitle && (
        <Text
          variant='bodySmall'
          style={[
            s.subtitle,
            disabled ? s.subtitleDisabled : {},
          ]}
        >
          {subtitle}
        </Text>
      )}
    </>
  )

  return (
    <View
      style={[
        s.container,
        style,
        selected ? s.containerSelected : {},
        unselected ? s.containerUnselected : {},
        disabled ? s.containerDisabled : {},
      ]}
    >
      <TouchableRipple
        disabled={disabled}

        background={{ foreground: true }}
        onPress={() => { !disabled && onPress ? onPress() : null}}
      >
        <View style={[
          s.content,
          contentStyle
        ]}>
          {!!icon && (
            <View
              style={[
                iconStyle
              ]}
            >
              <Icon
                source={icon}
                size={iconSize || 22}
                color={disabled ? theme.colors.onSurfaceDisabled : theme.colors.onSurface}
              />
            </View>
          )}
          {!!icon ? <View style={{ flexShrink: 1 }}>{content}</View> : content}
        </View>
      </TouchableRipple>
    </View>
  );
};

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  containerSelected: {
    backgroundColor: theme.colors.surfaceDisabled,
  },
  containerUnselected: {
    backgroundColor: theme.colors.elevation.level2,
  },
  containerDisabled: {
    backgroundColor: undefined,
  },
  title: {
    
  },
  titleDisabled: {
    color: theme.colors.onSurfaceDisabled,
  },
  subtitle: {
    
  },
  subtitleDisabled: {
    color: theme.colors.onSurfaceDisabled,
    
  },
})

export default OptionButton;