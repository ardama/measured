import React, { useEffect } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useTheme, type MD3Theme } from 'react-native-paper'
import Animated, { measure, runOnJS, useAnimatedRef, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

type SliderProps = {
  style?: StyleProp<ViewStyle>
  knobWidth?: number
  knobStyle?: StyleProp<ViewStyle>
  trackStyle?: StyleProp<ViewStyle>
  value?: number
  onValueChange: (value: number) => void
}

const Slider: React.FC<SliderProps> = (props) => {
  const {  
    style,
    knobWidth = 20,
    knobStyle,
    trackStyle,
    value,
    onValueChange,
  } = props;

  const containerRef = useAnimatedRef<View>();
  const containerWidth = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const measured = measure(containerRef);
    if (measured) {
      containerWidth.value = measured.width;
      translateX.value= ((value || 0) / 100) * (measured.width - knobWidth);
    }
  }, [value, knobWidth]);

  const updateValue = (position: number) => {
    const newValue = Math.max(0, Math.min(100, Math.round(
      (position / (containerWidth.value - knobWidth)) * 100
    )));

    onValueChange(newValue);
  }

  const moveKnob = (x: number) => {
    'worklet';
    // Clamp position within bounds
    const newPosition = Math.max(0, Math.min(x - knobWidth / 2, containerWidth.value - knobWidth));

    console.log('newPosition: ', newPosition);
    translateX.value = newPosition;
    runOnJS(updateValue)(newPosition);
  };


  const panGesture = Gesture.Pan()
    .activeOffsetX(0)
    .minDistance(0)
    .onStart((event) => {
      moveKnob(event.x);
    })
    .onUpdate((event) => {
      moveKnob(event.x);
    })
    .onEnd(() => {
      // translateX.value = withSpring(translateX.value, {
      //   damping: 20,
      //   stiffness: 200,
      // });
    });

  const knobAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const theme = useTheme();
  const styles = createStyles(theme, knobWidth);

  console.log('translateX.value: ', translateX.value);
  return (
    <GestureDetector gesture={panGesture}>
      <View ref={containerRef} style={[styles.container, style]}>
        <View style={[styles.track, trackStyle]} />
        {value !== undefined && <Animated.View style={[styles.knob, knobAnimatedStyle, knobStyle]} />}
      </View>
    </GestureDetector>
  );
}

const createStyles = (theme: MD3Theme, knobWidth: number) => StyleSheet.create({
  container: {
    position: 'relative',
    flexGrow: 1,
    flexShrink: 1,
    
    height: knobWidth,
    justifyContent: 'center',
  },
  gestureContainer: {
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
  },
  track: {
    alignSelf: 'stretch',
    height: 4,
    
    backgroundColor: theme.colors.onSurface,
    borderRadius: 4,
  },
  knob: {
    position: 'absolute',
    top: 0,
    left: 0,

    width: knobWidth,
    height: knobWidth,
    borderRadius: knobWidth,
    backgroundColor: theme.colors.surface,
    elevation: 3,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default Slider;