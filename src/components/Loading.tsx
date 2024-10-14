import { StyleSheet, View } from 'react-native'
import { ActivityIndicator, Text, useTheme, type MD3Theme } from 'react-native-paper'

const LoadingScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logo}></View>
        {/* <Text style={styles.title} variant='headlineMedium'>
          Loading habits...
        </Text> */}
        <ActivityIndicator size={'large'} color={theme.colors.onSecondary} style={styles.spinner} />
      </View>
    </View>
  );
}

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    position: 'absolute',

    width: '100%',
    height: '100%',
    flex: 1,
    backgroundColor: theme.colors.secondary,

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