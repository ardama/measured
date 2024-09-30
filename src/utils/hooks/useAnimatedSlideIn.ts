import { useState, useRef, useCallback } from 'react';
import { Animated, type ViewStyle } from 'react-native';

type Direction = 'up' | 'down' | 'left' | 'right';

interface AnimatedSlideConfig {
  slideDistance?: number;
  duration?: number;
  direction?: Direction;
  bounciness?: number;
  speed?: number;
}

interface AnimatedSlideResult {
  isVisible: boolean;
  slideStyle: ViewStyle;
  show: () => void;
  hide: () => void;
}

const useAnimatedSlideIn = (config: AnimatedSlideConfig = {}): AnimatedSlideResult => {
  const {
    slideDistance = 100,
    duration = 300,
    direction = 'up',
    bounciness = 8,
    speed = 12
  } = config;

  const [isVisible, setIsVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const show = useCallback(() => {
    setIsVisible(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      bounciness,
      speed,
    }).start();
  }, [slideAnim, bounciness, speed]);

  const hide = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    }).start(() => setIsVisible(false));
  }, [slideAnim, duration]);

  const getSlideTransform = useCallback((): ViewStyle => {
    const distance = direction === 'down' || direction === 'right' ? -slideDistance : slideDistance;
    const distanceInterpolation = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [distance, 0],
    });

    const opacityInterpolation = slideAnim.interpolate({
      inputRange: [0, 0.67],
      outputRange: [0, 1],
    })

    let transform: ViewStyle['transform'];

    switch (direction) {
      case 'up':
      case 'down':
        transform = [{ translateY: distanceInterpolation }];
        break;
      case 'left':
      case 'right':
        transform = [{ translateX: distanceInterpolation }];
        break;
    }

    return { transform, opacity: opacityInterpolation };
  }, [slideAnim, slideDistance, direction]);

  const slideStyle = getSlideTransform();

  return {
    isVisible,
    slideStyle,
    show,
    hide,
  };
};

export default useAnimatedSlideIn;