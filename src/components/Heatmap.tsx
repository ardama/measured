import { useSettings } from '@s/selectors';
import { usePalettes } from '@u/hooks/usePalettes';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme, type MD3Theme } from 'react-native-paper';

type HeatmapProps = {
  data: (number | null)[][],
  style?: StyleProp<ViewStyle>,
  target?: number,
}

const Heatmap = (props: HeatmapProps): JSX.Element => {
  const { data, style, target } = props;

  const theme = useTheme();
  const settings = useSettings();
  const { globalPalette } = usePalettes();
  const styles = createStyles(theme);

  let cellValues: (number | null)[] = [];
  cellValues = cellValues.concat(...data);

  const maxValue = target || Math.max(...cellValues.map((v) => v || 0));
  const bucketMinimums = [1.0, 0.85, 0.75, 0.6, 0.4, 0.0].map((v) => v * maxValue);

  return (
    <View style={[styles.container, style]}>
      {data.map((row, r) => {
        
        return (
          <View key={r} style={styles.row}>
            {row.map((cell, c) => {
              const bucketIndex = bucketMinimums.findIndex((minimum) => cell !== null && minimum <= (cell || 0));
            
              let cellColor = globalPalette.primary;
              let overlayOpacity = 1.0;
              if (cell === null) overlayOpacity = 1.0;
              else if (bucketIndex === 5) overlayOpacity = 1.0;
              else if (bucketIndex === 4) overlayOpacity = 0.70;
              else if (bucketIndex === 3) overlayOpacity = 0.55;
              else if (bucketIndex === 2) overlayOpacity = 0.40;
              else if (bucketIndex === 1) overlayOpacity = 0.25;
              else if (bucketIndex === 0) overlayOpacity = 0.1;
              
              const overlayColor = settings.darkMode ? `rgba(27, 33, 34, ${overlayOpacity})` : `rgba(247, 247, 247, ${overlayOpacity})`;
                          
              return (
                <View key={r * 7 + c} style={[styles.cell, cell === null ? styles.empty : {}, { backgroundColor: cellColor }]}>
                  <View style={[styles.overlay, { backgroundColor: overlayColor }]} />
                </View>
              );
            })}
          </View>
        )

      })}
    </View>
  )
}

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container : {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  cell: {
    flex: 1,
    height: 20,
    borderRadius: 4,
  },
  empty: {
    opacity: 0,
  },
  overlay: {
    borderRadius: 3,
    width: '100%',
    height: '100%',
  },
});
export default Heatmap;

