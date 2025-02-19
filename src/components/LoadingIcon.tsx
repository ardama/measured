import { View } from 'react-native';
import { useTheme } from 'react-native-paper';
import Logo from '@a/images/m_logo_2.svg';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

type LoadingIconProps = {
  size: number;
  color: string;
};

const LoadingIcon = ({ size, color }: LoadingIconProps) => {
  const theme = useTheme();
  
  const opacity = useSharedValue(0.6);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 750 }),
        withTiming(0.6, { duration: 750 })
      ),
      -1
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 750 }),
        withTiming(1, { duration: 750 })
      ),
      -1
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }]
  }));

  return (
    <View style={{ padding: size, borderRadius: 1000, backgroundColor: theme.colors.elevation.level2 }}>
      <Animated.View style={animatedStyle}>
        <Logo
          width={size} 
          height={size}
          color={color}
        />
      </Animated.View>
    </View>
  );
};

export default LoadingIcon; 