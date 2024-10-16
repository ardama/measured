import Header from '@c/Header';
import { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Button, IconButton, Menu, Surface, Text, TextInput, useTheme, type MD3Theme } from 'react-native-paper';
import { Area, Chart, HorizontalAxis, Line, VerticalAxis } from 'react-native-responsive-linechart';
import { formatNumber, formatTime, movingAverage, range } from '@u/helpers';
import { useComputedHabits, useMeasurements } from '@s/selectors';
import { useIsFocused } from '@react-navigation/native';
import { SimpleDate } from '@u/dates';
import Points from '@c/Points';
import Heatmap from '@c/Heatmap';
import { computeHabit, getHabitCompletion, type ComputedHabit } from '@t/habits';
import { getMeasurementRecordingValue, getMeasurementTypeIcon } from '@t/measurements';

export default function HistoryScreen() {
  const theme = useTheme();
  const s = createStyles(theme);
  
  const measurements = useMeasurements();

  const [selectedDataIndex, setSelectedDataIndex] = useState(-1);

  const chartDurationItems = [
    { title: '1W', value: 7 },
    { title: '1M', value: 30 },
    { title: '3M', value: 90 },
    { title: '1Y', value: 365 },
    { title: 'All', value: -1 },
  ];
  const [chartDurationTitle, setChartDurationTitle] = useState(chartDurationItems[1].title);
  const chartDurationValue = chartDurationItems.find(({ title }) => title === chartDurationTitle)?.value || 30;
  const chartMeasurementItems = measurements.map(({ id, name: activity, variant, type }) => {
    return {
      title: `${activity}${variant ? ` : ${variant}` : ''}`,
      value: id,
      icon: getMeasurementTypeIcon(type),
    }
  });
  const [chartMeasurementTitle, setChartMeasurementTitle] = useState(chartMeasurementItems[0]?.title);
  const chartMeasurementValue = chartMeasurementItems.find(({ title }) => title === chartMeasurementTitle)?.value || '';
  const selectedMeasurement = measurements.find(({ id }) => id === chartMeasurementValue);
  const chartMeasurementDropdown = (
    <MeasurementChartDropdown
      label='Measurement'
      value={chartMeasurementTitle}
      items={chartMeasurementItems}
      onChange={(item) => {
        setChartMeasurementTitle(item.title);
        setSelectedDataIndex(-1);
      }}
    />
  );

  const chartTrendlineItems = [
    { title: 'None', value: '0', icon: undefined },
    { title: '7-day average', value: '7', icon: undefined },
    { title: '30-day average', value: '30', icon: undefined },
  ]
  const [chartTrendlineTitle, setChartTrendlineTitle] = useState(chartTrendlineItems[1]?.title);
  const chartTrendlineValue = chartTrendlineItems.find(({ title }) => title === chartTrendlineTitle)?.value || '';
  const chartTrendlineDropdown = (
    <MeasurementChartDropdown
      label='Trendline'
      value={chartTrendlineTitle}
      items={chartTrendlineItems}
      onChange={(item) => {
        setChartTrendlineTitle(item.title);
      }}
    />
  );

  const isFocused = useIsFocused();
  const renderMeasurementChartCard = (): JSX.Element | null => {
    const { recordings, step, unit, type } = selectedMeasurement || { recordings: [], step: 1 };
    const measurementRecordingDates = recordings.map(({ date }) => date).sort((a, b) => a.localeCompare(b)).map((date) => SimpleDate.fromString(date));
    
    const firstDateWithData = measurementRecordingDates[0];
    let chartDuration = chartDurationValue;
    if (chartDuration < 0 && firstDateWithData) chartDuration = SimpleDate.daysBetween(firstDateWithData, SimpleDate.today());
    chartDuration = Math.max(chartDuration, 1);

    const selectedMeasurementData = measurementRecordingDates.map((date) => {
      const daysAgo = SimpleDate.daysBetween(date, SimpleDate.today());
      const value = getMeasurementRecordingValue(selectedMeasurement?.id, date, measurements);
      return value === null ? null : {
        x: chartDuration - daysAgo,
        y: value,
      };
    }).filter((data) => data !== null);

    const movingAverageWindow = parseInt(chartTrendlineValue) || 0;
    const averageValues = movingAverage(selectedMeasurementData.map(({ y }) => y), movingAverageWindow);
    const averageData = selectedMeasurementData
      .map(({ x }, index) => ({
        x: x,
        y: averageValues[index],
      }))
    const filteredAverageData = averageData
      .filter((data): data is { x : number, y : number} => data.y !== null);

    let dotSize = 8;
    if (chartDuration > 400) dotSize = 1;
    else if (chartDuration > 200) dotSize = 2;
    else if (chartDuration > 80) dotSize = 4;
    else if (chartDuration > 40) dotSize = 5;
    else if (chartDuration > 20) dotSize = 6;

    const chartHeight = 300;
    const chartWidth = Dimensions.get('window').width - 72;
    const chartPadding = Math.ceil(Math.max((dotSize) / 2, 1));

    const allDataValues = [...selectedMeasurementData.map(({ y }) => y), ...averageData.map(({ y }) => y)].filter((value) => value !== null);
    const verticalStep = step || 1;
    const verticalMinRaw = allDataValues.length ? Math.min(...allDataValues) : 0;
    const verticalMinSteps = Math.floor(verticalMinRaw / verticalStep);
    const verticalMinUnits = verticalMinSteps * verticalStep;
    const verticalMaxRaw = allDataValues.length ? Math.max(...allDataValues) : 1;
    const verticalMaxSteps = Math.max(Math.ceil(verticalMaxRaw / verticalStep), verticalMinSteps + 1);
    const verticalMaxUnits = verticalMaxSteps * verticalStep;
    const verticalOffset = (verticalMaxUnits - verticalMinUnits) * (chartPadding / chartHeight);
    const verticalSteps = 1 + verticalMaxSteps - verticalMinSteps;
    const stepsPerTick = Math.ceil(verticalSteps / 5);
    const tickCount = Math.ceil(verticalSteps / stepsPerTick); 
    const ticks = range(0, tickCount)
      .map((tickIndex) => {
        const stepsFromBottom = tickIndex * stepsPerTick;
        const unitsFromBottom = stepsFromBottom * step;
        const unitsFromZero = verticalMinUnits + unitsFromBottom;
        return unitsFromZero;
      });

    let horizontalMin = 0;
    const horizontalMax = chartDuration;
    const horizontalOffset = (horizontalMax - horizontalMin) * (chartPadding / chartWidth);

    const unitString = unit ? ` ${unit}` : '';

    const selectedDateDayOffset = selectedDataIndex === -1 ? 0 : selectedMeasurementData[selectedDataIndex].x;
    const selectedDate = SimpleDate.today().toDate();
    selectedDate.setDate(selectedDate.getDate() - chartDuration + selectedDateDayOffset);
    const selectedDateString = `${SimpleDate.fromDate(selectedDate).toFormattedString(true)}: `;
    
    const selectedDateValue = selectedDataIndex === -1 ? null : selectedMeasurementData[selectedDataIndex].y;
    const selectedDateValueString = selectedDateValue === null ? '' : type === 'time' ? formatTime(selectedDateValue) : `${formatNumber(selectedDateValue)}${unitString}`;
    
    const selectedDateAverage = selectedDataIndex === -1 ? null : averageData[selectedDataIndex]?.y;
    const selectedDateAverageString = selectedDateAverage === null ? '' : type === 'time' ? formatTime(selectedDateAverage) : `${formatNumber(selectedDateAverage)}${unitString}`;
    const selectedDateAverageLabel = `${chartTrendlineTitle}: `;

    return (
      <Surface style={s.card}>
        <View style={{ ...s.cardRow, justifyContent: 'flex-start', gap: 8 }}>
          {chartMeasurementDropdown}
          {chartTrendlineDropdown}
        </View>
        <View style={s.cardRow}>
          {isFocused ? (
            <View style={s.chart}>
              <Chart
                xDomain={{
                  min: horizontalMin - horizontalOffset,
                  max: horizontalMax + horizontalOffset,
                }}
                yDomain={{
                  min: verticalMinUnits - verticalOffset,
                  max: verticalMaxUnits + verticalOffset,
                }}
                style={{
                  height: chartHeight,
                  width: chartWidth,
                }}
                padding={{
                  top: 0,
                  bottom: 0,
                }}
              >
                {selectedMeasurementData.length > 1 ? (
                  <Area
                    data={selectedMeasurementData}
                    smoothing='cubic-spline'
                    theme={{
                      gradient: {
                        from: {
                          color: theme.colors.primaryContainer,
                          opacity: 1
                        },
                        to: {
                          color: theme.colors.primaryContainer,
                          opacity: 0.0
                        }
                      }
                    }}
                  />
                ) : null}
                {selectedMeasurementData.length > 1 && movingAverageWindow && filteredAverageData.length > 1 ? (
                  <Line
                    data={filteredAverageData}
                    theme={{
                      stroke: {
                        color: theme.colors.primary,
                        width: 2,
                        dashArray:[8,4],
                      },
                      scatter: {
                        default: {
                          width: 0,
                          height: 0,
                        }
                      }
                    }}
                  />
                ) : null}
                {selectedMeasurementData.length && dotSize ? (
                  <Line
                  data={selectedMeasurementData}
                  theme={{
                    stroke: {
                      width: 0,
                    },
                    scatter: {
                      default: {
                        width: dotSize,
                        height: dotSize,
                        color: theme.colors.primary,
                        rx: dotSize,
                      },
                    }
                  }}
                  hideTooltipOnDragEnd
                  onTooltipSelect={(value, index) => {
                    setSelectedDataIndex(index);
                  }}
                  onTooltipSelectEnd={() => {
                    setSelectedDataIndex(-1);
                  }}
                  initialTooltipIndex={selectedMeasurementData.length - 1}
                />
                ) : null}
              </Chart>
              <View style={s.chartTicks} pointerEvents='none'>
                {ticks.map((value) => {
                  const height = 24;
                  const bottom = ((value - verticalMinUnits) / (verticalMaxUnits - verticalMinUnits)) * (300 - 2 * chartPadding) + chartPadding - height / 2;
                  const label = type === 'time' ? formatTime(value) : formatNumber(value);
                  return value !== verticalMaxUnits && (
                    <View key={value} style={{ ...s.chartTick, bottom, height, }}>
                      <View style={{ ...s.chartTickLine, flexGrow: 0, width: 8 }} />
                      <Text style={s.chartTickLabel} variant='bodySmall'>{label}</Text>
                      <View style={s.chartTickLine} />
                    </View>
                  )
                })}
                <View style={{ ...s.chartTick, bottom: (300 - 2 * chartPadding) + chartPadding - 24 / 2, height: 24, }}>
                  <View style={{ ...s.chartTickLine, flexGrow: 0, width: 8 }} />
                  <Text style={s.chartTickLabel} variant='bodySmall'>{type === 'time' ? formatTime(verticalMaxUnits) : `${formatNumber(verticalMaxUnits)}${unitString}`}</Text>
                  <View style={s.chartTickLine} />
                </View>
              </View>
              {selectedDataIndex < 0 ? null : (() => {
                const ratio = selectedDateDayOffset / chartDuration;
                const justifyContent = ratio > 0.7 ? 'flex-end' : ratio > 0.4 ? 'center' : 'flex-start';
                return (
                  <View style={s.chartSelectionContainer}>
                    <View style={{ ...s.chartSelectionLine, left: (selectedDateDayOffset / chartDuration) * (chartWidth - 2 * chartPadding) + chartPadding - 1 }} />
                    <View style={{ flexGrow: (selectedDateDayOffset / chartDuration) }} />
                    <View style={s.chartSelection}>
                      <View style={{ ...s.chartSelectionRow, justifyContent }}>
                        <Text style={s.chartSelectionLabel} numberOfLines={1} variant='bodyMedium'>
                          {selectedDateString}
                        </Text>
                        <Text style={s.chartSelectionValue} numberOfLines={1} variant='titleSmall'>
                          {selectedDateValueString}
                        </Text>
                      </View>
                      {selectedDateAverageString ? (
                        <View style={{ ...s.chartSelectionRow, justifyContent }}>
                          <Text style={s.chartSelectionLabel} numberOfLines={1} variant='bodyMedium'>
                            {selectedDateAverageLabel}
                          </Text>
                          <Text style={s.chartSelectionValue} numberOfLines={1} variant='titleSmall'>
                            {selectedDateAverageString}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={{ flexGrow: 1 - (selectedDateDayOffset / chartDuration) }} />
                  </View>
                )
              })()}
            </View>
          ) : null}
        </View>
        <View style={{ ...s.cardRow, ...s.chartDurationButtons }}>
          {chartDurationItems.map(({ title, value }) => {
            const selected = title === chartDurationTitle;
            return (
              <Button
                key={value}
                onPress={() => {
                  setChartDurationTitle(title);
                }}
                mode={selected ? 'contained-tonal' : 'text'}
                compact
              >
                <Text style={{ ...s.chartDurationButton, ...(selected ? s.chartDurationButtonSelected : {})}}>
                  {title}
                </Text>
              </Button>
            );
          })}
        </View>
      </Surface>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.cards}>
        <MonthSummaryCard />
        {renderMeasurementChartCard()}
      </View>
    </View>
  );
}

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,

    backgroundColor: theme.colors.elevation.level1,
  },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,

    paddingVertical: 16,
  },
  card: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,

    flex: 1,
    minWidth: '100%',

    backgroundColor: theme.colors.background,
  },
  cardPartial: {
    minWidth: 200,
    width: 'auto',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
  },
  cardSubtitle: {
    
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 0,
  },
  chart: {
    paddingTop: 52,
    paddingBottom: 24,
  },
  chartLabelVertical: {
    position: 'absolute',
    top: 4,
    left: 0,
  },
  chartLabelVerticalText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  chartLabelHorizontal: {
    position: 'absolute',
    bottom: 4,
    right: 0,
  },
  chartLabelHorizontalText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  chartTicks: {
    
  },
  chartTick: {
    position: 'absolute',
    width: '100%',
    opacity: 0.4,
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartTickLabel: {
    marginHorizontal: 6,
    color: theme.colors.onSurface,
  },
  chartTickLine: {
    flexGrow: 1,
    borderTopColor: theme.colors.onSurface,
    borderTopWidth: 2,
    height: 0,
    opacity: 0.2,
  },
  chartSelectionContainer: {
    top: 6,
    position: 'absolute',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  chartSelection: {
    flexGrow: 0,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
    backgroundColor: theme.colors.surface,
  },
  chartSelectionRow: {
    flexDirection: 'row',
  },
  chartSelectionLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  chartSelectionValue: {
    fontSize: 12,
    lineHeight: 16,
  },
  chartSelectionLine: {
    position: 'absolute',
    top: 0,
    height: 352,
    borderLeftColor: theme.colors.primary,
    borderLeftWidth: 2,
    borderEndEndRadius: 4,
    borderEndStartRadius: 4,
    borderStartEndRadius: 4,
    borderStartStartRadius: 4,
  },
  chartDurationButtons: {
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 8
  },
  chartDurationButton: {
    marginVertical: 8,
    width: 40,
  },
  chartDurationButtonSelected: {
  },
});

