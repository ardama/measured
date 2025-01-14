import type { Palette } from '@u/colors';
import { usePalettes } from '@u/hooks/usePalettes';
import { ImageBackground, StatusBar, StyleSheet, View } from 'react-native'
import { useTheme, type MD3Theme } from 'react-native-paper'
import Logo from '@a/images/m_logo_2.svg';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import background from '@a/images/background_1.png';
import { useDataLoaded } from '@s/selectors';

const LoadingScreen = ({ visible }: { visible: boolean }) => {
  const dataLoaded = useDataLoaded();
  const theme = useTheme();
  const { globalPalette, getPalette } = usePalettes();
  const palette = dataLoaded ? globalPalette : getPalette('yellow');
  const styles = createStyles(theme, palette);

  const opacity = useSharedValue(visible ? 1 : 0);
  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      display: opacity.value === 0 ? 'none' : 'flex',
    }
  }, [opacity.value])

  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      opacity.value = withTiming(1, {
        duration: 0,
      });
    } else {
      setTimeout(() => {
        opacity.value = withTiming(0, {
          duration: 200,
        }, (finished) => {
          if (finished) {
            runOnJS(setShouldRender)(false);
          }
        });
      }, 500);
    }
  }, [visible]);

  if (!shouldRender) {
    return null;
  }

  return (
    <>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <Animated.View style={[styles.container, opacityStyle]}>
        <View style={styles.logoContainer}>
          <ImageBackground
          source={background}
          resizeMode="repeat"
          style={styles.logoBackground}
          tintColor={theme.colors.elevation.level5}
          imageStyle={styles.logoBackgroundImage}
        />
        <Logo
          style={styles.logo}
          height={120}
          color={palette.primary}
          />
        </View>
      </Animated.View>
    </>
  );
}

const createStyles = (theme: MD3Theme, palette: Palette) => StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%', 
    height: '100%',
    flexGrow: 1,
    flexShrink: 1,
    overflow: 'visible',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: theme.colors.elevation.level3,
  },
  logoContainer: {
    justifyContent: 'flex-start',
    position: 'relative', 
    paddingTop: 100,
    flexGrow: 1,
    alignItems: 'center',
    overflow: 'hidden',
    alignSelf: 'stretch'
  },
  logo: {
  },
  logoBackground: {
    position: 'absolute',
    top: 0,
    zIndex: -1,
    height: '100%',
    width: '100%',
    opacity: 0.2,
  },
  logoBackgroundImage: {

  },

  content: {
    
  },
  title: {
    color: theme.colors.onSecondary,
  },
  spinner: {
    
  },
});

export default LoadingScreen;