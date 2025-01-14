import { useCallback, useEffect, useLayoutEffect } from 'react';
import { type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

type AnimatedViewProps = {
  children?: (JSX.Element | null)[] | null,
  style: StyleProp<ViewStyle>,

  startScale?: number,
  endScale?: number,
  startX?: number,
  endX?: number,
  startY?: number,
  endY?: number,
  startLeft?: number,
  endLeft?: number,
  startOpacity?: number,
  endOpacity?: number,
  isSpring?: boolean,
  springConfig?: WithSpringConfig,
  timingConfig?: WithTimingConfig,

  isEnd: boolean,
}

const AnimatedView = (props: AnimatedViewProps) => {
  const {
    children,
    style,

    startScale = 1,
    endScale = 1,
    startX = 0,
    endX = 0,
    startY = 0,
    endY = 0,
    startLeft = 0,
    endLeft = 0,
    startOpacity = 1,
    endOpacity = 1,

    isSpring,
    springConfig = {
      damping: 40,
      mass: 0.5,
      stiffness: 100,
    },
    timingConfig = {
      duration: 250,
      easing: Easing.inOut(Easing.cubic),
    },

    isEnd,
  } = props;

  const scale = useSharedValue(startScale);
  const x = useSharedValue(startX);
  const y = useSharedValue(startY);
  const left = useSharedValue(startLeft);
  const opacity = useSharedValue(startOpacity);

  const startStyle: StyleProp<ViewStyle> = {
    left: `${startLeft}%`,
    transform: [{ scale: startScale }, { translateX: startX }, { translateY: startY }],
  }
  const animatedStyle = useAnimatedStyle(() => ({
    left: `${left.value}%`,
    transform: [{ scale: scale.value }, { translateX: x.value }, { translateY: y.value }],
    opacity: opacity.value,
  }));

  const getAnimation = useCallback((value: number) => (isSpring
    ? withSpring(value, springConfig)
    : withTiming(value, timingConfig)
  ), [isSpring, springConfig, timingConfig]);

  useEffect(() => {
    if (startScale !== endScale) scale.value = getAnimation(isEnd ? endScale : startScale);
    if (startX !== endX) x.value = getAnimation(isEnd ? endX : startX);
    if (startY !== endY) y.value = getAnimation(isEnd ? endY : startY);
    if (startLeft !== endLeft) left.value = getAnimation(isEnd ? endLeft : startLeft);
    if (startOpacity !== endOpacity) opacity.value = getAnimation(isEnd ? endOpacity : startOpacity);
  }, [isEnd]);


  return <Animated.View style={[style, startStyle, animatedStyle]}>
    {children}
  </Animated.View>
}

export default AnimatedView;