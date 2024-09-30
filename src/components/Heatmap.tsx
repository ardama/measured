import { useDarkMode } from '@s/selectors';
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
  const darkMode = useDarkMode();
  const styles = createStyles(theme);

  let cellValues: (number | null)[] = [];
  cellValues = cellValues.concat(...data);

  const maxValue = target || Math.max(...cellValues.map((v) => v || 0));
  const bucketMinimums = [1.0, 0.8, 0.6, 0.4, 0.2, 0.0].map((v) => v * maxValue);

  return (
    <View style={[styles.container, style]}>
      {data.map((row, r) => {
        
        return (
          <View key={r} style={styles.row}>
            {row.map((cell, c) => {
  
              const bucketIndex = bucketMinimums.findIndex((minimum) => cell !== null && minimum < (cell || 0));
            
              let cellColor = theme.colors.primary;
              let overlayOpacity = 0.95;
              if (bucketIndex === 5) overlayOpacity = 0.85;
              else if (bucketIndex === 4) overlayOpacity = 0.70;
              else if (bucketIndex === 3) overlayOpacity = 0.55;
              else if (bucketIndex === 2) overlayOpacity = 0.40;
              else if (bucketIndex === 1) overlayOpacity = 0.25;
              else if (bucketIndex === 0) overlayOpacity = 0.10;
              
              const overlayColor = darkMode ? `rgba(10, 10, 10, ${overlayOpacity})` : `rgba(255, 255, 255, ${overlayOpacity})`;
                          
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
  },
  overlay: {
    borderRadius: 3,
    width: '100%',
    height: '100%',
  },
});

export default Heatmap;
