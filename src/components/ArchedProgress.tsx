import React from 'react';
import { View } from 'react-native';
import Svg, { Path, G, Line } from 'react-native-svg';

interface Point {
  x: number;
  y: number;
}

interface ArchedProgressBarProps {
  width?: number;
  progress?: number;
  progressTarget?: number;
  strokeWidth?: number;
  backgroundColor?: string;
  progressColor?: string;
  progressTargetColor?: string;
  arcAngle?: number;
  tickCount?: number;
  tickLength?: number;
  tickWidth?: number;
  tickColor?: string;
}

const ArchedProgressBar: React.FC<ArchedProgressBarProps> = ({
  width = 200,
  progress = 0,
  progressTarget = 0,
  strokeWidth = 10,
  backgroundColor = '#E5E5E5',
  progressColor = '#007AFF',
  progressTargetColor = '#007AFF',
  arcAngle = 30,
  tickCount = 0,
  tickLength = 10,
  tickWidth = 2,
  tickColor = '#000000',
}) => {
  // Convert progress to a value between 0 and 1
  const normalizedProgress = Math.min(Math.max(progress, 0), 1);
  const normalizedProgressTarget = Math.min(Math.max(progressTarget, 0), 1);
  
  // Convert arc angle to radians
  const arcAngleRad = (arcAngle * Math.PI) / 180;
  
  // Account for stroke width in the actual drawing area
  const drawingWidth = width - strokeWidth;
  
  // Calculate dimensions based on the desired width
  const radius = drawingWidth / (2 * Math.sin(arcAngleRad / 2));
  
  // Calculate the height of the arc segment
  const arcHeight = radius * (1 - Math.cos(arcAngleRad / 2));
  
  // Calculate the start angle to center the arc
  const startAngle = Math.PI + (Math.PI - arcAngleRad) / 2;
  
  // Calculate center point (account for stroke width)
  const centerX = width / 2;
  const centerY = arcHeight;
  
  // Calculate viewBox dimensions and offset
  const viewBoxWidth = width;
  const viewBoxHeight = arcHeight + strokeWidth;
  const viewBoxY = -(radius - arcHeight + strokeWidth / 2);
  
  // Function to calculate point on arc
  const getPointOnArc = (angle: number): Point => {
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  // Function to calculate point at a specific distance from the arc
  const getTickEndPoint = (angle: number, distance: number): Point => {
    const directionX = Math.cos(angle);
    const directionY = Math.sin(angle);
    const start = getPointOnArc(angle);
    
    return {
      x: start.x + directionX * distance,
      y: start.y + directionY * distance,
    };
  };
  
  // Create the arc path
  const createArcPath = (startAngle: number, endAngle: number): string => {
    const start = getPointOnArc(startAngle);
    const end = getPointOnArc(endAngle);
    const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';
    
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  // Generate tick marks
  const generateTicks = () => {
    if (tickCount <= 0) return null;

    const ticks = [];
    const angleStep = arcAngleRad / tickCount;

    for (let i = 1; i < tickCount; i++) {
      const angle = startAngle + (i * angleStep);
      const start = getTickEndPoint(angle, -tickLength / 2);
      const end = getTickEndPoint(angle, tickLength / 2);

      ticks.push(
        <Line
          key={`tick-${i}`}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={tickColor}
          strokeWidth={tickWidth}
          strokeLinecap="round"
        />
      );
    }

    return ticks;
  };
  
  // Calculate the progress end angle
  const progressEndAngle = startAngle + arcAngleRad * normalizedProgress;
  const progressTargetEndAngle = startAngle + arcAngleRad * normalizedProgressTarget;
  
  // Create the background and progress paths
  const backgroundPath = createArcPath(startAngle, startAngle + arcAngleRad);
  const progressPath = createArcPath(startAngle, progressEndAngle);
  const progressTargetPath = createArcPath(startAngle, progressTargetEndAngle);
  
  return (
    <View style={{ width }}>
      <Svg
        width={width}
        height={viewBoxHeight}
        viewBox={`0 ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
      >
        <G>
          {/* Background Arc */}
          <Path
            d={backgroundPath}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          {/* Progress Target Arc */}
          {progressTarget > 0 && <Path
            d={progressTargetPath}
            stroke={progressTargetColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />}
          
          {/* Progress Arc */}
          {progress > 0 && <Path
            d={progressPath}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />}

          {/* Tick Marks */}
          {generateTicks()}
        </G>
      </Svg>
    </View>
  );
};

export default ArchedProgressBar;