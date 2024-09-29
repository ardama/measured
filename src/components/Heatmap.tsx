import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme, type MD3Theme } from 'react-native-paper';

type HeatmapProps = {
  data: (number | null)[][],
  style?: StyleProp<ViewStyle>,
}

const Heatmap = (props: HeatmapProps): JSX.Element => {
  const { data, style } = props;

  const theme = useTheme();
  const styles = createStyles(theme);

  let cellValues: (number | null)[] = [];
  cellValues = cellValues.concat(...data);

  const maxValue = Math.max(...cellValues.map((v) => v || 0));
  const bucketMaximums = [0, 0.2, 0.4, 0.6, 0.8, 1.0].map((v) => v * maxValue);

  return (
    <View style={[styles.container, style]}>
      {data.map((row, r) => {
        
        return (
          <View key={r} style={styles.row}>
            {row.map((cell, c) => {
  
              const bucketIndex = bucketMaximums.findIndex((max) => cell !== null && max >= (cell || 0));
            
              let cellColor = theme.colors.primary;
              let overlayColor = 'rgba(255, 255, 255, 0.95)';
              if (bucketIndex === 0) overlayColor = 'rgba(255, 255, 255, 0.85)';
              else if (bucketIndex === 1) overlayColor = 'rgba(255, 255, 255, 0.70)';
              else if (bucketIndex === 2) overlayColor = 'rgba(255, 255, 255, 0.55)';
              else if (bucketIndex === 3) overlayColor = 'rgba(255, 255, 255, 0.40)';
              else if (bucketIndex === 4) overlayColor = 'rgba(255, 255, 255, 0.25)';
              else if (bucketIndex === 5) overlayColor = 'rgba(255, 255, 255, 0.1)';
                          
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
    borderRadius: 3,
  },
  empty: {
  },
  overlay: {
    width: '100%',
    height: '100%',
  },
});

export default Heatmap;
