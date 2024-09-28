import Header from '@c/Header';
import { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Button, Icon, Menu, Surface, Text, TextInput, useTheme, type MD3Theme } from 'react-native-paper';
import { Area, Chart, HorizontalAxis, Line, VerticalAxis } from 'react-native-responsive-linechart';
import { movingAverage } from '@u/helpers';
import { useMeasurements, useRecordings } from '@s/selectors';
import { measurementTypeData } from '@t/measurements';
import { useIsFocused } from '@react-navigation/native';
import { SimpleDate } from '@u/dates';
import Points from '@c/Points';

export default function HomeScreen() {
  const theme = useTheme();
  const s = createStyles(theme);

  const pointsPerDayWeek = 4.2;
  const pointsPerDayLastWeek = 6.3;
  const pointsPerDayMonth = 4.1;
  const pointsPerDayLastMonth = 5.9;

  const weekCard = (
    <Surface style={{ ...s.card, ...s.cardPartial, maxWidth: 400 }}>
      <View style={s.cardHeader}>
        <Text style={{ ...s.cardTitle, color: theme.colors.primary }} variant='titleLarge'>Week</Text>
        <View style={{ ...s.pointsPerDay }}>
          <Points points={pointsPerDayWeek} size='large' />
          <Text style={s.pointsPerDayLabel} variant='bodyLarge'> / day</Text>
        </View>
      </View>
      <View style={s.cardRow}>
        <Text style={{ ...s.cardSubtitle }}>Last week</Text>
        <View style={s.pointsPerDaySmall}>
        <Points points={pointsPerDayLastWeek} size='small' />
          <Text style={s.pointsPerDayLabelSmall} variant='bodyMedium'> / day</Text>
        </View>
      </View>
    </Surface>
  );

  const monthCard = (
    <Surface style={{ ...s.card, ...s.cardPartial, maxWidth: 400 }}>
      <View style={s.cardHeader}>
        <Text style={{ ...s.cardTitle, color: theme.colors.primary }} variant='titleLarge'>Month</Text>
        <View style={{ ...s.pointsPerDay }}>
          <Points points={pointsPerDayMonth} size='large' />
          <Text style={s.pointsPerDayLabel} variant='bodyLarge'> / day</Text>
        </View>
      </View>
      <View style={s.cardRow}>
        <Text style={{ ...s.cardSubtitle }}>Last month</Text>
        <View style={s.pointsPerDaySmall}>
          <Points points={pointsPerDayLastMonth} size='small' />
          <Text style={s.pointsPerDayLabelSmall} variant='bodyMedium'> / day</Text>
        </View>
      </View>
    </Surface>
  );
  
  const chartDurationItems = [
    { title: '1W', value: '7' },
    { title: '1M', value: '30' },
    { title: '3M', value: '90' },
    { title: '1Y', value: '365' },
    { title: 'All', value: '100000' },
  ];
  const [chartDurationTitle, setChartDurationTitle] = useState(chartDurationItems[1].title);
  const chartDurationValue = chartDurationItems.find(({ title }) => title === chartDurationTitle)?.value || '';
  const chartDuration = parseInt(chartDurationValue) || 30;
  
  const measurements = useMeasurements();
  const chartMeasurementItems = measurements.map(({ id, activity, variant, type }) => {
    const typeData = measurementTypeData.find((data) => data.type === type);
    return {
      title: `${activity}${variant ? ` : ${variant}` : ''}`,
      value: id,
      icon: typeData?.icon,
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

  const recordings = useRecordings();
  const isFocused = useIsFocused();
  const renderMeasurementChartCard = (): JSX.Element | null => {
    const measurementRecordingValues = recordings.map(({ data }) => {
      const measurementRecording = data.find(({ measurementId }) => measurementId === chartMeasurementValue);
      return measurementRecording?.value || 0;
    });
    const firstDataIndex = measurementRecordingValues.findIndex((value) => !!value);
    const selectedMeasurementStartIndex = firstDataIndex >= 0 ? Math.max(measurementRecordingValues.length - chartDuration, firstDataIndex, 0) : measurementRecordingValues.length;

    const selectedMeasurementData = measurementRecordingValues.slice(selectedMeasurementStartIndex).map((value, index) => ({
      x: index,
      y: value,
    }));

    const movingAverageWindow = parseInt(chartTrendlineValue) || 0;
    const averageValues = movingAverage(measurementRecordingValues, movingAverageWindow).slice(selectedMeasurementStartIndex);
    const averageData = selectedMeasurementData.map(( { x }, index) => ({
      x: x,
      y: averageValues[index],
    }));
    const filteredAverageData = averageData.filter((data): data is { x : number, y : number} => data.y !== null);

    let dotSize = 8;
    if (selectedMeasurementData.length > 400) dotSize = 1;
    else if (selectedMeasurementData.length > 200) dotSize = 2;
    else if (selectedMeasurementData.length > 80) dotSize = 4;
    else if (selectedMeasurementData.length > 40) dotSize = 5;
    else if (selectedMeasurementData.length > 20) dotSize = 6;

    const chartHeight = 300;
    const chartWidth = Dimensions.get('window').width - 64;
    const chartPadding = Math.ceil(Math.max((dotSize + 1) / 2, 2));

    const verticalMin = 0;
    const verticalMax = Math.max(...selectedMeasurementData.map(({ y }) => y), selectedMeasurement?.step || 1);
    const verticalOffset = (verticalMax - verticalMin) * (chartPadding / chartHeight);

    let horizontalMin = Math.min(...selectedMeasurementData.map(({ x }) => x));
    const horizontalMax = Math.max(...selectedMeasurementData.map(({ x }) => x));
    if (horizontalMax === horizontalMin) {
      
      horizontalMin -= 1;
    }
    const horizontalOffset = (horizontalMax - horizontalMin) * (chartPadding / chartWidth);

    const horizontalLabel = SimpleDate.fromDate(new Date()).toString();
    const verticalLabelValueString = `${verticalMax.toFixed(0)}${selectedMeasurement?.unit ? ` ${selectedMeasurement.unit}` : ''}`;
    
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const dateIndex = selectedIndex === -1 ? 0 : selectedMeasurementData.length - 1 - selectedIndex;
    const selectedDate = new Date();
    selectedDate.setDate(selectedDate.getDate() - dateIndex);
    const selectedDateString = `${SimpleDate.fromDate(selectedDate).toFormattedString(true)}: `;
    
    const selectedDateValue = selectedIndex === -1 ? null : selectedMeasurementData[selectedIndex].y;
    const selectedDateValueString = selectedIndex === -1 ? '' : `${selectedDateValue?.toFixed(0)}${selectedMeasurement?.unit ? ` ${selectedMeasurement.unit}` : ''}`;
      
    const selectedDateAverage = selectedIndex === -1 ? null : averageData[selectedIndex]?.y;
    const selectedDateAverageString = selectedDateAverage == null ? '' : `${selectedDateAverage.toFixed(1)}${selectedMeasurement?.unit ? ` ${selectedMeasurement.unit}` : ''}`;
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
                  min: verticalMin - verticalOffset,
                  max: verticalMax + verticalOffset,
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
                {selectedMeasurementData.length ? (
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
                {selectedMeasurementData.length && movingAverageWindow && filteredAverageData.length ? (
                  <Line
                    data={filteredAverageData}
                    theme={{
                      stroke: {
                        color: theme.colors.primary,
                        width: Math.max(Math.min(4, dotSize), 2),
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
                      selected: {
                        color:theme.colors.inversePrimary,
                        width: dotSize + 1,
                        height: dotSize + 1,
                        rx: dotSize + 1,
                      }
                    }
                  }}
                  hideTooltipOnDragEnd
                  onTooltipSelect={(value, index) => {
                    setSelectedIndex(index);
                  }}
                  onTooltipSelectEnd={() => {
                    setSelectedIndex(-1);
                  }}
                />
                ) : null}
                <HorizontalAxis
                  theme={{
                    axis: {
                      visible: true,
                      stroke: {
                        color: theme.colors.primary,
                        width: 3,
                      },
                      dy: 1.5,
                    },
                    labels: {
                      visible: false,
                    }
                  }}
                />
                <VerticalAxis
                  theme={{
                    axis: {
                      visible: true,
                      stroke: {
                        color: theme.colors.primary,
                        width: 3,
                      },
                      dx: 1.5,
                    },
                    labels: {
                      visible: false,
                    }
                  }}
                />
              </Chart>
              <View style={s.chartLabelVertical}>
                <Text style={s.chartLabelVerticalText} variant='titleSmall'>
                  {verticalLabelValueString}
                </Text>
              </View>
              <View style={s.chartLabelHorizontal}>
                <Text style={s.chartLabelHorizontalText} variant='titleSmall'>
                  {horizontalLabel}
                </Text>
              </View>
              {selectedIndex >= 0 && (<Surface style={s.chartSelection}>
                <View style={s.chartSelectionRow}>
                  <Text style={s.chartSelectionLabel} variant='bodyMedium'>
                    {selectedDateString}
                  </Text>
                  <Text style={s.chartSelectionValue} variant='titleSmall'>
                    {selectedDateValueString}
                  </Text>
                </View>
                {selectedDateAverageString && (<View style={s.chartSelectionRow}>
                  <Text style={s.chartSelectionLabel} variant='bodyMedium'>
                    {selectedDateAverageLabel}
                  </Text>
                  <Text style={s.chartSelectionValue} variant='titleSmall'>
                    {selectedDateAverageString}
                  </Text>
                </View>)}

              </Surface>)}
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
    <>
      <Header title='Analytics' />
      <View style={s.container}>
        <View style={s.cards}>
          {weekCard}
          {monthCard}
          {renderMeasurementChartCard()}
        </View>
      </View>
    </>
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
    padding: 16,
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
    marginBottom: 12,
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
  pointsPerDay: {
    flexDirection: 'row',

    height: 40,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.secondaryContainer,

    borderRadius: 8,
  },
  pointsPerDayValue: {

  },
  pointsPerDayIcon: {
    marginTop: 4,
    marginLeft: 4
  },
  pointsPerDayLabel: {

  },
  pointsPerDaySmall: {
    flexDirection: 'row',
    paddingHorizontal: 6,
  },
  pointsPerDayValueSmall: {

  },
  pointsPerDayIconSmall: {
    marginTop: 3,
    marginLeft: 2
  },
  pointsPerDayLabelSmall: {

  },
  chart: {
    paddingVertical: 24,
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
  chartSelection: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    
  },
  chartSelectionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  chartSelectionLabel: {

  },
  chartSelectionValue: {

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