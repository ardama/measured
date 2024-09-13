import Header from '@c/Header';
import { useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Icon, Menu, Surface, Text, TextInput, useTheme, type MD3Theme } from 'react-native-paper';
import { Area, Chart, HorizontalAxis, Line, VerticalAxis } from 'react-native-responsive-linechart';
import { movingAverage } from '@u/helpers';
import ToggleButtonGroup from 'react-native-paper/lib/typescript/components/ToggleButton/ToggleButtonGroup';
import { useMeasurements, useRecordings } from '@s/selectors';
import { measurementTypeData } from '@t/measurements';

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
        <Text style={{ ...s.cardTitle, color: theme.colors.primary, fontWeight: '500' }} variant='titleLarge'>This{'\n'}week</Text>
        <View style={{ ...s.pointsPerDay, marginTop: 2}}>
          <Text style={s.pointsPerDayValue} variant='bodyLarge'>{pointsPerDayWeek}</Text>
          <View style={s.pointsPerDayIcon}>
            <Icon source='star-four-points' size={16} color={theme.colors.primary} />
          </View>
          <Text style={s.pointsPerDayLabel} variant='bodyLarge'> / day</Text>
        </View>
      </View>
      <View style={s.cardRow}>
        <Text style={{ ...s.cardSubtitle, marginTop: 2, }}>Last week</Text>
        <View style={s.pointsPerDaySmall}>
          <Text style={s.pointsPerDayValueSmall} variant='bodyMedium'>{pointsPerDayLastWeek}</Text>
          <View style={s.pointsPerDayIconSmall}>
            <Icon source='star-four-points' size={14} color={theme.colors.primary} />
          </View>
          <Text style={s.pointsPerDayLabelSmall} variant='bodyMedium'> / day</Text>
        </View>
      </View>
    </Surface>
  );

  const monthCard = (
    <Surface style={{ ...s.card, ...s.cardPartial, maxWidth: 400 }}>
      <View style={s.cardHeader}>
        <Text style={{ ...s.cardTitle, color: theme.colors.primary, fontWeight: '500' }} variant='titleLarge'>This{'\n'}month</Text>
        <View style={{ ...s.pointsPerDay, marginTop: 2}}>
          <Text style={s.pointsPerDayValue} variant='bodyLarge'>{pointsPerDayMonth}</Text>
          <View style={s.pointsPerDayIcon}>
            <Icon source='star-four-points' size={16} color={theme.colors.primary} />
          </View>
          <Text style={s.pointsPerDayLabel} variant='bodyLarge'> / day</Text>
        </View>
      </View>
      <View style={s.cardRow}>
        <Text style={{ ...s.cardSubtitle, marginTop: 2, }}>Last month</Text>
        <View style={s.pointsPerDaySmall}>
          <Text style={s.pointsPerDayValueSmall} variant='bodyMedium'>{pointsPerDayLastMonth}</Text>
          <View style={s.pointsPerDayIconSmall}>
            <Icon source='star-four-points' size={14} color={theme.colors.primary} />
          </View>
          <Text style={s.pointsPerDayLabelSmall} variant='bodyMedium'> / day</Text>
        </View>
      </View>
    </Surface>
  );
  
  const chartDurationItems = [
    { title: 'Week', value: '7', icon: undefined },
    { title: 'Month', value: '30', icon: undefined },
    { title: 'Quarter', value: '90', icon: undefined },
    { title: 'Year', value: '365', icon: undefined },
    { title: 'All', value: '100000', icon: undefined },
  ];
  const [chartDurationTitle, setChartDurationTitle] = useState(chartDurationItems[1].title);
  const [chartDurationValue, setChartDurationValue] = useState(chartDurationItems[1].value);
  const chartDuration = parseInt(chartDurationValue) || 30;
  const chartDurationDropdown = (
    <MeasurementChartDropdown
      label='Duration'
      value={chartDurationTitle}
      items={chartDurationItems}
      onChange={(item) => {
        setChartDurationTitle(item.title);
        setChartDurationValue(item.value);
      }}
    />
  );
  
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
  const [chartMeasurementValue, setChartMeasurementValue] = useState(chartMeasurementItems[0]?.value);
  const selectedMeasurement = measurements.find(({ id }) => id === chartMeasurementValue);
  const chartMeasurementDropdown = (
    <MeasurementChartDropdown
      label='Measurement'
      value={chartMeasurementTitle}
      items={chartMeasurementItems}
      onChange={(item) => {
        setChartMeasurementTitle(item.title);
        setChartMeasurementValue(item.value);
      }}
    />
  );

  const recordings = useRecordings();
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

  const [averageWindow, setAverageWindow] = useState(7);
  const average = movingAverage(selectedMeasurementData.map(({ y }) => y), averageWindow);
  const averageData = selectedMeasurementData.map(( { x }, index) => average[index] === null ? null : {
    x: x,
    y: average[index],
  }).filter((average) => !!average);

  let dotSize = 8;
  if (selectedMeasurementData.length > 400) dotSize = 0;
  else if (selectedMeasurementData.length > 200) dotSize = 0;
  else if (selectedMeasurementData.length > 80) dotSize = 4;
  else if (selectedMeasurementData.length > 40) dotSize = 5;
  else if (selectedMeasurementData.length > 20) dotSize = 6;

  const chartHeight = 300;
  const chartWidth = Dimensions.get('window').width - 64;
  const chartPadding = Math.ceil(Math.max(dotSize / 2, 2));

  const verticalMin = 0;
  // const verticalMin = Math.min(...selectedMeasurementData.map(({ y }) => y));
  const verticalMax = Math.max(...selectedMeasurementData.map(({ y }) => y), selectedMeasurement?.step || 1);
  const verticalOffset = (verticalMax - verticalMin) * (chartPadding / chartHeight);

  let horizontalMin = Math.min(...selectedMeasurementData.map(({ x }) => x));
  const horizontalMax = Math.max(...selectedMeasurementData.map(({ x }) => x));
  if (horizontalMax === horizontalMin) horizontalMin -= 1;
  const horizontalOffset = (horizontalMax - horizontalMin) * (chartPadding / chartWidth);

  console.log('selectedMeasurementData: ', selectedMeasurementData);
  console.log('average: ', average);
  console.log('verticalMin: ', verticalMin);
  console.log('verticalMax: ', verticalMax);
  console.log('horizontalMin: ', horizontalMin);
  console.log('horizontalMax: ', horizontalMax);

  const measurementChartCard = (
    <Surface style={s.card}>
      <View style={s.cardHeader}>
        {chartMeasurementDropdown}
        {chartDurationDropdown}
      </View>
      <View style={s.cardRow}>
        {selectedMeasurementData.length ? (
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
              {dotSize ? (
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
                    }
                  }
                }}
              />
              ) : null}
              <Line
                data={averageData}
                theme={{
                  stroke: {
                    color: theme.colors.primary,
                    width: 4,
                  },
                  scatter: {
                    default: {
                      width: 0,
                      height: 0,
                    }
                  }
                }}
              />
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
                  {verticalMax.toFixed(0)}{selectedMeasurement?.unit ? ` ${selectedMeasurement.unit}` : ''}
                </Text>
            </View>
          </View>
        ) : null}
      </View>

      <Text>Measurement chart</Text>
      <Text>Weekly/Monthly/Quarterly toggle</Text>
      <Text>Measurement dropdown</Text>
    </Surface>
  );

  return (
    <>
      <Header title='Analytics' />
      <View style={s.container}>
        <View style={s.cards}>
          {weekCard}
          {monthCard}
          {measurementChartCard}
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
    marginBottom: 12,
  },
  cardTitle: {
    flex: 1,
  },
  cardSubtitle: {
    fontWeight: '500',
    
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 0,
  },
  pointsPerDay: {
    flexDirection: 'row',

    height: 40,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.primaryContainer,

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

    height: 24,
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
    <Menu
      style={{ maxWidth: 600 }}
      contentStyle={{ maxWidth: 600 }}
      visible={isVisible}
      onDismiss={() => setIsVisible(false)}
      anchor={
        <Pressable onPress={() => { setIsVisible(true); }}>
          <TextInput
            label={label}
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
  );
}