import type { Palette } from '@u/colors';
import { Icons } from '@u/constants/Icons';
import { usePalettes } from '@u/hooks/usePalettes';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Icon, Text, TouchableRipple, useTheme, type MD3Theme } from 'react-native-paper';

type OptionButtonProps = {
  children?: (JSX.Element | null)[],
  selected?: boolean,
  unselected?: boolean,
  disabled?: boolean,
  style?: ViewStyle,
  contentStyle?: ViewStyle,
  palette?: Palette,

  icon?: string,
  iconSize?: number,
  iconStyle?: ViewStyle,

  title?: string,
  subtitle?: string,

  isCheckbox?: boolean,
  isRadio?: boolean,

  onPress?: () => void,
}
const OptionButton = ({
  children,
  selected,
  unselected,
  disabled,
  style,
  contentStyle,
  palette,
  
  icon,
  iconSize,
  iconStyle,

  isCheckbox,
  isRadio,

  title,
  subtitle,

  onPress,
}: OptionButtonProps) => {
  const theme = useTheme();
  const { globalPalette } = usePalettes();
  const s = createStyles(theme, palette || globalPalette);

  const titleElement = !!title && (
    <Text
      variant='titleMedium'
      style={[
        s.title,
        disabled ? s.titleDisabled : {},
      ]}
    >
      {title}
    </Text>
  );

  const subtitleElement = !!subtitle && (
    <Text
      variant='bodyMedium'
      style={[
        s.subtitle,
        disabled ? s.subtitleDisabled : {},
      ]}
    >
      {subtitle}
    </Text>
  );

  const iconElement = !!icon && (
    <View
      style={[
        iconStyle
      ]}
    >
      <Icon
        source={icon}
        size={iconSize || 26}
        color={disabled ? theme.colors.onSurfaceDisabled : theme.colors.onSurface}
      />
    </View>
  );

  const controlElement = (isCheckbox || isRadio) && (
    <View
      style={[
      ]}>
        <Icon
          source={
            isCheckbox ? selected ? Icons.checkboxSelected : Icons.checkbox :
            isRadio ? selected ? Icons.radioSelected : Icons.radio :
            undefined
          }
          size={22}
          color={disabled ? theme.colors.onSurfaceDisabled : theme.colors.onSurface}
        />
    </View>
  );

  const content = children && children.length ? (
    <>
      {controlElement}
      {iconElement}
      {children}
    </>
  ) : (
    <>
      {controlElement}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexGrow: 1, flexShrink: 1, justifyContent: 'space-between' }}>
        <View style={{ flexShrink: 1 }}>
          {titleElement}
          {subtitleElement}
        </View>
        {iconElement}
      </View>
    </>
  )

  return (
    <View
      style={[
        s.container,
        style,
        selected && s.containerSelected,
        unselected && s.containerUnselected,
        disabled && s.containerDisabled,
      ]}
    >
      <TouchableRipple
        disabled={disabled}

        background={{ foreground: true }}
        onPress={!disabled && !selected && onPress ? onPress : undefined}
      >
        <View style={[
          s.content,
          selected && s.contentSelected,
          contentStyle
        ]}>
          {content}
        </View>
      </TouchableRipple>
    </View>
  );
};

const createStyles = (theme: MD3Theme, palette: Palette) => StyleSheet.create({
  container: {
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: theme.colors.elevation.level2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  containerSelected: {
    backgroundColor: palette.backdrop,
    borderColor: palette.alt,
  },
  containerUnselected: {
    
  },
  containerDisabled: {
    opacity: 0.8,
  },
  content: {
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  contentSelected: {
  },
  title: {
    
  },
  titleDisabled: {
    color: theme.colors.onSurfaceDisabled,
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
  },
  subtitleDisabled: {
    color: theme.colors.onSurfaceDisabled,
    
  },
})

export default OptionButton;