const MeasurementChartDropdown = ({ label, value, items, onChange
}: {
  label: string,
  value: string,
  items: { title: string, icon: string | undefined, value: string }[],
  onChange: (item: { title: string, icon: string | undefined, value: string }) => void,
}): JSX.Element => {
  const [isVisible, setIsVisible] = useState(false); 


  return (
    <View style={{ flex: 1 }}>
      <Menu
        style={{ maxWidth: 600 }}
        contentStyle={{ maxWidth: 600 }}
        visible={isVisible}
        onDismiss={() => setIsVisible(false)}
        anchor={
          <Pressable
            onPress={() => { setIsVisible(true); }}
          >
            <TextInput
              label={label}
              style={{}}
              mode='outlined'
              readOnly
              value={value}
            />
          </Pressable>
        }
        anchorPosition='bottom'
      >
        {
          items.map((item) => (
            <Menu.Item
              style={{ maxWidth: 600 }}
              contentStyle={{ maxWidth: 600 }}
              key={item.title}
              title={item.title}
              leadingIcon={item.icon}
              onPress={() => {
                onChange(item);
                setIsVisible(false);
              }}
            />
          ))
        }
      </Menu>
    </View>
  );
}

type MonthSummaryCardProps = {

};

const MonthSummaryCard = (_: MonthSummaryCardProps) : JSX.Element => {
  const theme = useTheme();
  
  const today = SimpleDate.fromDate(new Date());
  const [firstDate, setFirstDate] = useState(new SimpleDate(today.year, today.month, 1));

  const month = firstDate.month;
  const year = firstDate.year;
  const isCurrentMonth = today.month === month && today.year === year;

  const habits = useComputedHabits();
  const measurements = useMeasurements();
  const dailyHabits = habits.filter(({ isWeekly }) => !isWeekly);
  const dailyPointTarget = dailyHabits.reduce((previous: number, current: ComputedHabit) => {
    return previous + current.points * current.daysPerWeek;
  }, 0) / 7;

  const monthDates = SimpleDate.generateMonth(month, year);

  const monthDailyPoints = monthDates.map((monthDate) => {
    return dailyHabits.reduce((dailyPoints, habit) => {
      const [complete] = getHabitCompletion(computeHabit(habit, monthDate), measurements, [monthDate]);
      return dailyPoints + (complete ? habit.points : 0);
    }, 0);
  });
  const monthTotalDailyPoints = monthDailyPoints.reduce((sum, curr) => sum + curr, 0);
  
  const monthDayOffset = firstDate.getDayOfWeek();
  const monthHeatmapData: (number | null)[][] = [0, 1, 2, 3, 4, 5].map((row) => {
    return [0, 1, 2, 3, 4, 5, 6].map((column) => {
      const day = row * 7 + column - monthDayOffset + 1;
      const lastDay = monthDates.length;
      return (day > 0 && day <= lastDay) ? 0 : null;
    });
  }).filter((week) => week.findIndex((day) => day !== null) !== -1);

  monthDates.forEach((date, index) => {
    const points = monthDailyPoints[index];
    const dayIndex = date.day + monthDayOffset - 1;

    const row = Math.floor(dayIndex / 7);
    const column = dayIndex % 7;

    monthHeatmapData[row][column] = points;
  });

  const daysThisMonth = (isCurrentMonth ? today.day : monthDates.length);
  const pointsPerDayMonth = monthTotalDailyPoints / daysThisMonth;

  const cardStyles = createStyles(theme);
  const styles = createMonthSummaryStyles(theme);

  return (
    <Surface style={[cardStyles.card]}>
      <View style={cardStyles.cardHeader}>
        <Text style={[cardStyles.cardTitle, styles.title]} variant='titleLarge'>{firstDate.toFormattedMonthYear()}</Text>
        <IconButton
          style={styles.dateSelectionButton}
          icon={'chevron-left'}
          size={20}
          onPress={() => {
            setFirstDate(firstDate.getMonthsAgo(1));
          }}
        />
        <IconButton
          style={styles.dateSelectionButton}
          icon={'chevron-right'}
          size={22}
          onPress={() => {
            setFirstDate(firstDate.getMonthsAgo(-1));
          }}
          disabled={today.year === firstDate.year && today.month === firstDate.month}
        />
      </View>
      <View style={styles.pointsPerDay}>
        <Points points={pointsPerDayMonth} size='large' decimals={1} />
        <Text style={styles.pointsPerDayLabel} variant='bodyLarge'> / day</Text>
      </View>
      <Heatmap data={monthHeatmapData} target={dailyPointTarget} />
    </Surface>
  )
};

const createMonthSummaryStyles = (theme: MD3Theme) => StyleSheet.create({
  title: {
  },
  dateSelectionButton: {
    marginVertical: 0,
  },
  pointsPerDay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointsPerDayLabel: {

  },
});
