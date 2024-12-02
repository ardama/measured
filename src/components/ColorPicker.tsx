import { baseColors, type BaseColor } from '@u/colors';
import { usePalettes } from '@u/hooks/usePalettes';
import { StyleSheet, View } from 'react-native';
import { TouchableRipple, useTheme, type MD3Theme } from 'react-native-paper';

type ColorPickerProps = {
  value?: BaseColor
  onSelect: (value: BaseColor | undefined) => void
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
            onPress={() => onSelect(isSelected ? undefined : baseColor)}
          >
            <View style={[styles.colorInner, { backgroundColor: primary }]} />
          </TouchableRipple>
        )
      })}
    </View>
  )
}

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: 4,
  },
  colorOuter: {
    padding: 8,
    borderRadius: 10,
  },
  colorOuterSelected: {

  },
  colorInner: {
    height: 12,
    width: 12,
    borderRadius: 12,
  },
});

export default ColorPicker;