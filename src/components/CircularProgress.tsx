import React from 'react';
import { View } from 'react-native';
import { Icon } from 'react-native-paper';
import Svg, { Circle, Path } from 'react-native-svg';

type CircularProgressProps = {
  size: number;
  color: string;
  trackColor?: string;
  progress: number;
  strokeWidth?: number;
  showCheckmark?: boolean;
  icon?: string;
  iconColor?: string;
};

const CircularProgress = ({
  size = 16,
  color,
  trackColor,
  progress,
  strokeWidth = 4,
  showCheckmark = false,
  icon,
  iconColor
}: CircularProgressProps) => {
  const center = size / 2;
  const radius = (size - strokeWidth - 1) / 2;

  const innerRadius = radius;
  const circumference = 2 * Math.PI * innerRadius;
  const strokeDashoffset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <View style={{ height: size, width: size, position: 'relative' }}>
      {icon && (
        <View style={{ position: 'absolute', height: size, width: size, alignItems: 'center', justifyContent: 'center' }}>
          <Icon source={icon} size={size - (strokeWidth * 4) - 1} color={iconColor || color} />
        </View>
      )}
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor || color}
          strokeWidth={strokeWidth}
          fill={'transparent'}
          opacity={trackColor ? 1 : 0.4}
        />
        {/* Progress circle */}
        {progress > 0 && <Circle
          cx={center}
          cy={center}
          r={innerRadius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill={'transparent'}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${center} ${center})`}
          // strokeLinecap={'round'}
        />}
        {/* Checkmark */}
        {showCheckmark && (
          <Path
            d={`M ${center * 0.65} ${center * 1.02} L ${center * 0.9} ${center * 1.25} L ${center * 1.4} ${center * 0.75}`}
            stroke={color}
            strokeWidth={1.25}
            fill="none"
          />
        )}
        {/* {showCheckmark && (
          <Circle
            cx={center}
            cy={center}
            r={radius - 1.5 * strokeWidth}
            fill={color}
          />
        )} */}
      </Svg>
    </View>
  );
};

export default CircularProgress; 