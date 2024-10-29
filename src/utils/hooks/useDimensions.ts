import { useState, useEffect, useRef, useCallback } from 'react';
import { Dimensions, type ScaledSize } from 'react-native';

type DimensionValues = {
  window: ScaledSize,
  screen: ScaledSize,
}
const useDimensions = (throttleMs = 100) => {
  const [dimensions, setDimensions] = useState({
    window: Dimensions.get('window'),
    screen: Dimensions.get('screen')
  });

  const lastUpdateTime = useRef(0);
  const throttleTimeout = useRef<null | NodeJS.Timeout>(null);

  const throttledSetDimensions = (newDimensions: DimensionValues) => {
    const now = Date.now();
    const nextAvailableTime = lastUpdateTime.current + throttleMs;
    if (now >= nextAvailableTime) {
      setDimensions({ ...newDimensions });
      lastUpdateTime.current = now;
    } else {
      if (throttleTimeout.current) clearTimeout(throttleTimeout.current);
      throttleTimeout.current = setTimeout(() => {
        setDimensions({ ...newDimensions });
        lastUpdateTime.current = nextAvailableTime;
      }, nextAvailableTime - now);
    }
  };

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', throttledSetDimensions);

    return () => {
      subscription.remove();
      if (throttleTimeout.current) {
        clearTimeout(throttleTimeout.current);
      }
    };
  });

  return dimensions;
};

export default useDimensions;