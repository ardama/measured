import type { Palette } from '@u/colors';
import { usePalettes } from '@u/hooks/usePalettes';
import { StyleSheet, View } from 'react-native'
import { ActivityIndicator, Text, useTheme, type MD3Theme } from 'react-native-paper'

const LoadingScreen = () => {
  const theme = useTheme();
  const { globalPalette: palette } = usePalettes();
  const styles = createStyles(theme, palette);


  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logo}></View>
        <ActivityIndicator size={'large'} color={'white'} style={styles.spinner} />
      </View>
    </View>
  );
}

const createStyles = (theme: MD3Theme, palette: Palette) => StyleSheet.create({
  container: {
    position: 'absolute',

    width: '100%',
    height: '100%',
    flex: 1,
    backgroundColor: theme.dark ? palette.backdrop : palette.secondary,
    
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    
  },
  logo: {
    
  },
  title: {
    color: theme.colors.onSecondary,
  },
  spinner: {
    
  },
});

export default LoadingScreen;