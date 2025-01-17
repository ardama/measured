import { baseColors, type BaseColor } from '@u/colors';
import { Icons } from '@u/constants/Icons';
import { usePalettes } from '@u/hooks/usePalettes';
import { StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple, useTheme, type MD3Theme } from 'react-native-paper';

type ColorPickerProps = {
  value?: BaseColor
  onSelect: (value: BaseColor | null) => void
}

const ColorPicker: React.FC<ColorPickerProps> = (props) => {
  const {
    value,
    onSelect,
  } = props;

  const theme = useTheme();
  const { getPalette: getStandardPalette } = usePalettes();
  const styles = createStyles(theme);
  return (
    <View style={styles.container}>
      {baseColors.map((baseColor) => {
        const isSelected = baseColor === value;
        const { primary, backdrop } = getStandardPalette(baseColor);
        return (
          <TouchableRipple
            key={baseColor || 'none'}
            style={[styles.colorOuter, { backgroundColor: isSelected ? (backdrop || primary) : undefined }]}
            onPress={() => onSelect(isSelected ? null : baseColor)}
          >
            <View style={[styles.colorInner, { backgroundColor: primary }]} />
          </TouchableRipple>
        )
      })}
      <TouchableRipple
        key={'none'}
        style={[styles.colorOuter]}
        onPress={() => onSelect(null)}
      >
        <View style={[styles.colorInner, { backgroundColor: undefined }]}>
          <Icon source={Icons.close} size={14} color={value ? theme.colors.onSurfaceVariant : theme.colors.onSurfaceDisabled} />
        </View>
      </TouchableRipple>
    </View>
  )
}

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexGrow: 1,
    justifyContent: 'space-between',
    minWidth: 300,
  },
  colorOuter: {
    flexGrow: 1,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  colorOuterSelected: {

  },
  colorInner: {
    height: 12,
    width: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ColorPicker;