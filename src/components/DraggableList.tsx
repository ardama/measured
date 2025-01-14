import { triggerHaptic } from '@u/helpers';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  PanResponder,
  Animated,
  Pressable,
  type StyleProp,
  type ViewStyle,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type LayoutRectangle,
  Platform,
  UIManager,
} from 'react-native';

type DraggableListProps = {
  items: string[]
  renderItem: (item: string, index: number, isDragging: boolean) => JSX.Element | null
  onReorder: (items: string[]) => void
  scrollViewStyle?: StyleProp<ViewStyle>
  innerStyle?: StyleProp<ViewStyle>
  longPressDelay?: number
}

const DraggableList = ({
  items,
  renderItem,
  onReorder = () => {},
  scrollViewStyle = {},
  innerStyle = {},
  longPressDelay = 200
}: DraggableListProps) => {
  const isDragging = useRef(false);
  const [draggingIndex, setDraggingIndex] = useState<number>(-1);

  const dragSnapshot = useRef({ y: 0, scrollOffset: 0, width: 0, height: 0, current: 0});
  const draggingIndexRef = useRef(draggingIndex);
  const panY = useRef(new Animated.Value(0)).current;

  const itemsRef = useRef([...items]);
  const itemLayouts = useRef<LayoutRectangle[]>([]);
  const itemOffsets = useRef<Animated.Value[]>([]);
  
  const wrapperRef = useRef<View>(null);
  const wrapperTop = useRef(0);
  const wrapperBottom = useRef(0);
  const innerRef = useRef<View>(null);
  const maxScroll = useRef(0);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  const scrollMax = useRef(0);
  const autoScrollUpInterval = useRef<NodeJS.Timeout | null>(null);
  const autoScrollDownInterval = useRef<NodeJS.Timeout | null>(null);

  const onWrapperLayout = () => {
    wrapperRef.current?.measure((x, y, width, height, pageX, pageY) => {
      wrapperTop.current = pageY;
      wrapperBottom.current = pageY + height;

      innerRef.current?.measure((x, y, width, h, pageX, pageY) => {
        maxScroll.current = h - height;
      });
    });
  };

  useEffect(() => { itemsRef.current = [...items] }, [items]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextScrollOffset = event.nativeEvent.contentOffset.y;
    scrollOffset.current = nextScrollOffset;

    if (autoScrollUpInterval.current) panY.setValue(nextScrollOffset);
    if (autoScrollDownInterval.current) panY.setValue(nextScrollOffset + (wrapperBottom.current - wrapperTop.current) - dragSnapshot.current.height);
  }

  const measureItem = (index: number, event: LayoutChangeEvent) => {
    itemLayouts.current[index] = event.nativeEvent.layout;
  };

  const startDragging = (index: number) => {
    const itemLayout = itemLayouts.current[index];
    
    if (!itemLayout) {
      return;
    }

    dragSnapshot.current = {
      y: itemLayout.y,
      scrollOffset: scrollOffset.current,
      width: itemLayout.width,
      height: itemLayout.height,
      current: itemLayout.y,
    };
    itemOffsets.current = itemLayouts.current.map(() => new Animated.Value(0));

    setDraggingIndex(index);
    draggingIndexRef.current = index;
    panY.setValue(itemLayout.y);
  }

  const resetDragState = () => {
    panY.setValue(0);
    draggingIndexRef.current = -1;
    setPlaceholder(Infinity);
    dragSnapshot.current = { height: 0, width: 0, y: 0, scrollOffset: 0, current: 0 };
    isDragging.current = false;
  }

  const endDragging = () => {
    setDraggingIndex(-1);

    if (autoScrollUpInterval.current)  {
      clearInterval(autoScrollUpInterval.current);
      autoScrollUpInterval.current = null;
      scrollViewRef.current?.scrollTo({ y: scrollOffset.current, animated: false });
    }
    if (autoScrollDownInterval.current)  {
      clearInterval(autoScrollDownInterval.current);
      autoScrollDownInterval.current = null;
      scrollViewRef.current?.scrollTo({ y: scrollOffset.current, animated: false });
    }

    if (Platform.OS === 'web') {
      resetDragState();
    } else {
      setTimeout(() => {
        resetDragState();
      }, 0);
    }
  }

  const setPlaceholder = (placeholderIndex: number) => {
    itemOffsets.current.forEach((itemOffset, index) => {
      itemOffset.setValue(index >= placeholderIndex ? dragSnapshot.current.height : 0);
    });
  }

  // const pan = useRef(new Animated.ValueXY()).current;

  const getItemIndex = (y: number) => {
    const index = itemLayouts.current.findIndex(layout => {
      if (!layout) return false;
      return y >= layout.y && y < (layout.y + layout.height);
    });

    return index;
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isDragging.current,
      onMoveShouldSetPanResponder: () => isDragging.current,
      onMoveShouldSetPanResponderCapture: () => isDragging.current,
      
      onPanResponderGrant: (event, gestureState) => {
        const { moveY } = gestureState;
        
        const touchScrollOffset = (moveY - wrapperTop.current) + scrollOffset.current;
        const itemIndex = getItemIndex(touchScrollOffset);
        
        if (itemIndex !== -1) {
          startDragging(itemIndex);
          setPlaceholder(itemIndex);
        }
      },
      
      onPanResponderMove: (event, gestureState) => {
        const itemLayout = itemLayouts.current[draggingIndexRef.current];
        if (!itemLayout) return;

        const { y0, moveY } = gestureState;
        const itemTopBaseline = itemLayout.y + scrollOffset.current - dragSnapshot.current.scrollOffset;
        const panDistance = moveY - y0;
        
        const distanceFromScrollTop = moveY - wrapperTop.current;
        const distanceFromScrollBottom = wrapperBottom.current - moveY;

        const touchScrollOffset = distanceFromScrollTop + scrollOffset.current;
        const placeholderIndex = getItemIndex(touchScrollOffset);
        if (placeholderIndex !== -1) {
          setPlaceholder(placeholderIndex > draggingIndexRef.current ? placeholderIndex + 1 : placeholderIndex);
        }
        
        if (distanceFromScrollTop < 30) {
          if (!autoScrollUpInterval.current) {
            autoScrollUpInterval.current = setInterval(() => {
              scrollViewRef.current?.scrollTo({ y: scrollOffset.current - 100 });
            }, 120);
            return;
          }
        } else if (autoScrollUpInterval.current) {
          clearInterval(autoScrollUpInterval.current);
          autoScrollUpInterval.current = null;
          scrollViewRef.current?.scrollTo({ y: scrollOffset.current, animated: false });
        }
        
        if (distanceFromScrollBottom < 30) {
          if (!autoScrollDownInterval.current) {
            autoScrollDownInterval.current = setInterval(() => {
              scrollViewRef.current?.scrollTo({ y: Math.min(scrollOffset.current + 100, maxScroll.current) });
            }, 120);
            return;
          }
        } else if (autoScrollDownInterval.current) {
          clearInterval(autoScrollDownInterval.current);
          autoScrollDownInterval.current = null;
          scrollViewRef.current?.scrollTo({ y: scrollOffset.current, animated: false });
        }

        const nextPanY = Math.max(scrollOffset.current, Math.min(itemTopBaseline + panDistance, scrollOffset.current + (wrapperBottom.current - wrapperTop.current) - dragSnapshot.current.height));        
        dragSnapshot.current.current = nextPanY;
        panY.setValue(nextPanY);

      },
      
      onPanResponderRelease: (event, gestureState) => {
        const { moveY } = gestureState;
        const touchScrollOffset = (moveY - wrapperTop.current) + scrollOffset.current;
        const nextIndex = getItemIndex(touchScrollOffset);
        if (draggingIndexRef.current >= 0 && nextIndex >= 0) {
          const nextItems = [...itemsRef.current];
          const moved = nextItems.splice(draggingIndexRef.current, 1);
          nextItems.splice(nextIndex, 0, ...moved);
          onReorder(nextItems);
        }
        
        endDragging();
      },
      
      onPanResponderTerminate: () => {
        endDragging();
      }
    })
  ).current;

  const renderedItems = items.map((item, index) => {
    const isDraggingThis = index === draggingIndex;

    return (
      <Animated.View
        key={item}
        onLayout={(event) => draggingIndex === -1 && measureItem(index, event)}
        style={[
          isDraggingThis ? {
            position: 'absolute',
            top: panY,
            width: dragSnapshot.current.width,
            height: dragSnapshot.current.height,
            zIndex: 999,
            opacity: 1,
          } : { top: itemOffsets.current[index], opacity: draggingIndex === -1 ? undefined : 0.5 },
        ]}
      >
        <Pressable
          onPressIn={Platform.select({ web: () => isDragging.current = true })}
          onLongPress={Platform.select({ native: () => {
            triggerHaptic('selection');
            isDragging.current = true;
          }})}
          delayLongPress={100}
        >
          {renderItem(item, index, isDraggingThis)}
        </Pressable>
      </Animated.View>
    );
  });

  if (draggingIndex !== -1) {
    renderedItems.push((
      <Animated.View
        key={'extra'}
        style={[
          { height: dragSnapshot.current.height },
        ]}
        >
        </Animated.View>
    ));
  }

  return (
    <View
      ref={wrapperRef}
      onLayout={onWrapperLayout}
      {...panResponder.panHandlers} style={{ flexGrow: 1, flexShrink: 1 }}
    >
      <ScrollView
        ref={scrollViewRef}
        style={[{ flexGrow: 1, flexShrink: 1 }, scrollViewStyle]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View ref={innerRef} style={[
          innerStyle,
          {
            position: 'relative', 
            userSelect: 'none',
          }
        ]}>
          {renderedItems}
        </View>
      </ScrollView>
    </View>
  );
};

export default DraggableList;